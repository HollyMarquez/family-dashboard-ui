import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Family, FamilyResponse, Member, InviteMemberRequest } from '../models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FamilyService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly _family = signal<Family | null>(null);
  private readonly _members = signal<Member[]>([]);
  private readonly _currentMember = signal<Member | null>(null);

  readonly family = this._family.asReadonly();
  readonly members = this._members.asReadonly();
  readonly currentMember = this._currentMember.asReadonly();
  readonly familyId = computed(() => this._family()?.id ?? null);
  readonly isParent = computed(() => this._currentMember()?.role === 'parent');
  readonly hasFamily = computed(() => this._family() !== null);

  loadFamily(id: string): Observable<FamilyResponse> {
    return this.http
      .get<FamilyResponse>(`${environment.apiUrl}/families/${id}`)
      .pipe(
        tap(resp => {
          this._family.set(resp.family);
          this._members.set(resp.members);
          const uid = this.auth.userId();
          const me = resp.members.find(m => m.user_id === uid) ?? null;
          this._currentMember.set(me);
          if (me?.display_name) this.auth.setDisplayName(me.display_name);
          localStorage.setItem('family_id', resp.family.id);
        })
      );
  }

  loadMyFamily(): Observable<FamilyResponse> {
    return this.http
      .get<FamilyResponse>(`${environment.apiUrl}/families/me`)
      .pipe(
        tap(resp => {
          this._family.set(resp.family);
          this._members.set(resp.members);
          const uid = this.auth.userId();
          const me = resp.members.find(m => m.user_id === uid) ?? null;
          this._currentMember.set(me);
          if (me?.display_name) this.auth.setDisplayName(me.display_name);
          localStorage.setItem('family_id', resp.family.id);
        }),
        catchError(err => {
          const familyId = this.auth.getFamilyId();
          if (familyId) return this.loadFamily(familyId);
          return throwError(() => err);
        })
      );
  }

  createFamily(name: string): Observable<Family> {
    return this.http
      .post<Family>(`${environment.apiUrl}/families`, { name })
      .pipe(
        tap(family => {
          this._family.set(family);
          this._members.set([]);
          localStorage.setItem('family_id', family.id);
        })
      );
  }

  inviteMember(familyId: string, req: InviteMemberRequest): Observable<Member> {
    return this.http.post<Member>(
      `${environment.apiUrl}/families/${familyId}/members`,
      req
    );
  }

  removeMember(familyId: string, userId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/families/${familyId}/members/${userId}`
    );
  }

  setMemberTaskList(
    familyId: string,
    userId: string,
    taskListId: string
  ): Observable<{ status: string }> {
    return this.http.patch<{ status: string }>(
      `${environment.apiUrl}/families/${familyId}/members/${userId}/tasklist`,
      { task_list_id: taskListId }
    );
  }

  getStoredFamilyId(): string | null {
    return localStorage.getItem('family_id');
  }

  clearFamily(): void {
    this._family.set(null);
    this._members.set([]);
    this._currentMember.set(null);
  }
}
