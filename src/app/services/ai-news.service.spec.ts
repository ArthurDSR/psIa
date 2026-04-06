import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from 'src/environments/environment';
import { AiNewsService } from './ai-news.service';

describe('AiNewsService', () => {
  let service: AiNewsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(AiNewsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should keep only the last 7 days and sort newest first', () => {
    const now = Date.now();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
    const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();

    let resultTitles: string[] = [];

    service.getLastWeekNews().subscribe((items) => {
      resultTitles = items.map((item) => item.title);
    });

    const req = httpMock.expectOne(environment.aiNewsWebhookUrl);
    expect(req.request.method).toBe('GET');
    req.flush([
      { title: 'Old', url: 'https://example.com/old', publishedAt: tenDaysAgo },
      { title: 'Recent 2', url: 'https://example.com/recent-2', publishedAt: threeDaysAgo },
      { title: 'Recent 1', url: 'https://example.com/recent-1', publishedAt: oneDayAgo },
    ]);

    expect(resultTitles).toEqual(['Recent 1', 'Recent 2']);
  });

  it('should send newsletter email in query using GET', () => {
    const email = 'calouro@faculdade.com';

    service.subscribeToNewsletter(email).subscribe();

    const req = httpMock.expectOne(environment.aiNewsWebhookUrl + '?email=' + encodeURIComponent(email));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('email')).toBe(email);
    req.flush({ ok: true });
  });
});
