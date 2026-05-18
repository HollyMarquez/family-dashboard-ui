import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Quote } from '../models';

@Injectable({ providedIn: 'root' })
export class QuotesService {
  private readonly http = inject(HttpClient);

  list(familyId: string): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${environment.apiUrl}/families/${familyId}/quotes`);
  }

  random(familyId: string): Observable<Quote> {
    return this.http.get<Quote>(`${environment.apiUrl}/families/${familyId}/quotes/random`);
  }

  add(familyId: string, text: string, author?: string): Observable<Quote> {
    return this.http.post<Quote>(`${environment.apiUrl}/families/${familyId}/quotes`, {
      text,
      author: author || undefined,
    });
  }

  delete(quoteId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/quotes/${quoteId}`);
  }
}
