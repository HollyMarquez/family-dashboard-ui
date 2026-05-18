import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

function fakeJwt(uid: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ uid, sub: uid, exp: Math.floor(Date.now() / 1000) + 900 }));
  return `${header}.${payload}.fakesig`;
}

describe('AuthService', () => {
  let service: AuthService;
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
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('should not be authenticated with no stored token', () => {
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should restore session from localStorage', () => {
    localStorage.setItem('access_token', fakeJwt('uid-1'));
    localStorage.setItem('display_name', 'Alice');
    service['restoreSession']();
    expect(service.userId()).toBe('uid-1');
    expect(service.displayName()).toBe('Alice');
  });

  it('should authenticate on login', () => {
    service.login({ email: 'a@test.com', password: 'pass' }).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ access_token: fakeJwt('uid-1'), refresh_token: 'rt', expires_in: 900 });
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.userId()).toBe('uid-1');
  });

  it('should store display_name from registration', () => {
    service.register({ email: 'a@test.com', password: 'password1', display_name: 'Alice' }).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/auth/register`);
    req.flush({ access_token: fakeJwt('uid-1'), refresh_token: 'rt', expires_in: 900 });
    expect(service.displayName()).toBe('Alice');
  });

  it('should clear session on logout', () => {
    localStorage.setItem('access_token', fakeJwt('uid-1'));
    localStorage.setItem('refresh_token', 'rt-value');
    service['restoreSession']();

    service.logout();
    const logoutReq = http.expectOne(`${environment.apiUrl}/auth/logout`);
    logoutReq.flush(null, { status: 204, statusText: 'No Content' });

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('should return access token', () => {
    localStorage.setItem('access_token', 'my-token');
    expect(service.getAccessToken()).toBe('my-token');
  });
});
