import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Dashboard } from './dashboard';
import { FamilyService } from '../../core/services/family.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { of } from 'rxjs';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show setup card when no family', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(component.family.hasFamily()).toBeFalse();
    expect(el.querySelector('.setup-card')).toBeTruthy();
  });

  it('should show dashboard grid when family and data loaded', () => {
    const familySvc = TestBed.inject(FamilyService);
    const dashSvc = TestBed.inject(DashboardService);

    familySvc['_family'].set({ id: 'fam-1', name: 'Test', created_at: '' });
    familySvc['_members'].set([]);

    spyOn(dashSvc, 'load').and.returnValue(of({ events: [], tasks: [], quote: null }));
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.dash-grid')).toBeTruthy();
  });

  it('getAssigneeName should return display name when member found', () => {
    const familySvc = TestBed.inject(FamilyService);
    familySvc['_members'].set([
      { id: 'm1', family_id: 'f1', user_id: 'u1', display_name: 'Alice', avatar_url: '', role: 'parent', task_list_id: '', joined_at: '' },
    ]);
    fixture.detectChanges();

    const task = {
      id: 't1', task_list_id: 'l1', title: 'Test', description: '',
      assigned_to: 'u1', priority: 'low' as const, due_date: null, status: 'pending' as const,
    };
    expect(component.getAssigneeName(task)).toBe('Alice');
  });

  it('getAssigneeName should return Unassigned when no assigned_to', () => {
    fixture.detectChanges();
    const task = {
      id: 't1', task_list_id: 'l1', title: 'Test', description: '',
      assigned_to: null, priority: 'low' as const, due_date: null, status: 'pending' as const,
    };
    expect(component.getAssigneeName(task)).toBe('Unassigned');
  });
});
