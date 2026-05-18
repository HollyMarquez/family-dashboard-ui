import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegisterRequest, TokenPair } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _userId = signal<string | null>(null);
  private readonly _displayName = signal<string | null>(null);

  readonly userId = this._userId.asReadonly();
  readonly displayName = this._displayName.asReadonly();
  readonly isAuthenticated = computed(() => this._userId() !== null);

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const uid = this.parseUserId(token);
    if (uid) {
      this._userId.set(uid);
      this._displayName.set(localStorage.getItem('display_name'));
    }
  }

  private parseUserId(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as Record<string, unknown>;
      return (payload['uid'] as string) ?? (payload['sub'] as string) ?? null;
    } catch {
      return null;
    }
  }

  login(req: LoginRequest): Observable<TokenPair> {
    return this.http
      .post<TokenPair>(`${environment.apiUrl}/auth/login`, req)
      .pipe(tap(pair => this.applyTokens(pair)));
  }

  register(req: RegisterRequest): Observable<TokenPair> {
    return this.http
      .post<TokenPair>(`${environment.apiUrl}/auth/register`, req)
      .pipe(
        tap(pair => {
          this.applyTokens(pair);
          localStorage.setItem('display_name', req.display_name);
          this._displayName.set(req.display_name);
        })
      );
  }

  refresh(): Observable<TokenPair> {
    const rt = localStorage.getItem('refresh_token');
    if (!rt) return throwError(() => new Error('no refresh token'));
    return this.http
      .post<TokenPair>(`${environment.apiUrl}/auth/refresh`, { refresh_token: rt })
      .pipe(tap(pair => this.applyTokens(pair)));
  }

  logout(): void {
    const rt = localStorage.getItem('refresh_token');
    if (rt) {
      this.http
        .post(`${environment.apiUrl}/auth/logout`, { refresh_token: rt })
        .subscribe({ error: () => {} });
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  setDisplayName(name: string): void {
    localStorage.setItem('display_name', name);
    this._displayName.set(name);
  }

  clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('display_name');
    localStorage.removeItem('family_id');
    this._userId.set(null);
    this._displayName.set(null);
  }

  private applyTokens(pair: TokenPair): void {
    localStorage.setItem('access_token', pair.access_token);
    localStorage.setItem('refresh_token', pair.refresh_token);
    const uid = this.parseUserId(pair.access_token);
    if (uid) this._userId.set(uid);
  }
}
