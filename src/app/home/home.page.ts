import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';

import { AiNewsItem } from '../models/ai-news.model';
import { AiNewsService } from '../services/ai-news.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  news: AiNewsItem[] = [];
  isLoading = false;
  errorMessage = '';

  newsletterEmail = '';
  newsletterError = '';
  newsletterSuccess = '';
  isSubmittingNewsletter = false;

  constructor(private readonly aiNewsService: AiNewsService) {}

  ngOnInit(): void {
    this.loadNews();
  }

  loadNews(event?: CustomEvent): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.aiNewsService
      .getLastWeekNews()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          event?.detail.complete();
        }),
      )
      .subscribe({
        next: (items) => {
          this.news = items;
        },
        error: () => {
          this.news = [];
          this.errorMessage = 'Nao consegui carregar as noticias agora. Tenta de novo daqui a pouco.';
        },
      });
  }

  subscribeNewsletter(): void {
    this.newsletterError = '';
    this.newsletterSuccess = '';

    const email = this.newsletterEmail.trim().toLowerCase();

    if (!this.isValidEmail(email)) {
      this.newsletterError = 'Digite um email valido para se inscrever.';
      return;
    }

    this.isSubmittingNewsletter = true;

    this.aiNewsService
      .subscribeToNewsletter(email)
      .pipe(
        finalize(() => {
          this.isSubmittingNewsletter = false;
        }),
      )
      .subscribe({
        next: () => {
          this.newsletterSuccess = 'Boa! Voce foi inscrito na newsletter de IA.';
          this.newsletterEmail = '';
        },
        error: () => {
          this.newsletterError = 'Nao deu para inscrever agora. Tenta de novo em instantes.';
        },
      });
  }

  trackByUrl(_: number, item: AiNewsItem): string {
    return item.url;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
