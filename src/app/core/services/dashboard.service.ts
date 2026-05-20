import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardData } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  readonly cache = signal<DashboardData | null>(null);

  load(familyId: string): Observable<DashboardData> {
    return this.http
      .get<DashboardData>(`${environment.apiUrl}/families/${familyId}/dashboard`)
      .pipe(tap(data => this.cache.set(data)));
  }
}
