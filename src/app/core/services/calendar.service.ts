import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CalendarEvent } from '../models';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly http = inject(HttpClient);
  private readonly monthCache = new Map<string, CalendarEvent[]>();

  getCached(from: string, to: string): CalendarEvent[] | null {
    return this.monthCache.get(`${from}:${to}`) ?? null;
  }

  invalidate(from: string, to: string): void {
    this.monthCache.delete(`${from}:${to}`);
  }

  list(familyId: string, from?: string, to?: string): Observable<CalendarEvent[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http
      .get<CalendarEvent[]>(`${environment.apiUrl}/families/${familyId}/calendar`, { params })
      .pipe(tap(events => {
        if (from && to) this.monthCache.set(`${from}:${to}`, events);
      }));
  }

  sync(familyId: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(
      `${environment.apiUrl}/families/${familyId}/calendar/sync`,
      {}
    );
  }

  initiateAuth(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }
}
