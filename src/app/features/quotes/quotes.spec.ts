import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Quotes } from './quotes';
import { FamilyService } from '../../core/services/family.service';
import { QuotesService } from '../../core/services/quotes.service';
import { of } from 'rxjs';

const mockQuote = (id: string) => ({
  id,
  family_id: 'f1',
  added_by: 'u1',
  text: 'Test quote',
  author: 'Author',
  created_at: '',
});

describe('Quotes', () => {
  let component: Quotes;
  let fixture: ComponentFixture<Quotes>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Quotes, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Quotes);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load quotes on init', () => {
    const familySvc = TestBed.inject(FamilyService);
    const quotesSvc = TestBed.inject(QuotesService);
    familySvc['_family'].set({ id: 'fam-1', name: 'Test', created_at: '' });
    spyOn(quotesSvc, 'list').and.returnValue(of([mockQuote('q1'), mockQuote('q2')]));
    fixture.detectChanges();
    expect(component.quotes().length).toBe(2);
  });

  it('should add quote to list after creation', () => {
    const quotesSvc = TestBed.inject(QuotesService);
    const familySvc = TestBed.inject(FamilyService);
    familySvc['_family'].set({ id: 'fam-1', name: 'Test', created_at: '' });
    spyOn(quotesSvc, 'list').and.returnValue(of([]));
    spyOn(quotesSvc, 'add').and.returnValue(of(mockQuote('new-q')));
    fixture.detectChanges();

    component.addForm.setValue({ text: 'New quote', author: '' });
    component.addQuote();

    expect(component.quotes().length).toBe(1);
    expect(component.quotes()[0].id).toBe('new-q');
  });

  it('should remove quote from list after deletion', () => {
    const quotesSvc = TestBed.inject(QuotesService);
    spyOn(quotesSvc, 'delete').and.returnValue(of(undefined));
    component.quotes.set([mockQuote('q1'), mockQuote('q2')]);

    component.deleteQuote(mockQuote('q1'));

    expect(component.quotes().length).toBe(1);
    expect(component.quotes()[0].id).toBe('q2');
  });
});
