import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { QuotesService } from './quotes.service';
import { environment } from '../../../environments/environment';

const FAMILY = 'fam-1';

const mockQuote = () => ({
  id: 'q-1',
  family_id: FAMILY,
  added_by: 'u-1',
  text: 'Be the change.',
  author: 'Gandhi',
  created_at: '2026-01-01T00:00:00Z',
});

describe('QuotesService', () => {
  let service: QuotesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(QuotesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should list quotes', () => {
    service.list(FAMILY).subscribe(q => expect(q.length).toBe(1));
    http.expectOne(`${environment.apiUrl}/families/${FAMILY}/quotes`).flush([mockQuote()]);
  });

  it('should get random quote', () => {
    service.random(FAMILY).subscribe(q => expect(q.text).toBe('Be the change.'));
    http.expectOne(`${environment.apiUrl}/families/${FAMILY}/quotes/random`).flush(mockQuote());
  });

  it('should add quote', () => {
    service.add(FAMILY, 'Hello world', 'Author').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/families/${FAMILY}/quotes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ text: 'Hello world', author: 'Author' });
    req.flush(mockQuote());
  });

  it('should delete quote', () => {
    service.delete('q-1').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/quotes/q-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
