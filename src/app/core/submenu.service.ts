import { Injectable, signal } from '@angular/core';
import { SubmenuItem } from './submenu-item.model';

@Injectable({ providedIn: 'root' })
export class SubmenuService {
  readonly items = signal<SubmenuItem[]>([]);

  setItems(items: SubmenuItem[]): void {
    this.items.set(items);
  }
}
