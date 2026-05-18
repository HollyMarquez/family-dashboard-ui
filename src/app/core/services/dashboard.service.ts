import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardData } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  load(familyId: string): Observable<DashboardData> {
    return this.http.get<DashboardData>(
      `${environment.apiUrl}/families/${familyId}/dashboard`
    );
  }
}
