import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardService } from './dashboard.service';
import { environment } from '../../../environments/environment';

describe('DashboardService', () => {
  let service: DashboardService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should load dashboard data', () => {
    const mockData = { events: [], tasks: [], quote: null };
    service.load('fam-1').subscribe(d => {
      expect(d.events).toEqual([]);
      expect(d.tasks).toEqual([]);
      expect(d.quote).toBeNull();
    });
    http.expectOne(`${environment.apiUrl}/families/fam-1/dashboard`).flush(mockData);
  });
});
