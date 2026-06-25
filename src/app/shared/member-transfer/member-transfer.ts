import { Component, input, output, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { OrgunitSearchComponent } from '../orgunit-search/orgunit-search';
import { HubService } from '../../core/hub.service';
import { Office, OrgUnit, User } from '../../core/models';

@Component({
  selector: 'app-member-transfer',
  imports: [OrgunitSearchComponent],
  templateUrl: './member-transfer.html',
})
export class MemberTransferComponent {
  readonly member = input.required<User>();
  readonly officer = input.required<Office>();

  readonly result = output<boolean>();

  private readonly hub = inject(HubService);
  private readonly toastr = inject(ToastrService);
  protected readonly selectedOrgUnit = signal<OrgUnit | null>(null);

  protected transfer(): void {
    const orgUnit = this.selectedOrgUnit()!;
    this.hub.assignMember(this.member().id, orgUnit.id, this.officer()).subscribe({
      next: () => {
        this.toastr.success('Member transferred!');
        this.result.emit(true);
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.toastr.error(err.error?.message ?? err.message ?? 'Unknown server error');
      },
    });
  }

  protected cancel(): void {
    this.result.emit(false);
  }
}
