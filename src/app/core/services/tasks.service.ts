import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateTaskRequest, Task, TaskList, UpdateTaskRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);

  readonly cache = signal<Task[]>([]);

  list(
    familyId: string,
    filters?: { status?: string; assigned_to?: string }
  ): Observable<Task[]> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.assigned_to) params = params.set('assigned_to', filters.assigned_to);
    return this.http
      .get<Task[]>(`${environment.apiUrl}/families/${familyId}/tasks`, { params })
      .pipe(tap(tasks => {
        if (!filters?.status && !filters?.assigned_to) this.cache.set(tasks);
      }));
  }

  create(familyId: string, req: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(`${environment.apiUrl}/families/${familyId}/tasks`, req);
  }

  update(familyId: string, taskId: string, req: UpdateTaskRequest): Observable<Task> {
    return this.http.patch<Task>(
      `${environment.apiUrl}/families/${familyId}/tasks/${taskId}`,
      req
    );
  }

  delete(familyId: string, taskId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/families/${familyId}/tasks/${taskId}`
    );
  }

  move(familyId: string, taskId: string, taskListId: string): Observable<Task> {
    return this.http.post<Task>(
      `${environment.apiUrl}/families/${familyId}/tasks/${taskId}/move`,
      { task_list_id: taskListId }
    );
  }

  getLists(familyId: string): Observable<TaskList[]> {
    return this.http.get<TaskList[]>(
      `${environment.apiUrl}/families/${familyId}/tasks/lists`
    );
  }

  initiateAuth(familyId: string): void {
    window.location.href = `${environment.apiUrl}/families/${familyId}/tasks/auth`;
  }
}
