import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  effect,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../core/services/dashboard.service';
import { QuotesService } from '../../core/services/quotes.service';
import { FamilyService } from '../../core/services/family.service';
import { ThemeService } from '../../core/services/theme.service';
import { CalendarEvent, Quote, Task } from '../../core/models';

type Screen = 'events' | 'tasks' | 'quote';

const ROTATE_INTERVAL_MS = 30_000;
const REFRESH_INTERVAL_MS = 5 * 60_000;

@Component({
  selector: 'app-tv-mode',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './tv-mode.html',
  styleUrl: './tv-mode.scss',
})
export class TvMode implements OnInit, OnDestroy {
  private readonly dashSvc = inject(DashboardService);
  private readonly quotesSvc = inject(QuotesService);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly family = inject(FamilyService);

  readonly currentScreen = signal<Screen>('events');
  readonly currentTime = signal('');
  readonly currentDate = signal('');
  readonly events = signal<CalendarEvent[]>([]);
  readonly tasks = signal<Task[]>([]);
  readonly quote = signal<Quote | null>(null);
  readonly visible = signal(true);

  readonly pendingTasks = computed(() =>
    this.tasks().filter(t => t.status !== 'done')
  );

  private rotateTimer?: ReturnType<typeof setInterval>;
  private refreshTimer?: ReturnType<typeof setInterval>;
  private clockTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.theme.enableDark();
    this.loadData();
    this.startClock();
    this.startRotation();
    this.startRefresh();
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.rotateTimer);
    clearInterval(this.refreshTimer);
    clearInterval(this.clockTimer);
    this.theme.enableLight();
    if (isPlatformBrowser(this.platformId) && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  private loadData(): void {
    const id = this.family.familyId();
    if (!id) return;
    this.dashSvc.load(id).subscribe(data => {
      this.events.set(data.upcoming_events ?? []);
      this.tasks.set(data.pending_tasks ?? []);
    });
    this.quotesSvc.random(id).subscribe(q => this.quote.set(q));
  }

  private startClock(): void {
    const update = () => {
      const now = new Date();
      this.currentTime.set(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      this.currentDate.set(
        now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
      );
    };
    update();
    this.clockTimer = setInterval(update, 10_000);
  }

  private startRotation(): void {
    const screens: Screen[] = ['events', 'tasks', 'quote'];
    let idx = 0;
    this.rotateTimer = setInterval(() => {
      this.visible.set(false);
      setTimeout(() => {
        idx = (idx + 1) % screens.length;
        this.currentScreen.set(screens[idx]);
        if (screens[idx] === 'quote') {
          const id = this.family.familyId();
          if (id) this.quotesSvc.random(id).subscribe(q => this.quote.set(q));
        }
        this.visible.set(true);
      }, 400);
    }, ROTATE_INTERVAL_MS);
  }

  private startRefresh(): void {
    this.refreshTimer = setInterval(() => this.loadData(), REFRESH_INTERVAL_MS);
  }

  exitKiosk(): void {
    if (isPlatformBrowser(this.platformId) && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    this.router.navigate(['/dashboard']);
  }

  formatEventTime(start: string, end: string, allDay: boolean): string {
    if (allDay) return 'All day';
    const fmt = (d: Date) =>
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${fmt(new Date(start))} – ${fmt(new Date(end))}`;
  }
}
