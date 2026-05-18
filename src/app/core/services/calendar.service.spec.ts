import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CalendarService } from './calendar.service';
import { environment } from '../../../environments/environment';

const FAMILY = 'fam-1';

describe('CalendarService', () => {
  let service: CalendarService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CalendarService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should list events', () => {
    service.list(FAMILY).subscribe(events => expect(events).toEqual([]));
    http.expectOne(`${environment.apiUrl}/families/${FAMILY}/calendar`).flush([]);
  });

  it('should include date range params', () => {
    service.list(FAMILY, '2026-05-01', '2026-05-31').subscribe();
    const req = http.expectOne(r => r.url.includes('/calendar'));
    expect(req.request.params.get('from')).toBe('2026-05-01');
    expect(req.request.params.get('to')).toBe('2026-05-31');
    req.flush([]);
  });

  it('should trigger sync', () => {
    service.sync(FAMILY).subscribe(r => expect(r.status).toBe('synced'));
    const req = http.expectOne(`${environment.apiUrl}/families/${FAMILY}/calendar/sync`);
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'synced' });
  });
});
