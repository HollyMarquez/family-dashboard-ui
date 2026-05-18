import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DashboardService } from '../../core/services/dashboard.service';
import { FamilyService } from '../../core/services/family.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardData, Task } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly dashSvc = inject(DashboardService);
  private readonly familySvc = inject(FamilyService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly auth = inject(AuthService);
  readonly family = inject(FamilyService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<DashboardData | null>(null);
  readonly showFamilyForm = signal(false);
  readonly familySaving = signal(false);

  readonly familyForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  readonly highPriorityTasks = computed(() =>
    (this.data()?.tasks ?? []).filter(t => t.priority === 'high' && t.status !== 'done')
  );

  readonly otherTasks = computed(() =>
    (this.data()?.tasks ?? []).filter(t => t.priority !== 'high' && t.status !== 'done')
  );

  ngOnInit(): void {
    const id = this.family.familyId();
    if (id) {
      this.loadData(id);
    } else {
      this.loading.set(false);
    }
  }

  private loadData(familyId: string): void {
    this.loading.set(true);
    this.dashSvc.load(familyId).subscribe({
      next: d => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load dashboard.');
        this.loading.set(false);
      },
    });
  }

  createFamily(): void {
    if (this.familyForm.invalid) return;
    this.familySaving.set(true);
    const { name } = this.familyForm.getRawValue();
    this.familySvc.createFamily(name).subscribe({
      next: f => {
        this.showFamilyForm.set(false);
        this.familySaving.set(false);
        this.loadData(f.id);
      },
      error: () => {
        this.error.set('Failed to create family.');
        this.familySaving.set(false);
      },
    });
  }

  getAssigneeName(task: Task): string {
    if (!task.assigned_to) return 'Unassigned';
    const member = this.family.members().find(m => m.user_id === task.assigned_to);
    return member?.display_name ?? 'Unknown';
  }

  formatTime(start: string, end: string, allDay: boolean): string {
    if (allDay) return 'All day';
    const fmt = (d: Date) =>
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${fmt(new Date(start))} – ${fmt(new Date(end))}`;
  }

  goToTasks(): void {
    this.router.navigate(['/tasks']);
  }
}
