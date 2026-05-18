import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { TitleCasePipe, SlicePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TasksService } from '../../core/services/tasks.service';
import { FamilyService } from '../../core/services/family.service';
import { CreateTaskRequest, Member, Task, UpdateTaskRequest } from '../../core/models';

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'done';
type PriorityFilter = 'all' | 'low' | 'medium' | 'high';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    TitleCasePipe,
    SlicePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
  ],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss',
})
export class Tasks implements OnInit {
  private readonly tasksSvc = inject(TasksService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly family = inject(FamilyService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly tasks = signal<Task[]>([]);
  readonly statusFilter = signal<StatusFilter>('all');
  readonly priorityFilter = signal<PriorityFilter>('all');
  readonly editingTask = signal<Task | null>(null);

  readonly filteredTasks = computed(() => {
    let list = this.tasks();
    const sf = this.statusFilter();
    const pf = this.priorityFilter();
    if (sf !== 'all') list = list.filter(t => t.status === sf);
    if (pf !== 'all') list = list.filter(t => t.priority === pf);
    return list;
  });

  readonly createForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    assigned_to: [''],
    priority: ['medium' as Task['priority'], Validators.required],
    due_date: [''],
    task_list_id: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    const id = this.family.familyId();
    if (!id) { this.loading.set(false); return; }
    this.loading.set(true);
    this.tasksSvc.list(id).subscribe({
      next: tasks => { this.tasks.set(tasks); this.loading.set(false); },
      error: () => { this.loading.set(false); this.notify('Failed to load tasks.'); },
    });
  }

  createTask(): void {
    if (this.createForm.invalid) return;
    const familyId = this.family.familyId();
    if (!familyId) return;

    const v = this.createForm.getRawValue();
    const req: CreateTaskRequest = {
      title: v.title,
      priority: v.priority,
      description: v.description || undefined,
      assigned_to: v.assigned_to || undefined,
      due_date: v.due_date || undefined,
      task_list_id: v.task_list_id || undefined,
    };

    this.saving.set(true);
    this.tasksSvc.create(familyId, req).subscribe({
      next: task => {
        this.tasks.update(t => [task, ...t]);
        this.createForm.reset({ priority: 'medium' });
        this.saving.set(false);
        this.notify('Task created.');
      },
      error: () => { this.saving.set(false); this.notify('Failed to create task.'); },
    });
  }

  updateStatus(task: Task, status: Task['status']): void {
    const familyId = this.family.familyId();
    if (!familyId) return;

    const req: UpdateTaskRequest = { status };
    this.tasksSvc.update(familyId, task.id, req).subscribe({
      next: updated => {
        this.tasks.update(list => list.map(t => t.id === updated.id ? updated : t));
      },
      error: () => this.notify('Failed to update status.'),
    });
  }

  deleteTask(task: Task): void {
    const familyId = this.family.familyId();
    if (!familyId) return;

    this.tasksSvc.delete(familyId, task.id).subscribe({
      next: () => {
        this.tasks.update(list => list.filter(t => t.id !== task.id));
        this.notify('Task deleted.');
      },
      error: () => this.notify('Failed to delete task.'),
    });
  }

  startEdit(task: Task): void {
    this.editingTask.set(task);
  }

  cancelEdit(): void {
    this.editingTask.set(null);
  }

  getMemberName(userId: string | null): string {
    if (!userId) return 'Unassigned';
    return this.family.members().find(m => m.user_id === userId)?.display_name ?? 'Unknown';
  }

  nextStatus(current: Task['status']): Task['status'] {
    const map: Record<Task['status'], Task['status']> = {
      pending: 'in_progress',
      in_progress: 'done',
      done: 'pending',
    };
    return map[current];
  }

  isMyTask(task: Task): boolean {
    const me = this.family.currentMember();
    return !!me && task.assigned_to === me.user_id;
  }

  get members(): Member[] {
    return this.family.members();
  }

  private notify(msg: string): void {
    this.snackBar.open(msg, 'OK', { duration: 3000 });
  }
}
