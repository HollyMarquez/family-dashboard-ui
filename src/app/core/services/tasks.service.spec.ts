import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TasksService } from './tasks.service';
import { environment } from '../../../environments/environment';

const FAMILY = 'fam-1';
const TASK_ID = 'task-1';

const mockTask = () => ({
  id: TASK_ID,
  task_list_id: 'list-1',
  title: 'Do laundry',
  description: '',
  assigned_to: null,
  priority: 'medium' as const,
  due_date: null,
  status: 'pending' as const,
});

describe('TasksService', () => {
  let service: TasksService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TasksService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should list tasks', () => {
    service.list(FAMILY).subscribe(tasks => expect(tasks.length).toBe(1));
    http.expectOne(`${environment.apiUrl}/families/${FAMILY}/tasks`).flush([mockTask()]);
  });

  it('should list tasks with status filter', () => {
    service.list(FAMILY, { status: 'pending' }).subscribe();
    const req = http.expectOne(r => r.url.includes('/tasks'));
    expect(req.request.params.get('status')).toBe('pending');
    req.flush([]);
  });

  it('should create task', () => {
    service
      .create(FAMILY, { title: 'New task', priority: 'low' })
      .subscribe(t => expect(t.title).toBe('New task'));
    const req = http.expectOne(`${environment.apiUrl}/families/${FAMILY}/tasks`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockTask(), title: 'New task' });
  });

  it('should update task status', () => {
    service
      .update(FAMILY, TASK_ID, { status: 'done' })
      .subscribe(t => expect(t.status).toBe('done'));
    const req = http.expectOne(`${environment.apiUrl}/families/${FAMILY}/tasks/${TASK_ID}`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockTask(), status: 'done' });
  });

  it('should delete task', () => {
    service.delete(FAMILY, TASK_ID).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/families/${FAMILY}/tasks/${TASK_ID}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
