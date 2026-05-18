import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { QuotesService } from '../../core/services/quotes.service';
import { FamilyService } from '../../core/services/family.service';
import { Quote } from '../../core/models';

@Component({
  selector: 'app-quotes',
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
  templateUrl: './quotes.html',
  styleUrl: './quotes.scss',
})
export class Quotes implements OnInit {
  private readonly quotesSvc = inject(QuotesService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  readonly family = inject(FamilyService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly quotes = signal<Quote[]>([]);

  readonly addForm = this.fb.nonNullable.group({
    text: ['', Validators.required],
    author: [''],
  });

  ngOnInit(): void {
    const id = this.family.familyId();
    if (!id) { this.loading.set(false); return; }
    this.quotesSvc.list(id).subscribe({
      next: q => { this.quotes.set(q); this.loading.set(false); },
      error: () => { this.loading.set(false); this.notify('Failed to load quotes.'); },
    });
  }

  addQuote(): void {
    if (this.addForm.invalid) return;
    const id = this.family.familyId();
    if (!id) return;
    const { text, author } = this.addForm.getRawValue();
    this.saving.set(true);
    this.quotesSvc.add(id, text, author || undefined).subscribe({
      next: q => {
        this.quotes.update(list => [...list, q]);
        this.addForm.reset();
        this.saving.set(false);
        this.notify('Quote added.');
      },
      error: () => { this.saving.set(false); this.notify('Failed to add quote.'); },
    });
  }

  deleteQuote(quote: Quote): void {
    this.quotesSvc.delete(quote.id).subscribe({
      next: () => {
        this.quotes.update(list => list.filter(q => q.id !== quote.id));
        this.notify('Quote deleted.');
      },
      error: () => this.notify('Failed to delete quote.'),
    });
  }

  private notify(msg: string): void {
    this.snackBar.open(msg, 'OK', { duration: 3000 });
  }
}
