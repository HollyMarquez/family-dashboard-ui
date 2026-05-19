import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TasksService } from '../../core/services/tasks.service';
import { FamilyService } from '../../core/services/family.service';
import { CreateTaskRequest, Member, Task, TaskList, UpdateTaskRequest } from '../../core/models';

type StatusFilter = 'all' | 'pending' | 'done';
type PriorityFilter = 'all' | 'low' | 'medium' | 'high';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
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
  readonly taskLists = signal<TaskList[]>([]);
  readonly statusFilter = signal<StatusFilter>('all');
  readonly priorityFilter = signal<PriorityFilter>('all');
  readonly editingTask = signal<Task | null>(null);
  readonly expandedDoneSections = signal<Set<string>>(new Set());
  readonly hiddenLists = signal<Set<string>>(new Set());

  readonly allListItems = computed(() => {
    const nameMap = new Map<string, string>();
    for (const m of this.family.members()) {
      if (m.task_list_id) nameMap.set(m.task_list_id, m.display_name);
    }
    for (const l of this.taskLists()) {
      nameMap.set(l.id, l.title);
    }
    const allIds = new Set<string>();
    for (const l of this.taskLists()) allIds.add(l.id);
    for (const t of this.tasks()) { if (t.task_list_id) allIds.add(t.task_list_id); }
    for (const m of this.family.members()) { if (m.task_list_id) allIds.add(m.task_list_id); }
    const items = [...allIds].map(id => ({ id, title: nameMap.get(id) ?? id }));
    if (this.tasks().some(t => !t.task_list_id)) {
      items.push({ id: '', title: 'Unassigned' });
    }
    return items;
  });

  readonly groupedTasks = computed(() => {
    const sf = this.statusFilter();
    const pf = this.priorityFilter();
    let filtered = this.tasks();
    if (sf !== 'all') filtered = filtered.filter(t => t.status === sf);
    if (pf !== 'all') filtered = filtered.filter(t => t.priority === pf);

    // Build name lookup: list id → title, from getLists() then member fallback
    const nameMap = new Map<string, string>();
    for (const m of this.family.members()) {
      if (m.task_list_id) nameMap.set(m.task_list_id, m.display_name);
    }
    for (const l of this.taskLists()) {
      nameMap.set(l.id, l.title);
    }

    // Collect every list id that should have a card:
    // 1. All ids from getLists() (authoritative, even if empty)
    // 2. All task_list_ids from actual tasks (so nothing gets dropped)
    // 3. Member task_list_ids (so every person's card always shows)
    const allIds = new Set<string>();
    for (const l of this.taskLists()) allIds.add(l.id);
    for (const t of this.tasks()) { if (t.task_list_id) allIds.add(t.task_list_id); }
    for (const m of this.family.members()) { if (m.task_list_id) allIds.add(m.task_list_id); }

    const groups = [...allIds].map(id => {
      const tasks = filtered.filter(t => t.task_list_id === id);
      return {
        list: { id, title: nameMap.get(id) ?? id },
        tasks,
        activeTasks: tasks.filter(t => t.status !== 'done'),
        doneTasks: tasks.filter(t => t.status === 'done'),
      };
    });

    const hidden = this.hiddenLists();

    // Only truly unassigned tasks (no task_list_id at all) go to Unassigned
    const unassigned = filtered.filter(t => !t.task_list_id);
    if (unassigned.length && !hidden.has('')) {
      groups.push({
        list: { id: '', title: 'Unassigned' },
        tasks: unassigned,
        activeTasks: unassigned.filter(t => t.status !== 'done'),
        doneTasks: unassigned.filter(t => t.status === 'done'),
      });
    }

    return groups.filter(g => !hidden.has(g.list.id));
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
    this.createForm.get('assigned_to')!.valueChanges.subscribe(userId => {
      if (userId) {
        const member = this.family.members().find(m => m.user_id === userId);
        if (member?.task_list_id) {
          this.createForm.patchValue({ task_list_id: member.task_list_id });
        }
      }
    });

    if (this.family.familyId()) {
      this.load();
    } else {
      this.family.loadMyFamily().subscribe({
        next: () => this.load(),
        error: () => this.loading.set(false),
      });
    }
  }

  private load(): void {
    const id = this.family.familyId();
    if (!id) { this.loading.set(false); return; }

    const cached = this.tasksSvc.cache();
    if (cached.length) {
      this.tasks.set(cached);
    } else {
      this.loading.set(true);
    }

    forkJoin({
      tasks: this.tasksSvc.list(id),
      lists: this.tasksSvc.getLists(id).pipe(catchError(() => of<TaskList[]>([])))
    }).subscribe({
      next: ({ tasks, lists }) => {
        this.tasks.set(tasks);
        this.taskLists.set(lists);
        this.loading.set(false);
      },
      error: () => {
        if (!cached.length) {
          this.loading.set(false);
          this.notify('Failed to load tasks.');
        }
      },
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


  toggleListVisibility(listId: string): void {
    this.hiddenLists.update(s => {
      const next = new Set(s);
      if (next.has(listId)) next.delete(listId);
      else next.add(listId);
      return next;
    });
  }

  isListVisible(listId: string): boolean {
    return !this.hiddenLists().has(listId);
  }

  toggleDoneSection(listId: string): void {
    this.expandedDoneSections.update(s => {
      const next = new Set(s);
      if (next.has(listId)) next.delete(listId);
      else next.add(listId);
      return next;
    });
  }

  isDoneSectionExpanded(listId: string): boolean {
    return this.statusFilter() === 'done' || this.expandedDoneSections().has(listId);
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
