import { provideAuth, LogLevel } from 'angular-auth-oidc-client';
import { environment } from '../../environments/environment';

export const authProviders = provideAuth({
  config: {
    authority: environment.cognito.authority,
    redirectUrl: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    clientId: environment.cognito.clientId,
    scope: 'openid profile email',
    responseType: 'code',
    logLevel: environment.production ? LogLevel.None : LogLevel.Debug,
  },
});
