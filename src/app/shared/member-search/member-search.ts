import { Component, OnInit, OnDestroy, input, output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { OrgunitDropdownComponent } from '../orgunit-dropdown/orgunit-dropdown';
import { HubService } from '../../core/hub.service';
import { User, UserSearch } from '../../core/models';

const MEMBERSHIP_TYPES = ['Any', 'None', 'Full', 'Suspended', 'Resigned', 'Expelled'];

@Component({
  selector: 'app-member-search',
  imports: [FormsModule, OrgunitDropdownComponent],
  templateUrl: './member-search.html',
})
export class MemberSearchComponent implements OnInit, OnDestroy {
  readonly defaultType = input<string>();
  readonly disabledTypes = input<string[]>();
  readonly defaultOrgUnitId = input<number>();

  readonly selectedMember = output<User | null>();

  private readonly hub = inject(HubService);
  protected readonly membershipTypeOptions = MEMBERSHIP_TYPES;
  protected readonly users = signal<User[]>([]);
  protected readonly selected = signal<User | null>(null);
  protected searchParams: UserSearch = { type: 'Any' };

  private readonly criteria$ = new BehaviorSubject<UserSearch>(this.searchParams);
  private sub!: Subscription;

  ngOnInit(): void {
    if (this.defaultType()) {
      const idx = MEMBERSHIP_TYPES.indexOf(this.defaultType()!);
      if (idx !== -1) this.searchParams.type = MEMBERSHIP_TYPES[idx];
    }
    if (this.defaultOrgUnitId()) this.searchParams.orgUnit = this.defaultOrgUnitId();

    this.sub = this.criteria$
      .pipe(switchMap(s => this.hub.getUsers(s)))
      .subscribe(users => this.users.set(users));
  }

  protected search(): void {
    this.selectMember(null);
    this.criteria$.next({ ...this.searchParams });
  }

  protected selectMember(member: User | null): void {
    this.selected.set(member);
    this.selectedMember.emit(member);
  }

  protected isDisabled(type: string): boolean {
    return this.disabledTypes()?.includes(type) ?? false;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
