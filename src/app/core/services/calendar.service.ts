import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CalendarEvent } from '../models';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly http = inject(HttpClient);

  list(familyId: string, from?: string, to?: string): Observable<CalendarEvent[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<CalendarEvent[]>(
      `${environment.apiUrl}/families/${familyId}/calendar`,
      { params }
    );
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
