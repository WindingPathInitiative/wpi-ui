import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return inject(OidcSecurityService).getIdToken().pipe(
    switchMap(token =>
      token
        ? next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
        : next(req)
    )
  );
};
