import { Component, inject, computed } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  NavigationEnd,
  Router,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from './core/services/auth.service';
import { FamilyService } from './core/services/family.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly auth = inject(AuthService);
  readonly family = inject(FamilyService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: '' }
  );

  readonly isTvMode = computed(() => this.currentUrl().startsWith('/tv'));
  readonly showNav = computed(() => this.auth.isAuthenticated() && !this.isTvMode());

  logout(): void {
    this.auth.logout();
    this.family.clearFamily();
  }
}
