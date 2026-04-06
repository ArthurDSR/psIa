import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { of, throwError } from 'rxjs';

import { AiNewsService } from '../services/ai-news.service';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let aiNewsServiceSpy: jasmine.SpyObj<AiNewsService>;

  beforeEach(async () => {
    aiNewsServiceSpy = jasmine.createSpyObj<AiNewsService>('AiNewsService', [
      'getLastWeekNews',
      'subscribeToNewsletter',
    ]);
    aiNewsServiceSpy.getLastWeekNews.and.returnValue(of([]));
    aiNewsServiceSpy.subscribeToNewsletter.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      declarations: [HomePage],
      imports: [IonicModule.forRoot(), FormsModule],
      providers: [{ provide: AiNewsService, useValue: aiNewsServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load news on init', () => {
    expect(aiNewsServiceSpy.getLastWeekNews).toHaveBeenCalled();
    expect(component.errorMessage).toBe('');
    expect(component.isLoading).toBeFalse();
  });

  it('should set an error message when request fails', () => {
    aiNewsServiceSpy.getLastWeekNews.and.returnValue(
      throwError(() => new Error('Request failed')),
    );

    component.loadNews();

    expect(component.news).toEqual([]);
    expect(component.errorMessage).toContain('Nao consegui carregar as noticias');
    expect(component.isLoading).toBeFalse();
  });

  it('should validate newsletter email before sending', () => {
    component.newsletterEmail = 'email-invalido';

    component.subscribeNewsletter();

    expect(aiNewsServiceSpy.subscribeToNewsletter).not.toHaveBeenCalled();
    expect(component.newsletterError).toContain('Digite um email valido');
  });

  it('should subscribe with normalized email', () => {
    component.newsletterEmail = '  Aluno@Teste.com  ';

    component.subscribeNewsletter();

    expect(aiNewsServiceSpy.subscribeToNewsletter).toHaveBeenCalledWith('aluno@teste.com');
    expect(component.newsletterSuccess).toContain('Voce foi inscrito');
    expect(component.newsletterEmail).toBe('');
  });
});
