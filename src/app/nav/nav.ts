import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { map } from 'rxjs/operators';
import { HubService } from '../core/hub.service';
import { SubmenuService } from '../core/submenu.service';

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class NavComponent {
  private readonly oidc = inject(OidcSecurityService);
  protected readonly hub = inject(HubService);
  protected readonly submenu = inject(SubmenuService);

  protected readonly isAuthenticated = toSignal(
    this.oidc.isAuthenticated$.pipe(map(r => r.isAuthenticated)),
    { initialValue: false },
  );
  protected readonly hubUser = toSignal(this.hub.getCurrentUser(), { initialValue: null });
  protected readonly sidebarOpen = signal(false);

  protected toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected login(): void {
    this.oidc.authorize();
  }

  protected logout(): void {
    this.oidc.logoff().subscribe();
  }
}
