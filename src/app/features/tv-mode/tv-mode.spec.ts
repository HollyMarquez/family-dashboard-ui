import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TvMode } from './tv-mode';
import { ThemeService } from '../../core/services/theme.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { QuotesService } from '../../core/services/quotes.service';
import { FamilyService } from '../../core/services/family.service';
import { of } from 'rxjs';

describe('TvMode', () => {
  let component: TvMode;
  let fixture: ComponentFixture<TvMode>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TvMode, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    const dashSvc = TestBed.inject(DashboardService);
    const quotesSvc = TestBed.inject(QuotesService);
    spyOn(dashSvc, 'load').and.returnValue(of({ events: [], tasks: [], quote: null }));
    spyOn(quotesSvc, 'random').and.returnValue(
      of({ id: 'q1', family_id: 'f1', added_by: 'u1', text: 'Test quote', author: null, created_at: '' })
    );

    fixture = TestBed.createComponent(TvMode);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should enable dark theme on init', () => {
    const theme = TestBed.inject(ThemeService);
    spyOn(theme, 'enableDark');
    fixture.detectChanges();
    expect(theme.enableDark).toHaveBeenCalled();
  });

  it('should restore light theme on destroy', () => {
    const theme = TestBed.inject(ThemeService);
    spyOn(theme, 'enableLight');
    fixture.detectChanges();
    fixture.destroy();
    expect(theme.enableLight).toHaveBeenCalled();
  });

  it('should start on events screen', () => {
    fixture.detectChanges();
    expect(component.currentScreen()).toBe('events');
  });

  it('should filter out done tasks', () => {
    component.tasks.set([
      { id: '1', task_list_id: 'l', title: 'A', description: '', assigned_to: null, priority: 'low', due_date: null, status: 'pending' },
      { id: '2', task_list_id: 'l', title: 'B', description: '', assigned_to: null, priority: 'low', due_date: null, status: 'done' },
    ]);
    expect(component.pendingTasks().length).toBe(1);
  });

  it('should format all-day event time', () => {
    expect(component.formatEventTime('', '', true)).toBe('All day');
  });
});
