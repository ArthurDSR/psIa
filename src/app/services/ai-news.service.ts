import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from 'src/environments/environment';
import { AiNewsItem } from '../models/ai-news.model';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_TO_KEEP = 7;
const DEFAULT_WEBHOOK_URL =
  'https://psinteliai.app.n8n.cloud/webhook/a7d66677-54a3-4ca1-9c02-9510a9e7f12d';

@Injectable({
  providedIn: 'root',
})
export class AiNewsService {
  private readonly http = inject(HttpClient);

  getLastWeekNews(email?: string): Observable<AiNewsItem[]> {
    const params = this.createEmailParams(email);

    return this.http.get<unknown>(this.getWebhookUrl(), { params }).pipe(
      map((payload) => this.normalizeNewsPayload(payload)),
      map((items) => this.filterAndSortLastWeek(items)),
    );
  }

  subscribeToNewsletter(email: string): Observable<void> {
    const params = this.createEmailParams(email);

    return this.http.get<unknown>(this.getNewsletterWebhookUrl(), { params }).pipe(map(() => undefined));
  }

  private getWebhookUrl(): string {
    return (
      (environment as { aiNewsWebhookUrl?: string }).aiNewsWebhookUrl ?? DEFAULT_WEBHOOK_URL
    );
  }

  private getNewsletterWebhookUrl(): string {
    return this.getWebhookUrl();
  }

  private normalizeNewsPayload(payload: unknown): AiNewsItem[] {
    const rawItems = this.extractItems(payload);

    return rawItems
      .map((item) => this.mapItem(item))
      .filter((item): item is AiNewsItem => item !== null);
  }

  private extractItems(payload: unknown): unknown[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (typeof payload !== 'object' || payload === null) {
      return [];
    }

    const candidate = payload as Record<string, unknown>;

    if (Array.isArray(candidate['items'])) {
      return candidate['items'];
    }

    if (Array.isArray(candidate['news'])) {
      return candidate['news'];
    }

    if (Array.isArray(candidate['data'])) {
      return candidate['data'];
    }

    return [];
  }

  private mapItem(item: unknown): AiNewsItem | null {
    if (typeof item !== 'object' || item === null) {
      return null;
    }

    const entry = item as Record<string, unknown>;

    const title = this.pickString(entry, ['title', 'headline', 'name']);
    const url = this.pickString(entry, ['url', 'link', 'sourceUrl']);
    const publishedAt = this.pickDate(entry, ['publishedAt', 'date', 'published', 'createdAt', 'datetime']);

    if (!title || !url || !publishedAt) {
      return null;
    }

    return {
      title,
      url,
      publishedAt,
      summary: this.pickString(entry, ['summary', 'description', 'snippet', 'content']),
      source: this.pickString(entry, ['source', 'sourceName', 'provider']),
    };
  }

  private pickString(entry: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = entry[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return undefined;
  }

  private pickDate(entry: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = entry[key];
      const date = this.parseDate(value);
      if (date) {
        return date.toISOString();
      }
    }

    return undefined;
  }

  private parseDate(value: unknown): Date | null {
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  }

  private filterAndSortLastWeek(items: AiNewsItem[]): AiNewsItem[] {
    const cutoff = Date.now() - DAYS_TO_KEEP * MS_PER_DAY;

    return items
      .filter((item) => {
        const publishedAt = new Date(item.publishedAt).getTime();
        return !Number.isNaN(publishedAt) && publishedAt >= cutoff;
      })
      .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime());
  }

  private createEmailParams(email?: string): HttpParams {
    if (!email) {
      return new HttpParams();
    }

    return new HttpParams().set('email', email);
  }
}
