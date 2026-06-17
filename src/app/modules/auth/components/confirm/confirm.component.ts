import {Component, OnDestroy, OnInit, Inject} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {CognitoUtil, CognitoResponse} from "app/modules/core/cognito.service";

@Component({
	selector: 'app-confirm',
	templateUrl: './confirm.component.html'
})
export class ConfirmComponent implements OnInit, OnDestroy {
	public confirmationCode: string;
	public pathUsername: string;
	public username: string;
	public notFoundEmail: boolean = false;
	public submitting : boolean = false;
	public errorMessage: string;
	private sub: any;

	constructor(public router: Router, public route: ActivatedRoute, @Inject('cognitoMain') private cognitoMain: CognitoUtil) {
	}

	ngOnInit() {
		this.sub = this.route.params.subscribe(params => {
			if(params['username'] != null && params['username'].length > 0){
				this.pathUsername = params['username'];
				this.username = this.pathUsername;
			}
			else this.pathUsername=null;

		});

		this.errorMessage = null;
	}

	ngOnDestroy() {
		this.sub.unsubscribe();
	}

	onConfirmRegistration() {
		this.errorMessage = null;
		this.notFoundEmail = false;
		this.submitting = true;
		this.cognitoMain.confirmRegistration(this.username, this.confirmationCode).subscribe(
			(response: CognitoResponse) => {
				if (response.message != null) { //error
					this.submitting = false;
					this.errorMessage = response.message;
					console.log("message: " + this.errorMessage);
					if(this.errorMessage == 'Username/client id combination not found.'){
						if(this.cognitoMain.isEmail(this.username)){
							this.notFoundEmail = true;
						}
					}
				} else { //success
					//move to the next step
					console.log("Moving to login page");
					// this.configs.curUser = result.user;
					this.router.navigate(['/auth/login']);
				}
			}	
			
		);
	}
}





