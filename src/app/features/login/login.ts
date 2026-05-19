import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { FamilyService } from '../../core/services/family.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly family = inject(FamilyService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly registerForm = this.fb.nonNullable.group({
    display_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onLogin(): void {
    if (this.loginForm.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.loginForm.getRawValue();
    this.auth.login({ email, password }).subscribe({
      next: () => this.afterAuth(),
      error: err => {
        this.error.set((err.error?.error as string) ?? 'Login failed. Check your credentials.');
        this.loading.set(false);
      },
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const req = this.registerForm.getRawValue();
    this.auth.register(req).subscribe({
      next: () => this.afterAuth(),
      error: err => {
        this.error.set((err.error?.error as string) ?? 'Registration failed. Try a different email.');
        this.loading.set(false);
      },
    });
  }

  private afterAuth(): void {
    const storedId = this.family.getStoredFamilyId();
    if (storedId) {
      this.family.loadFamily(storedId).subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: () => this.router.navigate(['/dashboard']),
      });
      return;
    }

    const familyId = this.auth.getFamilyId();
    if (familyId) {
      this.family.loadFamily(familyId).subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: () => this.router.navigate(['/dashboard']),
      });
      return;
    }

    this.family.loadMyFamily().subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => this.router.navigate(['/dashboard']),
    });
  }
}
