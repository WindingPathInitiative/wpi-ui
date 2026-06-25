import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class TitleService {
  private readonly titleService = inject(Title);
  private title = 'Home';

  getTitle(): string {
    return this.title;
  }

  setTitle(newTitle: string): void {
    this.title = newTitle || 'Home';
    this.titleService.setTitle(`${this.title} – Winding Path Initiative`);
  }
}
