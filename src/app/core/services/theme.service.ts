import { Injectable, inject, signal, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly _isDark = signal(false);

  readonly isDark = this._isDark.asReadonly();

  constructor() {
    effect(() => {
      this.document.body.classList.toggle('dark-theme', this._isDark());
    });
  }

  enableDark(): void {
    this._isDark.set(true);
  }

  enableLight(): void {
    this._isDark.set(false);
  }
}
