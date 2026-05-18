import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Tasks } from './tasks';
import { FamilyService } from '../../core/services/family.service';
import { TasksService } from '../../core/services/tasks.service';
import { of } from 'rxjs';

const mockTask = (overrides = {}) => ({
  id: 't1', task_list_id: 'l1', title: 'Test task', description: '',
  assigned_to: 'u1', priority: 'medium' as const, due_date: null, status: 'pending' as const,
  ...overrides,
});

describe('Tasks', () => {
  let component: Tasks;
  let fixture: ComponentFixture<Tasks>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Tasks, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Tasks);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should filter tasks by status', () => {
    component.tasks.set([
      mockTask({ id: '1', status: 'pending' }),
      mockTask({ id: '2', status: 'done' }),
    ]);
    component.statusFilter.set('pending');
    expect(component.filteredTasks().length).toBe(1);
    expect(component.filteredTasks()[0].status).toBe('pending');
  });

  it('should filter tasks by priority', () => {
    component.tasks.set([
      mockTask({ id: '1', priority: 'high' }),
      mockTask({ id: '2', priority: 'low' }),
    ]);
    component.priorityFilter.set('high');
    expect(component.filteredTasks().length).toBe(1);
  });

  it('nextStatus should cycle correctly', () => {
    expect(component.nextStatus('pending')).toBe('in_progress');
    expect(component.nextStatus('in_progress')).toBe('done');
    expect(component.nextStatus('done')).toBe('pending');
  });

  it('should identify own tasks', () => {
    const familySvc = TestBed.inject(FamilyService);
    familySvc['_currentMember'].set({
      id: 'm1', family_id: 'f1', user_id: 'u1', display_name: 'Alice',
      avatar_url: '', role: 'child', task_list_id: 'l1', joined_at: '',
    });
    fixture.detectChanges();
    expect(component.isMyTask(mockTask({ assigned_to: 'u1' }))).toBeTrue();
    expect(component.isMyTask(mockTask({ assigned_to: 'u2' }))).toBeFalse();
  });

  it('should load tasks on init when family exists', () => {
    const familySvc = TestBed.inject(FamilyService);
    const tasksSvc = TestBed.inject(TasksService);
    familySvc['_family'].set({ id: 'fam-1', name: 'Test', created_at: '' });
    spyOn(tasksSvc, 'list').and.returnValue(of([mockTask()]));
    fixture.detectChanges();
    expect(component.tasks().length).toBe(1);
  });
});
