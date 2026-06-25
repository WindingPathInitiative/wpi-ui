import { Component, OnInit, OnDestroy, output, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { MemberSearchComponent } from '../../shared/member-search/member-search';
import { OfficeFormComponent } from '../office-form/office-form';
import { HubService } from '../../core/hub.service';
import { Office, OrgUnit, User } from '../../core/models';

@Component({
  selector: 'app-location-officer',
  imports: [RouterLink, FormsModule, MemberSearchComponent, OfficeFormComponent],
  templateUrl: './location-officer.html',
})
export class LocationOfficerComponent implements OnInit, OnDestroy {
  readonly action = output<number>();

  readonly activeModal = inject(NgbActiveModal);
  private readonly modalService = inject(NgbModal);
  private readonly hub = inject(HubService);
  private readonly toastr = inject(ToastrService);

  office!: Office;
  orgUnit!: OrgUnit;
  primaryOffice: Office | null = null;

  protected readonly userOffices = signal<Office[]>([]);
  protected readonly selectedOffice = signal<Office | null>(null);
  protected readonly selectedHireMember = signal<User | null>(null);
  protected readonly isHiring = signal(false);
  protected readonly isEditing = signal(false);
  protected readonly isAdding = signal(false);
  protected hireOrgUnitId = 0;

  private officeSubscription?: Subscription;

  ngOnInit(): void {
    this.officeSubscription = this.hub.getOfficerAuthority(this.office.id).subscribe(offices => {
      this.userOffices.set(offices);
      if (!offices.length) {
        this.selectedOffice.set(null);
      } else {
        const withAuthority = offices.find(o => o.roles.includes('office_assign'));
        this.selectedOffice.set(withAuthority ?? offices[0]);
      }
    });
  }

  private loadOffice(): void {
    this.hub.getOffice(this.office.id).subscribe(o => {
      if (o.parentOffice) o.parentOfficeID = o.parentOffice.id;
      this.office = o;
    });
  }

  private handleError(err: { error?: { message?: string }; message?: string }): void {
    this.toastr.error(err.error?.message ?? err.message ?? 'Unknown server error');
  }

  protected startHire(): void {
    this.hireOrgUnitId = this.orgUnit.type === 'Venue' ? this.orgUnit.parents[0].id : this.orgUnit.id;
    this.isHiring.set(true);
  }

  protected hire(): void {
    const member = this.selectedHireMember()!;
    const office = this.selectedOffice()!;
    this.hub.assignOffice(this.office.id, member.id, office).subscribe({
      next: () => {
        this.toastr.success('Officer hired!');
        this.loadOffice();
        this.action.emit(1);
        this.isHiring.set(false);
        this.selectedHireMember.set(null);
      },
      error: err => this.handleError(err),
    });
  }

  protected vacate(): void {
    this.hub.assignOffice(this.office.id, 0, this.selectedOffice()!).subscribe({
      next: () => {
        this.toastr.success('Office vacated');
        this.loadOffice();
        this.action.emit(1);
      },
      error: err => this.handleError(err),
    });
  }

  protected resign(): void {
    this.hub.assignOffice(this.office.id, 0, this.office).subscribe({
      next: () => {
        this.toastr.success("Resigned from office. You're free!");
        this.loadOffice();
        this.action.emit(2);
        this.activeModal.dismiss();
      },
      error: err => this.handleError(err),
    });
  }

  protected editResult(result: Office | null): void {
    if (!result) { this.isEditing.set(false); return; }
    this.hub.updateOffice(result, this.selectedOffice()!).subscribe({
      next: () => {
        this.toastr.success('Office updated');
        this.loadOffice();
        this.action.emit(1);
        this.isEditing.set(false);
      },
      error: err => this.handleError(err),
    });
  }

  protected addAssistantResult(result: Office | null): void {
    if (!result) { this.isAdding.set(false); return; }
    this.hub.addAssistantOffice(result, this.selectedOffice()!).subscribe({
      next: () => {
        this.toastr.success('Assistant added');
        this.loadOffice();
        this.action.emit(1);
        this.isAdding.set(false);
      },
      error: err => this.handleError(err),
    });
  }

  protected deleteAssistant(): void {
    this.hub.deleteAssistantOffice(this.office.id, this.selectedOffice()!).subscribe({
      next: () => {
        this.toastr.success('Office deleted');
        this.action.emit(2);
        this.activeModal.dismiss();
      },
      error: err => this.handleError(err),
    });
  }

  protected get currentUserId(): number { return this.hub.currentUserId(); }

  ngOnDestroy(): void {
    this.officeSubscription?.unsubscribe();
  }
}
