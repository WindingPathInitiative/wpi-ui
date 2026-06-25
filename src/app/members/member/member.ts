import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MemberTransferComponent } from '../../shared/member-transfer/member-transfer';
import { HubService } from '../../core/hub.service';
import { ApiErrorResponse, Office, User } from '../../core/models';

function isError(r: User | ApiErrorResponse): r is ApiErrorResponse {
  return (r as ApiErrorResponse).error === true;
}

@Component({
  selector: 'app-member',
  imports: [RouterLink, FormsModule, MemberTransferComponent],
  templateUrl: './member.html',
})
export class MemberComponent implements OnInit, OnDestroy {
  private readonly hub = inject(HubService);
  private readonly route = inject(ActivatedRoute);
  private readonly modalService = inject(NgbModal);
  private readonly toastr = inject(ToastrService);

  protected readonly member = signal<User | null>(null);
  protected readonly error = signal<ApiErrorResponse | null>(null);
  protected readonly userOffices = signal<Office[]>([]);
  protected readonly selectedOffice = signal<Office | null>(null);
  protected readonly isTransferring = signal(false);
  protected transferringMember: User | null = null;
  protected currentId = 0;

  protected get currentUserId(): number { return this.hub.currentUserId(); }

  private memberSub?: Subscription;
  private officeSub?: Subscription;

  ngOnInit(): void {
    this.getMember();
    this.getUserOffices();
  }

  private getMember(): void {
    this.memberSub?.unsubscribe();
    this.memberSub = this.route.params.pipe(
      switchMap(params => {
        this.currentId = +params['id'];
        this.error.set(null);
        return this.hub.getUser(this.currentId, { offices: 1, children: 1, private: 1 });
      }),
    ).subscribe(res => {
      if (isError(res)) this.error.set(res);
      else this.member.set(res);
    });
  }

  private getUserOffices(): void {
    this.officeSub?.unsubscribe();
    this.officeSub = this.route.params.pipe(
      switchMap(params => this.hub.getUserAuthority(+params['id'])),
    ).subscribe(offices => {
      this.userOffices.set(offices);
      this.selectedOffice.set(offices[0] ?? null);
    });
  }

  protected approveMembership(): void {
    this.hub.approveMember(this.member()!.id, this.selectedOffice()!).subscribe({
      next: () => { this.toastr.success('Membership approved!'); this.getMember(); },
      error: (err: { error?: { message?: string }; message?: string }) =>
        this.toastr.error(err.error?.message ?? err.message ?? 'Unknown server error'),
    });
  }

  protected openTransferModal(content: unknown): void {
    this.isTransferring.set(true);
    this.modalService.open(content, { ariaLabelledBy: 'transferModalLabel' });
  }

  protected doneTransfer(result: boolean, modal: { dismiss: () => void }): void {
    modal.dismiss();
    this.isTransferring.set(false);
    if (result) this.getMember();
  }

  protected openApproveModal(content: unknown): void {
    this.modalService.open(content, { size: 'sm', ariaLabelledBy: 'approveModalLabel' });
  }

  ngOnDestroy(): void {
    this.memberSub?.unsubscribe();
    this.officeSub?.unsubscribe();
  }
}
