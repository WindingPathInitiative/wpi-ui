import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, shareReplay } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiErrorResponse, Office, OrgUnit, OrgUnitSearch, User, UserSearch } from './models';

@Injectable({ providedIn: 'root' })
export class HubService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.hub.url;

  readonly orgUnitTypes = signal<string[]>([]);
  readonly venueTypes = signal<unknown[]>([]);
  readonly officeRoles = signal<Record<string, string>>({});
  readonly currentUserId = signal(-1);

  private currentUser$: Observable<User | null> | null = null;

  constructor() {
    this.http.get<string[]>(`${this.base}org-unit/types`).subscribe(r => this.orgUnitTypes.set(r));
    this.http.get<unknown[]>(`${this.base}org-unit/venues`).subscribe(r => this.venueTypes.set(r));
    this.http.get<Record<string, string>>(`${this.base}office/roles`).subscribe(r => this.officeRoles.set(r));
  }

  getCurrentUser(): Observable<User | null> {
    if (!this.currentUser$) {
      this.currentUser$ = this.http
        .get<User>(`${this.base}user/me`, { params: { offices: 1, children: 1 } })
        .pipe(
          tap(user => this.currentUserId.set(user.id)),
          catchError(() => of(null)),
          shareReplay(1),
        );
    }
    return this.currentUser$;
  }

  getOrgUnitAuthority(id: number): Observable<Office[]> {
    return this.getCurrentUser().pipe(
      switchMap(user => {
        if (!user?.offices?.length) return of([] as Office[]);
        return this.http
          .get<{ offices: Office[] }>(
            `${this.base}office/verify/orgunit/${id}`,
            { params: { roles: Object.keys(this.officeRoles()).join(',') } },
          )
          .pipe(
            map(r => r.offices),
            catchError(() => of([] as Office[])),
          );
      }),
    );
  }

  getOfficerAuthority(officeId: number): Observable<Office[]> {
    return this.http
      .get<{ offices: Office[] }>(
        `${this.base}office/verify/office/${officeId}`,
        { params: { roles: Object.keys(this.officeRoles()).join(',') } },
      )
      .pipe(
        map(r => r.offices),
        catchError(() => of([] as Office[])),
      );
  }

  getUserAuthority(userId: number): Observable<Office[]> {
    return this.http
      .get<{ offices: Office[] }>(
        `${this.base}office/verify/user/${userId}`,
        { params: { roles: Object.keys(this.officeRoles()).join(',') } },
      )
      .pipe(
        map(r => r.offices),
        catchError(() => of([] as Office[])),
      );
  }

  getUser(id: number | 'me', options: Record<string, unknown> = {}): Observable<User | ApiErrorResponse> {
    return this.http
      .get<User>(`${this.base}user/${id}`, { params: options as Record<string, string | number> })
      .pipe(
        catchError((error: { error?: { status?: number; message?: string }; message?: string }) => {
          const resp: ApiErrorResponse = {
            error: true,
            status: error.error?.status ?? 0,
            message: error.error?.message ?? error.message ?? 'Unknown server error',
          };
          return of(resp);
        }),
      );
  }

  getUsers(search: UserSearch): Observable<User[]> {
    let params = new HttpParams({ fromObject: search as Record<string, string> });
    if (search.type === 'Any') params = params.delete('type');
    return this.http.get<User[]>(`${this.base}user`, { params });
  }

  getOrgUnits(search: OrgUnitSearch): Observable<OrgUnit[]> {
    const { types, ...rest } = search;
    let params = new HttpParams({ fromObject: rest as Record<string, string> });
    if (types?.length) params = params.set('types', types.join(','));
    if (!params.toString().length) params = params.set('type', 'Nation');
    return this.http.get<OrgUnit[]>(`${this.base}org-unit`, { params });
  }

  getOrgUnit(id: number, limited = false): Observable<OrgUnit> {
    const p = limited
      ? { users: '0', offices: '0', parents: '0', children: '0' }
      : { users: '1', offices: '1', parents: '-1', children: '-1' };
    return this.http.get<OrgUnit>(`${this.base}org-unit/${id}`, { params: p });
  }

  updateOrgUnit(orgUnit: OrgUnit, office: Office): Observable<OrgUnit> {
    const body: Record<string, unknown> = { useOffice: office.id };
    for (const f of ['name', 'code', 'location', 'defDoc', 'website'] as const) {
      if (orgUnit[f]) body[f] = orgUnit[f];
    }
    return this.http.put<OrgUnit>(`${this.base}org-unit/${orgUnit.id}`, body);
  }

  addOrgUnit(orgUnit: Partial<OrgUnit>, parentID: number, office: Office): Observable<OrgUnit> {
    const body: Record<string, unknown> = { parentID, useOffice: office.id };
    for (const f of ['name', 'code', 'type', 'venueType', 'location', 'defDoc', 'website'] as const) {
      if ((orgUnit as Record<string, unknown>)[f]) body[f] = (orgUnit as Record<string, unknown>)[f];
    }
    return this.http.post<OrgUnit>(`${this.base}org-unit`, body);
  }

  getOffice(officeId: number): Observable<Office> {
    return this.http.get<Office>(`${this.base}office/${officeId}`);
  }

  assignOffice(officeId: number, userId: number, officer: Office): Observable<unknown> {
    return this.http.put(`${this.base}office/${officeId}/assign/${userId}`, { useOffice: officer.id });
  }

  updateOffice(updateOffice: Partial<Office>, officer: Office): Observable<Office> {
    const body: Record<string, unknown> = { useOffice: officer.id };
    for (const f of ['name', 'email', 'roles'] as const) {
      if ((updateOffice as Record<string, unknown>)[f]) body[f] = (updateOffice as Record<string, unknown>)[f];
    }
    return this.http.put<Office>(`${this.base}office/${updateOffice.id}`, body);
  }

  addAssistantOffice(addOffice: Partial<Office>, officer: Office): Observable<Office> {
    const body: Record<string, unknown> = { useOffice: officer.id };
    for (const f of ['name', 'email', 'roles'] as const) {
      if ((addOffice as Record<string, unknown>)[f]) body[f] = (addOffice as Record<string, unknown>)[f];
    }
    return this.http.post<Office>(`${this.base}office/${addOffice.parentOfficeID}/assistant`, body);
  }

  deleteAssistantOffice(officeId: number, officer: Office): Observable<unknown> {
    return this.http.delete(`${this.base}office/${officeId}/assistant`, {
      params: { useOffice: officer.id },
    });
  }

  assignMember(userId: number, orgUnitId: number, officer: Office): Observable<unknown> {
    return this.http.put(`${this.base}user/${userId}/assign/${orgUnitId}`, { useOffice: officer.id });
  }

  approveMember(userId: number, officer: Office): Observable<unknown> {
    return this.http.put(`${this.base}user/${userId}/approve`, { useOffice: officer.id });
  }

  addUser(user: Partial<User>, officer: Office): Observable<User> {
    const body: Record<string, unknown> = { useOffice: officer.id };
    for (const f of ['firstName', 'lastName', 'nickname', 'orgUnit', 'address', 'email'] as const) {
      if ((user as Record<string, unknown>)[f]) body[f] = (user as Record<string, unknown>)[f];
    }
    return this.http.post<User>(`${this.base}user`, body);
  }
}
