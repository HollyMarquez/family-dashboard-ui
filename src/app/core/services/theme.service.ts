import { Injectable, inject, signal, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly _isDark = signal(this.resolveInitialTheme());

  readonly isDark = this._isDark.asReadonly();

  constructor() {
    effect(() => {
      const dark = this._isDark();
      this.document.documentElement.classList.toggle('dark-theme', dark);
      try {
        localStorage.setItem('theme', dark ? 'dark' : 'light');
      } catch {
        // localStorage unavailable (e.g. private browsing restrictions)
      }
    });
  }

  toggleTheme(): void {
    this._isDark.update(v => !v);
  }

  setDark(dark: boolean): void {
    this._isDark.set(dark);
  }

  private resolveInitialTheme(): boolean {
    try {
      const saved = localStorage.getItem('theme');
      if (saved !== null) return saved === 'dark';
    } catch {
      // ignore
    }
    return typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  }
}
