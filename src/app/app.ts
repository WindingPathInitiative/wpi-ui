import { Component, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './nav/nav';
import { SubmenuService } from './core/submenu.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly submenu = inject(SubmenuService);
  protected readonly hasSubmenu = computed(() => this.submenu.items().length > 0);
}
