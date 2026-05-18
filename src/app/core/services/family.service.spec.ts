import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { FamilyService } from './family.service';
import { environment } from '../../../environments/environment';

describe('FamilyService', () => {
  let service: FamilyService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(FamilyService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('should initialize with no family', () => {
    expect(service.hasFamily()).toBeFalse();
    expect(service.familyId()).toBeNull();
  });

  it('should load family and set members', () => {
    service.loadFamily('fam-1').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/families/fam-1`);
    req.flush({
      family: { id: 'fam-1', name: 'Marquez', created_at: '2026-01-01T00:00:00Z' },
      members: [
        { id: 'm1', family_id: 'fam-1', user_id: 'u1', display_name: 'Alice', avatar_url: '', role: 'parent', task_list_id: '', joined_at: '' },
      ],
    });
    expect(service.hasFamily()).toBeTrue();
    expect(service.family()?.name).toBe('Marquez');
    expect(service.members().length).toBe(1);
    expect(localStorage.getItem('family_id')).toBe('fam-1');
  });

  it('should create family and persist id', () => {
    service.createFamily('My Family').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/families`);
    req.flush({ id: 'fam-2', name: 'My Family', created_at: '2026-01-01T00:00:00Z' });
    expect(service.hasFamily()).toBeTrue();
    expect(localStorage.getItem('family_id')).toBe('fam-2');
  });

  it('should not set parent role when current user is not in member list', () => {
    service.loadFamily('fam-1').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/families/fam-1`);
    req.flush({
      family: { id: 'fam-1', name: 'Test', created_at: '' },
      members: [
        { id: 'm1', family_id: 'fam-1', user_id: 'other-user', display_name: 'Other', avatar_url: '', role: 'parent', task_list_id: '', joined_at: '' },
      ],
    });
    // auth.userId() is null (no token), so current member won't match
    expect(service.isParent()).toBeFalse();
  });
});
