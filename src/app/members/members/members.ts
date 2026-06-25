import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HubService } from '../../core/hub.service';
import { User, UserSearch } from '../../core/models';

const MEMBERSHIP_TYPES = ['Any', 'None', 'Full', 'Suspended', 'Resigned', 'Expelled'];

@Component({
  selector: 'app-members',
  imports: [RouterLink, FormsModule],
  templateUrl: './members.html',
})
export class MembersComponent implements OnInit, OnDestroy {
  private readonly hub = inject(HubService);
  protected readonly membershipTypeOptions = MEMBERSHIP_TYPES;
  protected readonly users = signal<User[]>([]);
  protected searchParams: UserSearch = { type: 'Any' };

  private readonly criteria$ = new BehaviorSubject<UserSearch>(this.searchParams);
  private sub!: Subscription;

  ngOnInit(): void {
    this.sub = this.criteria$
      .pipe(switchMap(s => this.hub.getUsers(s)))
      .subscribe(users => this.users.set(users));
  }

  protected search(): void {
    this.criteria$.next({ ...this.searchParams });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
