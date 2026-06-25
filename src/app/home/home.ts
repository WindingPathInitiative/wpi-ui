import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { HubService } from '../core/hub.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class HomeComponent {
  private readonly oidc = inject(OidcSecurityService);
  protected readonly hub = inject(HubService);
  protected readonly hubUser = toSignal(this.hub.getCurrentUser(), { initialValue: null });

  protected login(): void { this.oidc.authorize(); }
  protected register(): void { this.oidc.authorize(); }
}
