import {Component, OnInit, Inject, ViewChild, ElementRef} from "@angular/core";
import {Router,ActivatedRoute} from "@angular/router";
import {CognitoUtil, CognitoResponse, LoginResponse} from "app/modules/core/cognito.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
	@ViewChild('loginUsername', { static: true }) loginUsername: ElementRef;
	returnUrl: string;
	username: string;
	password: string;
	errorMessage: string;
	needConfirm: boolean = false;
	notFoundEmail: boolean = false;
	loggedIn: boolean = false;
	public submitting: boolean = false;
	
	constructor(private route: ActivatedRoute, public router: Router, @Inject('cognitoMain') private cognitoMain: CognitoUtil){
		console.log("LoginComponent constructor");
	}

	ngOnInit() {
		this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
		this.errorMessage = null;
		this.cognitoMain.isAuthenticated().subscribe(
			(response:LoginResponse)=>{
				console.log('login page init');
				console.log('loggedIn?',response.loggedIn);
				if(response.loggedIn){
					this.loggedIn = true;
				}
				else {
					this.loggedIn = false;
				}
			}	
		);
		setTimeout(() => {
			this.loginUsername.nativeElement.focus();
		}, 1);
		
	}

	onLogin() {
		this.needConfirm = false;
		this.notFoundEmail = false;
		
		if (this.username == null || this.password == null) {
			this.errorMessage = "All fields are required";
			return;
		}
		this.submitting = true;
		this.errorMessage = null;
		this.cognitoMain.authenticate(this.username, this.password).subscribe(
			(response: CognitoResponse) => {
				if (response.message != null) { //error
					this.errorMessage = response.message;
					if (this.errorMessage === 'User is not confirmed.') {
						//console.log("redirecting to /auth/confirm/",this.username);
						//this.router.navigate(['/auth/confirm', this.username]);
						console.log('setting needConfirm');
						this.needConfirm = true;
					} else if (this.errorMessage == 'User does not exist.') {
						if(this.cognitoMain.isEmail(this.username)){
							this.notFoundEmail = true;
						}
					} else if (this.errorMessage === 'User needs to set password.') {
						console.log("redirecting to set new password");
						this.router.navigate(['/auth/password']);
					}
					this.submitting = false;
				} else { //success
					if(this.returnUrl.substring(0,4) == 'http'){
						window.location.href=this.returnUrl;
					}else{
						this.router.navigateByUrl(this.returnUrl);
					}
				}
			}
		);
	}


}