import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CalendarService } from '../../core/services/calendar.service';
import { FamilyService } from '../../core/services/family.service';
import { CalendarEvent } from '../../core/models';

interface CalendarCell {
  dateStr: string;
  dayNum: number;
  events: CalendarEvent[];
  isToday: boolean;
  inMonth: boolean;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
})
export class Calendar implements OnInit {
  private readonly calendarSvc = inject(CalendarService);
  private readonly snackBar = inject(MatSnackBar);

  readonly family = inject(FamilyService);
  readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  readonly loading = signal(true);
  readonly syncing = signal(false);
  readonly events = signal<CalendarEvent[]>([]);
  readonly viewDate = signal(new Date());
  readonly selectedDay = signal<string | null>(null);

  private readonly todayStr = this.fmtDate(new Date());

  readonly monthLabel = computed(() =>
    this.viewDate().toLocaleString('default', { month: 'long', year: 'numeric' })
  );

  readonly groupedEvents = computed(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of this.events()) {
      const day = e.start_time.slice(0, 10);
      const list = map.get(day) ?? [];
      list.push(e);
      map.set(day, list);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, events]) => ({ day, events }));
  });

  readonly filteredGroups = computed(() => {
    const sel = this.selectedDay();
    return sel ? this.groupedEvents().filter(g => g.day === sel) : this.groupedEvents();
  });

  readonly calendarGrid = computed((): CalendarCell[] => {
    const d = this.viewDate();
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const eventsMap = new Map<string, CalendarEvent[]>();
    for (const e of this.events()) {
      const key = e.start_time.slice(0, 10);
      const list = eventsMap.get(key) ?? [];
      list.push(e);
      eventsMap.set(key, list);
    }

    const cells: CalendarCell[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      const date = new Date(year, month, i - firstDayOfWeek + 1);
      const dateStr = this.fmtDate(date);
      cells.push({ dateStr, dayNum: date.getDate(), events: eventsMap.get(dateStr) ?? [], isToday: dateStr === this.todayStr, inMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = this.fmtDate(date);
      cells.push({ dateStr, dayNum: day, events: eventsMap.get(dateStr) ?? [], isToday: dateStr === this.todayStr, inMonth: true });
    }

    const trailing = 42 - cells.length;
    for (let i = 1; i <= trailing; i++) {
      const date = new Date(year, month + 1, i);
      const dateStr = this.fmtDate(date);
      cells.push({ dateStr, dayNum: i, events: eventsMap.get(dateStr) ?? [], isToday: dateStr === this.todayStr, inMonth: false });
    }

    return cells;
  });

  ngOnInit(): void {
    if (this.family.familyId()) {
      this.load();
    } else {
      this.family.loadMyFamily().subscribe({
        next: () => this.load(),
        error: () => this.loading.set(false),
      });
    }
  }

  prevMonth(): void {
    const d = new Date(this.viewDate());
    d.setMonth(d.getMonth() - 1);
    this.viewDate.set(d);
    this.selectedDay.set(null);
    this.load();
  }

  nextMonth(): void {
    const d = new Date(this.viewDate());
    d.setMonth(d.getMonth() + 1);
    this.viewDate.set(d);
    this.selectedDay.set(null);
    this.load();
  }

  selectDay(dateStr: string): void {
    this.selectedDay.update(cur => cur === dateStr ? null : dateStr);
  }

  clearSelection(): void {
    this.selectedDay.set(null);
  }

  sync(): void {
    const familyId = this.family.familyId();
    if (!familyId) return;
    this.syncing.set(true);
    this.calendarSvc.sync(familyId).subscribe({
      next: () => {
        this.syncing.set(false);
        this.notify('Calendar synced.');
        const d = this.viewDate();
        const from = this.fmtDate(new Date(d.getFullYear(), d.getMonth(), 1));
        const to = this.fmtDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
        this.calendarSvc.invalidate(from, to);
        this.load();
      },
      error: () => { this.syncing.set(false); this.notify('Sync failed.'); },
    });
  }

  formatTime(iso: string, allDay: boolean): string {
    if (allDay) return 'All day';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private fmtDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private load(): void {
    const familyId = this.family.familyId();
    if (!familyId) { this.loading.set(false); return; }

    const d = this.viewDate();
    const from = this.fmtDate(new Date(d.getFullYear(), d.getMonth(), 1));
    const to = this.fmtDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));

    const cached = this.calendarSvc.getCached(from, to);
    if (cached) {
      this.events.set(cached);
      this.loading.set(false);
    } else {
      this.loading.set(true);
    }

    this.calendarSvc.list(familyId, from, to).subscribe({
      next: evts => { this.events.set(evts); this.loading.set(false); },
      error: () => {
        if (!cached) {
          this.loading.set(false);
          this.notify('Failed to load events.');
        }
      },
    });
  }

  private notify(msg: string): void {
    this.snackBar.open(msg, 'OK', { duration: 3000 });
  }
}
