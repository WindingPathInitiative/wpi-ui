import { Component, Inject, OnInit, OnDestroy, TemplateRef } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { Subscription ,  Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { HubService} from 'app/modules/core/hub.service';
import { CognitoUtil } from "app/modules/core/cognito.service";
import { ApiErrorResponse, Office, User, PasswordChange } from 'app/modules/core/models/';


@Component({
	selector: 'app-member',
	templateUrl: './member.component.html'
})
export class MemberComponent implements OnInit, OnDestroy {
	memberSubscription: Subscription;
	officeSubscription: Subscription;
	transferModalRef: BsModalRef;
	confirmModalRef: BsModalRef;
	editModalRef: BsModalRef;
	member: User;
	currentId: number = 0;
	editModel: any;
	passwordChangeModel: PasswordChange;
	confirmPassword: string;
	userOffices: Office[];
	selectedOffice: Office;
	isTransferring: boolean = false;
	error: any;
	constructor(public hubService: HubService,
		@Inject('cognitoMain') private cognitoMain: CognitoUtil,
		private route: ActivatedRoute,
		private router: Router,
		private toastr: ToastrService,
		private modalService: BsModalService) { }

	ngOnInit() {
		this.getMember();
		this.getUserOffices();
	}
	getMember(refresh:boolean = false){
		if(this.memberSubscription) this.memberSubscription.unsubscribe();
		this.memberSubscription = this.route.params
			.pipe(switchMap((params: Params) => {
				this.currentId = params['id'];
				console.log('user switchmap called');
				this.error=null;
				let getParams:any = {offices: 1, children: 1, private: 1};
				if(refresh) getParams.refresh=1;
				return this.hubService.getUser(params['id'], getParams);
			})).subscribe(
				(response) => {
					if(response instanceof ApiErrorResponse){
						console.log('got error for member!', response);
						this.error = response;
					}
					else{
						this.member = response;
						console.log('got member',this.member);
					}
				}
			);
	}
	getUserOffices(){
		if(this.officeSubscription) this.officeSubscription.unsubscribe();
		this.officeSubscription = this.route.params
			.pipe(switchMap((params: Params) => {
				console.log('user offices switch map called');
				return this.hubService.getUserAuthority(params['id']);
			})).subscribe(
				(offices:Office[]) => {
					this.userOffices = offices;
					console.log('user offices',this.userOffices);
					if(this.userOffices.length == 0) this.selectedOffice = null;
					else{
						this.selectedOffice = this.userOffices[0];
					}
					
				},
				(error) => {
					console.log('got offices error', error);
				}
			);
	}
	
	transferModal(template){
		this.isTransferring = true;
		this.transferModalRef = this.modalService.show(template);
	}
	
	doneTransfer(result:boolean){
		this.transferModalRef.hide();
		this.isTransferring = false;
		if(result) this.getMember();
	}
	
	confirmModal(template: TemplateRef<any>) {
		this.confirmModalRef = this.modalService.show(template, {class: 'modal-sm'});
	}
	
	approveMembership(){
		this.hubService.approveMember(this.member.id,this.selectedOffice).subscribe(
			(response:any)=>
			{
				this.toastr.success('Membership approved!');
				this.getMember();
				this.confirmModalRef.hide();
			},
			(error)=>{
				let message = '';
				if(error.error && error.error.message) message = error.error.message;
				else if(error.message) message = error.message;
				else message='Unknown server error';
				this.toastr.error(message);
			}
		);
	}
	editUserModal(template: TemplateRef<any>){
		this.cognitoMain.getAttributes().subscribe(
			(attributes:any) =>
			{
				this.editModel = {};
				this.editModel.name = attributes.name;
				this.editModel.nickname = attributes.nickname;
				this.editModel.birthdate = attributes.birthdate;
				this.editModel.addressInfo = attributes.parsedAddress;

				console.log('editModel', this.editModel);
				this.editModalRef = this.modalService.show(template);
			}
		)
	}
	
	editPasswordModal(template: TemplateRef<any>){
		this.passwordChangeModel = new PasswordChange();
		this.confirmPassword = '';
		this.editModalRef = this.modalService.show(template);
		
		setTimeout(() => {
			document.getElementById('editCurrentPassword').focus();
		}, 500);
	}
	editUser(){
		this.cognitoMain.updateAttributes(this.editModel).subscribe(
			data => {
				this.toastr.success('Details Updated!');
				this.getMember(true);
				this.editModalRef.hide();
			},
			err => {
				this.toastr.error(err);
			}
			
		)
	}
	
	editPassword(){
		this.cognitoMain.updatePassword(this.passwordChangeModel.oldPassword, this.passwordChangeModel.newPassword).subscribe(
			data => {
				this.toastr.success('Password Updated!');
				this.getMember(true);
				this.editModalRef.hide();
			},
			err => {
				this.toastr.error(err.message);
			}
			
		)
	}
	ngOnDestroy(){
		this.memberSubscription.unsubscribe();
		this.officeSubscription.unsubscribe();
	}
}