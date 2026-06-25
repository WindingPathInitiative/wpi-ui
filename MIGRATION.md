# Migration Plan: wpi-ui (Angular 8) → wpi-ui-new (Angular 22)

## Overview

This document tracks the migration from the legacy `wpi-ui` Angular 8 app to the new `wpi-ui-new` Angular 22 app. The jump spans 14 major versions and involves significant architectural changes.

**Node version note:** Use `nvm use 10` when running commands in `wpi-ui` (for reference only). Use `nvm use 24` (default) for all work in `wpi-ui-new`.

**Angular CLI MCP:** Available and functional for `wpi-ui-new` only.

---

## Key Differences at a Glance

| Concern | wpi-ui (old) | wpi-ui-new (new) |
|---|---|---|
| Angular | 8.2.14 | 22.0.0 |
| TypeScript | 3.5.3 | 6.0.2 |
| Architecture | NgModules | Standalone components |
| State | Services + RxJS | Signals + RxJS where needed |
| Forms | Reactive / Template | Signal Forms (v22 stable) |
| Templates | `*ngIf`, `*ngFor` | `@if`, `@for`, `@switch` |
| Change detection | Explicit OnPush | Default OnPush in v22 |
| DI | Constructor injection | `inject()` function |
| Testing (unit) | Jasmine + Karma | Vitest |
| Testing (e2e) | Protractor (deprecated) | Playwright (to be added) |
| Linting | TSLint (deprecated) | ESLint (to be added) |
| Styles | SCSS + Bootstrap 4 | CSS (consider Tailwind or keep Bootstrap 5) |
| Auth | Cognito (dev) + Auth0 (prod) | Cognito via OIDC library → Keycloak (future) |
| Date library | moment.js | Native `Intl` / `date-fns` (drop moment) |

---

## Application Structure to Migrate

```
Modules / Routes:
  /           → HomeModule
  /auth       → AuthModule (login, register, confirm, forgot, resend, password, logout, redirect)
  /locations  → LocationsModule (guarded: list, detail)
  /members    → MembersModule (guarded: list, detail)

Core services:
  CognitoService     - AWS Cognito authentication
  GuardService       - Route guard (CanActivate)
  HubService         - HTTP API client
  SubmenuService     - Sidebar state
  TitleService       - Page title management

Shared components:
  MemberSearchComponent
  MemberTransferComponent
  OrgunnitDropdownComponent  (ControlValueAccessor)
  OrgunnitSearchComponent

Models:
  User, UserSearch, Office, OrgUnit, OrgUnitSearch, PasswordChange, ApiErrorResponse
```

---

## Phase 1 — Foundation & Auth Strategy

**Goal:** Decisions and project-level setup before any code is written.

### 1.1 Authentication approach — Cognito now, Keycloak later

Auth stays on AWS Cognito for the initial migration, with a future move to a local Keycloak server.

**The key insight:** both Cognito and Keycloak are standard OIDC providers. Using a generic OIDC client library means the switch to Keycloak is purely a config change — no application code changes.

**Use `angular-auth-oidc-client`** (`npm install angular-auth-oidc-client`):
- Supports any OIDC/OAuth2 provider (Cognito, Keycloak, Auth0, etc.)
- Handles token storage, silent refresh, and session management
- Provides a ready-made `AuthGuard` functional guard
- Switch providers by changing config values only

**Cognito OIDC config (now):**
```ts
// src/app/core/auth.config.ts
import { provideAuth, LogLevel } from 'angular-auth-oidc-client';

export const authProviders = provideAuth({
  config: {
    authority: 'https://cognito-idp.us-east-1.amazonaws.com/<POOL_ID>',
    redirectUrl: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    clientId: '<CLIENT_ID>',
    scope: 'openid profile email',
    responseType: 'code',
    logLevel: LogLevel.Debug,
  },
});
```

**Keycloak OIDC config (future swap — only these values change):**
```ts
export const authProviders = provideAuth({
  config: {
    authority: 'http://localhost:8080/realms/<REALM>',
    redirectUrl: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    clientId: '<KEYCLOAK_CLIENT_ID>',
    scope: 'openid profile email',
    responseType: 'code',
  },
});
```

The rest of the app — guards, interceptors, `AuthService` usage in components — is identical for both providers. The `CognitoService` from the old app is **not** ported; `angular-auth-oidc-client`'s `OidcSecurityService` replaces it entirely.

**Drop `amazon-cognito-identity-js`** — it was needed because the old app called Cognito's proprietary SDK directly. The new app will use Cognito's standard OIDC endpoints instead, which all environments support.

**Auth flow change:** The old app had a custom login UI (LoginComponent, RegisterComponent, etc.) talking to the Cognito SDK. With OIDC, login/register/password-reset happen on the provider's hosted UI. The `auth` feature module shrinks to just a redirect handler and a logout route. If a fully custom login UI is required later, `angular-auth-oidc-client` supports resource owner password flow, but the redirect-to-provider approach is more secure and works identically for Keycloak.

### 1.2 Decide on CSS/component library

- **Option A — Bootstrap 5:** Familiar migration from Bootstrap 4. Drop `ngx-bootstrap` and use native Bootstrap 5 JS or `ng-bootstrap`.
- **Option B — Tailwind CSS:** Utility-first, pairs well with Angular 22 component architecture.
- **Option C — Angular Material:** Google's official component library, strong a11y support.

> **Recommendation:** Bootstrap 5 + `ng-bootstrap` for lowest friction when porting existing templates. Can migrate to Tailwind later.

### 1.3 Setup tasks

- [ ] Add ESLint: `ng add @angular-eslint/schematics`
- [ ] Add Playwright for e2e: `npm install -D @playwright/test`
- [ ] Add chosen CSS library
- [ ] Add `angular-auth-oidc-client`: `npm install angular-auth-oidc-client`
- [ ] Add `date-fns` (replaces moment.js): `npm install date-fns`
- [ ] Create `src/environments/` with `environment.ts`, `environment.prod.ts`, `environment.beta.ts` mirroring the old app's structure
- [ ] Set up SCSS if continuing to use it (change `styles.css` → `styles.scss` in angular.json)
- [ ] Add `@ng-select/ng-select` v13+ (compatible with Angular 22) or replace with a native `<select>` + CDK
- [ ] Add `ngx-toastr` v19+ (compatible with Angular 22) or replace with Angular Material snackbar

---

## Phase 2 — Core Infrastructure

**Goal:** Recreate the core module's services as root-level singletons in standalone style.

All services use `providedIn: 'root'` and `inject()` instead of constructor injection.

### 2.1 Models

Copy the model interfaces verbatim — they are plain TypeScript and require no changes:

- `src/app/core/models/user.ts`
- `src/app/core/models/user-search.ts`
- `src/app/core/models/office.ts`
- `src/app/core/models/org-unit.ts`
- `src/app/core/models/org-unit-search.ts`
- `src/app/core/models/password-change.ts`
- `src/app/core/models/api-error-response.ts`
- `src/app/core/models/index.ts`

### 2.2 HubService (API client)

This is the most important service — all feature modules depend on it.

Old pattern:
```ts
// Old
constructor(private http: HttpClient, private cookie: CookieService) {}
```

New pattern:
```ts
// New
private http = inject(HttpClient);
private cookie = inject(CookieService);
```

Migration steps:
- [ ] Create `src/app/core/hub.service.ts`
- [ ] Replace constructor injection with `inject()`
- [ ] Keep RxJS `Observable` returns — signals are for local/component state, not async HTTP
- [ ] Add `HttpClient` to `app.config.ts` providers via `provideHttpClient(withFetch())`
- [ ] Migrate environment-based base URL (use `APP_INITIALIZER` or injection token)

### 2.3 Auth service

No custom auth service — `OidcSecurityService` from `angular-auth-oidc-client` is the auth service. Inject it directly wherever auth state is needed.

- [ ] Create `src/app/core/auth.config.ts` with `provideAuth(...)` for Cognito (see Phase 1.1)
- [ ] Add `authProviders` to `app.config.ts` alongside `provideRouter`, `provideHttpClient`, etc.
- [ ] Create `src/app/core/auth.interceptor.ts` to attach the bearer token to API requests:
  ```ts
  export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = inject(OidcSecurityService).getAccessToken();
    return token
      ? next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
      : next(req);
  };
  ```
  Register with `provideHttpClient(withInterceptors([authInterceptor]))`.
- [ ] Create `src/app/core/auth.guard.ts` using the library's built-in guard:
  ```ts
  // Option 1 — use the library's guard directly
  import { autoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';
  export const authGuard = autoLoginPartialRoutesGuard;

  // Option 2 — thin wrapper if you need custom logic
  export const authGuard: CanActivateFn = () =>
    inject(OidcSecurityService).isAuthenticated$.pipe(
      map(({ isAuthenticated }) => isAuthenticated || inject(Router).createUrlTree(['/']))
    );
  ```

### 2.4 Supporting services

- [ ] `src/app/core/submenu.service.ts` — replace `BehaviorSubject` with `signal()`
- [ ] `src/app/core/title.service.ts` — use Angular's built-in `Title` service or `TitleStrategy`

### 2.5 Routing setup

Replace `app-routing.module.ts` with entries in `src/app/app.routes.ts`:
```ts
export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home').then(m => m.HomeComponent) },
  { path: 'auth', loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES) },
  { path: 'locations', loadChildren: () => import('./locations/locations.routes').then(m => m.LOCATIONS_ROUTES), canActivate: [authGuard] },
  { path: 'members', loadChildren: () => import('./members/members.routes').then(m => m.MEMBERS_ROUTES), canActivate: [authGuard] },
];
```

---

## Phase 3 — Feature Migration

Each feature module becomes a folder of standalone components sharing a `*.routes.ts` file. No `*.module.ts` files.

### 3.1 Auth feature (`/auth`)

With `angular-auth-oidc-client`, login/register/forgot-password/confirm all happen on Cognito's (and later Keycloak's) hosted UI. The entire old `auth` module shrinks to two routes:

- `/auth/callback` — receives the OIDC redirect, exchanges the code, then sends the user home
- `/auth/logout` — calls `OidcSecurityService.logoff()` and redirects

**Do not port** `LoginComponent`, `RegisterComponent`, `ConfirmComponent`, `ForgotComponent`, `ResendComponent`, `PasswordComponent` — these are all replaced by the provider's hosted UI.

- [ ] Create `src/app/auth/auth.routes.ts` with only two routes: `callback` and `logout`
- [ ] Create `src/app/auth/callback.ts` — calls `OidcSecurityService.checkAuth()` then `Router.navigate(['/'])`
- [ ] Create `src/app/auth/logout.ts` — calls `OidcSecurityService.logoff()`
- [ ] Configure Cognito's App Client to allow the callback and logout URLs (same URLs, just change domain when switching to Keycloak)

**If a custom login UI is non-negotiable**, note it here and revisit — it requires enabling Cognito's resource owner password flow and is significantly more work to keep provider-agnostic.

### 3.2 Home feature (`/`)

Simple dashboard — lowest complexity.

- [ ] Create `src/app/home/home.ts` (standalone, inline template if small)

### 3.3 Locations feature (`/locations`)

- [ ] Create `src/app/locations/locations.routes.ts`
- [ ] Migrate components:
  - `LocationListComponent`
  - `LocationListItemComponent`
  - `LocationComponent`
  - `LocationOfficerComponent`
  - `OfficeFormComponent`
- [ ] Replace `@Input()`/`@Output()` with `input()`/`output()`
- [ ] Use `@for (item of items; track item.id)` — the `track` expression is **required** in v17+

### 3.4 Members feature (`/members`)

- [ ] Create `src/app/members/members.routes.ts`
- [ ] Migrate components:
  - `MembersComponent`
  - `MemberComponent`

---

## Phase 4 — Shared Components

These components are used across multiple features.

### 4.1 OrgUnitDropdownComponent

This is a `ControlValueAccessor` — the interface is unchanged in Angular 22 but the component becomes standalone.

- [ ] Create `src/app/shared/orgunit-dropdown/orgunit-dropdown.ts`
- [ ] Keep `ControlValueAccessor` implementation; no API change
- [ ] Register via `NG_VALUE_ACCESSOR` in the `providers` array of the standalone component decorator

### 4.2 Other shared components

- [ ] `MemberSearchComponent` → `src/app/shared/member-search/member-search.ts`
- [ ] `MemberTransferComponent` → `src/app/shared/member-transfer/member-transfer.ts`
- [ ] `OrgUnitSearchComponent` → `src/app/shared/orgunit-search/orgunit-search.ts`

No `SharedModule` needed — import components directly where used.

---

## Phase 5 — Layout & Navigation

- [ ] Migrate `NavComponent` → `src/app/nav/nav.ts` (standalone)
- [ ] Replace `ng-sidebar` with a CSS-only sidebar or Angular CDK overlay
- [ ] Update `AppComponent` (`src/app/app.ts`) to include `NavComponent`, `RouterOutlet`, and toast container
- [ ] Migrate global styles from `src/styles.scss` to `src/styles.css` (or keep SCSS if configured)

---

## Phase 6 — Testing

### Unit tests (Vitest)

The new project uses Vitest instead of Jasmine + Karma. Test files stay as `*.spec.ts` but use Vitest globals.

Old Jasmine test:
```ts
import { TestBed } from '@angular/core/testing';
describe('...', () => {
  it('...', () => { expect(true).toBeTruthy(); });
});
```

New Vitest test (same `TestBed` API, different globals):
```ts
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
describe('...', () => {
  it('...', () => { expect(true).toBeTruthy(); });
});
```

- [ ] Write unit tests for all services (HubService, AuthService, SubmenuService)
- [ ] Write unit tests for ControlValueAccessor component (OrgUnitDropdown)
- [ ] Write unit tests for route guards

### E2E tests (Playwright)

- [ ] Replace Protractor e2e tests with Playwright
- [ ] Cover: login flow, location list/detail, member list/detail

---

## Phase 7 — Environment & Build

- [ ] Set up three environment configurations in `angular.json`: development, beta, production
- [ ] Use `fileReplacements` for `environment.ts` per build config (same pattern as old app)
- [ ] Verify build budgets in `angular.json` — old app had 6kb component style warning; new app defaults to 500kb initial/1MB error
- [ ] Configure CSP headers if deploying with Auth0 (requires `frame-src`, `connect-src` additions)

---

## Deprecated Packages — Replacements

| Old package | Reason deprecated | Replacement |
|---|---|---|
| `moment` | Deprecated, large bundle | `date-fns` or native `Intl.DateTimeFormat` |
| `ngx-bootstrap` | Angular 8-era | `ng-bootstrap` (Bootstrap 5 + Angular 22) |
| `ng-sidebar` | Unmaintained | Angular CDK overlay or CSS-only drawer |
| `tslint` | Deprecated | ESLint + `@angular-eslint` |
| `protractor` | Deprecated | Playwright |
| `karma` + `jasmine` | Replaced in this project | Vitest (already in new project) |
| `rxjs-compat` | Only needed for v5→v6 transition | Drop — use rxjs 7 directly |
| `core-js` polyfills | Needed for ES5 targets | Drop — ES2022 target doesn't need them |
| `amazon-cognito-identity-js` | Proprietary SDK; replaced by standard OIDC flow | `angular-auth-oidc-client` (works with Cognito and Keycloak) |

---

## Angular API Migration Cheat Sheet

| Old (v8) | New (v22) |
|---|---|
| `@NgModule({...})` | Remove — use standalone components |
| `@Component({ standalone: true })` | Just `@Component({})` — standalone is default |
| `@Input() foo` | `foo = input<T>()` |
| `@Output() bar = new EventEmitter()` | `bar = output<T>()` |
| `@HostBinding('class.foo')` | `host: { '[class.foo]': 'expr' }` |
| `@HostListener('click')` | `host: { '(click)': 'handler()' }` |
| `constructor(private s: Service)` | `private s = inject(Service)` |
| `*ngIf="cond"` | `@if (cond) { }` |
| `*ngFor="let x of xs"` | `@for (x of xs; track x.id) { }` |
| `*ngSwitch` | `@switch (val) { @case(x) { } }` |
| `ChangeDetectionStrategy.OnPush` | Default — don't set it |
| `SharedModule` | Import components directly |
| `RouterModule.forRoot(routes)` | `provideRouter(routes)` in `app.config.ts` |
| `HttpClientModule` | `provideHttpClient()` in `app.config.ts` |
| `BrowserAnimationsModule` | `provideAnimations()` in `app.config.ts` |
| `new BehaviorSubject(x)` (for state) | `signal(x)` |
| `observable$.pipe(map(...))` (derived) | `computed(() => ...)` |

---

## Migration Order (Suggested)

```
1. Phase 1  — Decisions + project setup (ESLint, auth SDK, CSS lib, environments)
2. Phase 2  — Models (copy as-is)
3. Phase 2  — HubService (core API client, everything depends on it)
4. Phase 2  — AuthService + auth guard
5. Phase 2  — Supporting services (submenu, title)
6. Phase 2  — Root routing (app.routes.ts)
7. Phase 3  — Home feature (simplest, verify routing works)
8. Phase 4  — Shared components (features depend on them)
9. Phase 3  — Auth feature
10. Phase 3 — Locations feature
11. Phase 3 — Members feature
12. Phase 5 — Layout + nav
13. Phase 6 — Tests
14. Phase 7 — Build config + environments
```

---

## Known Issues from Old App

- `TODO`: *"Why does the office authority observable go get the user in getCurrentUser again?"* — investigate `LocationOfficerComponent` before porting that logic.
- `TODOMIGRATE` (now resolved by version upgrades): `ngx-toastr` and `@ng-select/ng-select` had peer dep conflicts with Angular 8 — both have current releases compatible with Angular 22.

---

## Reference: Old Project Structure → New File Locations

| Old path | New path |
|---|---|
| `src/app/app.module.ts` | `src/app/app.config.ts` (providers) + `src/app/app.ts` |
| `src/app/app-routing.module.ts` | `src/app/app.routes.ts` |
| `src/app/modules/core/` | `src/app/core/` |
| `src/app/modules/auth/` | `src/app/auth/` |
| `src/app/modules/home/` | `src/app/home/` |
| `src/app/modules/locations/` | `src/app/locations/` |
| `src/app/modules/members/` | `src/app/members/` |
| `src/app/modules/shared/` | `src/app/shared/` |
| `src/environments/` | `src/environments/` (same) |
| `*.module.ts` files | Delete — no NgModules |
| `*-routing.module.ts` files | `*.routes.ts` files |
