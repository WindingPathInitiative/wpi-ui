import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { LocationOfficerComponent } from '../location-officer/location-officer';
import { MemberTransferComponent } from '../../shared/member-transfer/member-transfer';
import { HubService } from '../../core/hub.service';
import { Office, OrgUnit, User } from '../../core/models';

@Component({
  selector: 'app-location',
  imports: [RouterLink, FormsModule, MemberTransferComponent],
  templateUrl: './location.html',
})
export class LocationComponent implements OnInit, OnDestroy {
  private readonly hub = inject(HubService);
  protected readonly route = inject(ActivatedRoute);
  private readonly modalService = inject(NgbModal);
  private readonly toastr = inject(ToastrService);

  protected readonly orgUnit = signal<OrgUnit | null>(null);
  protected readonly parentOrgUnit = signal<OrgUnit | null>(null);
  protected readonly userOffices = signal<Office[]>([]);
  protected readonly selectedOffice = signal<Office | null>(null);
  protected readonly canAddOrgs = signal<string[]>([]);
  protected readonly canTransferMember = signal(false);
  protected readonly editing = signal(false);
  protected readonly isTransferring = signal(false);
  protected editOrgUnit: Partial<OrgUnit> = {};
  protected transferringMember: User | null = null;
  protected orgModel: Partial<OrgUnit> = {};
  protected addUserModel: Partial<User> = {};
  protected venueTypes: unknown[] = [];

  protected get officeRoles(): Record<string, string> { return this.hub.officeRoles(); }
  protected get orgUnitTypes(): string[] { return this.hub.orgUnitTypes(); }

  private orgSub?: Subscription;
  private officeSub?: Subscription;

  ngOnInit(): void {
    this.venueTypes = this.hub.venueTypes();
    this.getOrg();
    this.getUserOffices();
  }

  private getOrg(): void {
    this.orgSub?.unsubscribe();
    this.orgSub = this.route.params.pipe(
      switchMap(params => this.hub.getOrgUnit(+params['id'])),
    ).subscribe(unit => {
      this.orgUnit.set(unit);
      const parents = unit.parents ?? [];
      this.parentOrgUnit.set(parents.length ? parents[parents.length - 1] : null);
    });
  }

  private getUserOffices(): void {
    this.officeSub?.unsubscribe();
    this.officeSub = this.route.params.pipe(
      switchMap(params => this.hub.getOrgUnitAuthority(+params['id'])),
    ).subscribe(offices => {
      this.userOffices.set(offices);
      const first = offices[0] ?? null;
      this.selectedOffice.set(first);
      if (first) this.computePermissions(first);
    });
  }

  protected onOfficeChange(office: Office): void {
    this.selectedOffice.set(office);
    this.computePermissions(office);
  }

  private computePermissions(office: Office): void {
    this.canAddOrgs.set([]);
    this.canTransferMember.set(false);
    if (!office?.roles?.length) return;

    const types = this.orgUnitTypes;
    const unit = this.orgUnit()!;
    const idx = types.indexOf(unit.type);
    if (idx !== -1) {
      const addable = types.slice(idx + 1).filter(t =>
        office.roles.includes(`org_create_${t.toLowerCase()}`),
      );
      this.canAddOrgs.set(addable);
    }
    if (
      unit.type !== 'Venue' &&
      office.roles.includes('user_assign') &&
      (office.parentOrgID !== unit.id || unit.type !== 'Chapter')
    ) {
      this.canTransferMember.set(true);
    }
  }

  protected editOrg(): void {
    this.editOrgUnit = { ...this.orgUnit()! };
    this.editing.set(true);
  }

  protected cancelOrg(): void { this.editing.set(false); }

  protected saveOrg(): void {
    this.hub.updateOrgUnit(this.editOrgUnit as OrgUnit, this.selectedOffice()!).subscribe({
      next: () => { this.editing.set(false); this.getOrg(); this.toastr.success('Location updated!'); },
      error: err => this.toastr.error(err.error?.message ?? err.message ?? 'Unknown server error'),
    });
  }

  protected openOfficerModal(office: Office): void {
    const ref = this.modalService.open(LocationOfficerComponent, { size: 'lg' });
    ref.componentInstance.office = office;
    ref.componentInstance.orgUnit = this.orgUnit();
    ref.componentInstance.primaryOffice = office.parentOfficeID
      ? this.orgUnit()!.offices.find(o => o.id === office.parentOfficeID) ?? null
      : null;
    ref.componentInstance.action.subscribe((action: number) => {
      if (action > 0) {
        this.getOrg();
        if (action === 2) this.getUserOffices();
      }
    });
  }

  protected openAddOrgModal(content: unknown, type: string): void {
    this.orgModel = { type, orgUnit: this.orgUnit()!.id } as Partial<OrgUnit>;
    this.modalService.open(content, { ariaLabelledBy: 'addOrgModalLabel' });
  }

  protected addOrg(modal: { dismiss: () => void }): void {
    this.hub.addOrgUnit(this.orgModel, this.orgUnit()!.id, this.selectedOffice()!).subscribe({
      next: () => { this.getOrg(); this.toastr.success('Location added!'); modal.dismiss(); },
      error: err => this.toastr.error(err.error?.message ?? err.message ?? 'Unknown server error'),
    });
  }

  protected openTransferModal(content: unknown, member: User): void {
    this.transferringMember = member;
    this.isTransferring.set(true);
    this.modalService.open(content, { ariaLabelledBy: 'transferModalLabel' });
  }

  protected doneTransfer(result: boolean, modal: { dismiss: () => void }): void {
    modal.dismiss();
    this.isTransferring.set(false);
    if (result) this.getOrg();
  }

  protected openAddUserModal(content: unknown): void {
    const unit = this.orgUnit()!;
    this.addUserModel = { orgUnit: unit.id } as Partial<User>;
    this.modalService.open(content, { ariaLabelledBy: 'addUserModalLabel' });
  }

  protected addUser(modal: { dismiss: () => void }): void {
    this.hub.addUser(this.addUserModel, this.selectedOffice()!).subscribe({
      next: () => { this.getOrg(); this.toastr.success('Member added!'); modal.dismiss(); },
      error: err => this.toastr.error(err.error?.message ?? err.message ?? 'Unknown server error'),
    });
  }

  ngOnDestroy(): void {
    this.orgSub?.unsubscribe();
    this.officeSub?.unsubscribe();
  }
}
