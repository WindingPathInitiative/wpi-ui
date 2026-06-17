import {Component, OnInit, Inject, ViewChild, ElementRef} from "@angular/core";
import {Router} from "@angular/router";
import {NgForm} from '@angular/forms';
import {CognitoUtil, CognitoResponse} from "app/modules/core/cognito.service";

export class RegistrationUser {
	name: string;
	username: string;
	nickname: string;
	email: string;
	password: string;
	addressInfo: RegistrationAddressInfo;
	address: string;
	birthdate: string;
}

export class RegistrationAddressInfo {
	street_address: string;
	locality: string;
	region: string;
	postal_code: string;
	country: string;
	
}

/**
 * This component is responsible for displaying and controlling
 * the registration of the user.
 */
@Component({
	selector: 'app-register',
	templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
	registrationUser: RegistrationUser;
	errorMessage: string;
	@ViewChild('signupNameInput', { static: true }) signupName: ElementRef;
	@ViewChild('formTop', { static: true }) formTop: ElementRef;
	public submitting: boolean = false;
	constructor(@Inject('cognitoMain') private cognitoMain: CognitoUtil, private router: Router) {
		this.registrationUser = new RegistrationUser();
		this.registrationUser.addressInfo = new RegistrationAddressInfo();
		this.errorMessage = null;
	}
	
	ngOnInit(){
		setTimeout(() => {
			this.signupName.nativeElement.focus();
		}, 1);
	}

	onRegister(signupForm: NgForm) {
		this.submitting=true;
		console.log(signupForm.value);
		this.errorMessage = null;
		if(this.registrationUser.birthdate != null){
			let birthDate = new Date(this.registrationUser.birthdate);
			this.registrationUser.birthdate = birthDate.getFullYear()+'-'+String(birthDate.getMonth()+1).padStart(2,'0')+'-'+String(birthDate.getDate()).padStart(2,'0');
		}
		
		console.log('birthdate', this.registrationUser.birthdate);
		if(!signupForm.valid){
			this.errorMessage="Please check your registration details and try again";
			this.formTop.nativeElement.scrollIntoView(this.formTop.nativeElement);
			this.submitting=false;
			return;
		}
		this.cognitoMain.register(this.registrationUser).subscribe(
		(response: CognitoResponse) => 
		{
			if(response.message){
				this.errorMessage = response.message;
				this.submitting = false;
				this.formTop.nativeElement.scrollIntoView(this.formTop.nativeElement);
				return;
			}else{
				console.log(response.result);
				this.router.navigate(['/auth/confirm', response.result.user.username]);
			}
		});
	}
}