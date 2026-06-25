import { Component, OnInit, inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-logout',
  template: '<p>Signing out…</p>',
})
export class LogoutComponent implements OnInit {
  private readonly oidc = inject(OidcSecurityService);

  ngOnInit(): void {
    this.oidc.logoff().subscribe();
  }
}
