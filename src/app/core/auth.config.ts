import { provideAuth, LogLevel } from 'angular-auth-oidc-client';
import { environment } from '../../environments/environment';

export const authProviders = provideAuth({
  config: {
    authority: environment.keycloak.authority,
    redirectUrl: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    clientId: environment.keycloak.clientId,
    scope: 'openid profile email',
    responseType: 'code',
    logLevel: environment.production ? LogLevel.None : LogLevel.Debug,
  },
});
