
import {first,  map, switchMap } from 'rxjs/operators';
import {Injectable} from "@angular/core";
import { CookieService } from 'ngx-cookie-service';
import {environment} from "../../../environments/environment";
import {Subject, BehaviorSubject, ReplaySubject, Observable} from 'rxjs';





import {RegistrationUser, RegistrationAddressInfo} from "app/modules/auth/components/register/register.component";

import {
	AuthenticationDetails,
	CognitoUser,
	CognitoUserAttribute,
	CognitoUserPool,
	CognitoUserSession
} from "amazon-cognito-identity-js";
import { CanActivate, Router } from '@angular/router';

export class CognitoResponse{
	public message: string;
	public result: any;
	constructor(message: string, result: any){
		this.message = message;
		this.result = result;
	}
	
}

export class LoginResponse{
	public message: string;
	public loggedIn: boolean;
	constructor(message: string, loggedIn: boolean){
		this.message = message;
		this.loggedIn = loggedIn;
	}
}

export class CognitoPasswordChallenge{
	public userAttributes: any;
	public requiredAttributes: any;
	constructor(userAttributes: any, requiredAttributes: any){
		this.userAttributes = userAttributes;
		this.requiredAttributes = requiredAttributes;
	}
	
}

export class NewPasswordUser {
	username: string;
	existingPassword: string;
	password: string;
}

@Injectable()
export class CognitoUtil {

	public static _REGION = environment.cognito.region;

	public static _USER_POOL_ID = environment.cognito.userPoolId;
	public static _CLIENT_ID = environment.cognito.clientId;

	public static _POOL_DATA:any = {
		UserPoolId: CognitoUtil._USER_POOL_ID,
		ClientId: CognitoUtil._CLIENT_ID
	};
	
	public challenge: CognitoPasswordChallenge = null;
	public registeredUser: CognitoUser = null;

	private $loggedIn: BehaviorSubject<LoginResponse>;
	private currentIdToken: string = '';
	
	private setCookie: boolean = false;
	private cookieDomain: string = '';
	private cookieSecure: boolean = false;
	
	constructor(private router: Router, private cookieService: CookieService) {
		if(environment.cognito.setCookie != null) this.setCookie = environment.cognito.setCookie;
		if(environment.cognito.cookieDomain != null) this.cookieDomain = environment.cognito.cookieDomain;
		if(environment.cognito.cookieSecure != null) this.cookieSecure = environment.cognito.cookieSecure;
	}
	
	authenticate(username: string, password: string) {
		let authenticateResult = new ReplaySubject<CognitoResponse>();
		console.log("UserLoginService: starting the authentication")

		let authenticationData = {
			Username: username,
			Password: password,
		};
		let authenticationDetails = new AuthenticationDetails(authenticationData);

		let userData = {
			Username: username,
			Pool: this.getUserPool()
		};

		console.log("UserLoginService: Params set...Authenticating the user");
		let cognitoUser = new CognitoUser(userData);
		//console.log("UserLoginService: config is " + AWS.config);
		//var self = this;
		cognitoUser.authenticateUser(authenticationDetails, {
			newPasswordRequired: (userAttributes, requiredAttributes) => {
				this.setAuthChallenge(new CognitoPasswordChallenge(userAttributes, requiredAttributes));
				authenticateResult.next(new CognitoResponse(`User needs to set password.`, null));
			},
			onSuccess: (result: CognitoUserSession, userConfirmationNecessary: boolean) => {

				console.log("In authenticateUser onSuccess callback");
				console.log("UserLoginService: Successfully logged in");
				authenticateResult.next(new CognitoResponse(null, result));
				this.$loggedIn.next(new LoginResponse("User logged in", true));
			},
			onFailure: function (err) {
				authenticateResult.next(new CognitoResponse(err.message, null));
			},
		});
		return authenticateResult.asObservable().pipe(first()); 
	}

	forgotPassword(username: string): Observable<CognitoResponse> {
		let forgotResult = new ReplaySubject<CognitoResponse>();
		if(!username){
			forgotResult.next(new CognitoResponse('Username is required', null));
			return forgotResult.asObservable().pipe(first());
		}
		let userData = {
			Username: username,
			Pool: this.getUserPool()
		};

		let cognitoUser = new CognitoUser(userData);

		cognitoUser.forgotPassword({
			onSuccess: function () {

			},
			onFailure: function (err) {
				forgotResult.next(new CognitoResponse(err.message, null));
			},
			inputVerificationCode() {
				forgotResult.next(new CognitoResponse(null, null));
			}
		});
		return forgotResult.asObservable().pipe(first());
	}

	confirmNewPassword(username: string, verificationCode: string, password: string) : Observable<CognitoResponse> {
		let confirmResult = new ReplaySubject<CognitoResponse>();
		let userData = {
			Username: username,
			Pool: this.getUserPool()
		};

		let cognitoUser = new CognitoUser(userData);

		cognitoUser.confirmPassword(verificationCode, password, {
			onSuccess: function () {
				confirmResult.next(new CognitoResponse(null, null));
			},
			onFailure: function (err) {
				confirmResult.next(new CognitoResponse(err.message, null));
			}
		});
		return confirmResult.asObservable().pipe(first());
	}

	logout() {
		console.log("UserLoginService: Logging out");
		this.getCurrentUser().signOut();
		this.$loggedIn.next(new LoginResponse("User logged out", false));
		if(this.setCookie){
			this.cookieService.delete('idToken','/',this.cookieDomain);
		}
		this.router.navigate(['/auth/login']);

	}

	isAuthenticated(): Observable<LoginResponse> {
		if(this.$loggedIn == null){
			this.$loggedIn = new BehaviorSubject<LoginResponse>(new LoginResponse("Still authenticating the user", false));
			let cognitoUser = this.getCurrentUser();
	
			if (cognitoUser != null) {
				var self = this;
				cognitoUser.getSession(function (err, session) {
					if (err) {
						console.log("UserLoginService: Couldn't get the session: " + err, err.stack);
						self.$loggedIn.next(new LoginResponse(err, false));
					}
					else {
						console.log("UserLoginService: Session is " + session.isValid());
						self.$loggedIn.next(new LoginResponse(err, session.isValid()));
					}
				});
			} else {
				console.log("UserLoginService: can't retrieve the current user");
				this.$loggedIn.next(new LoginResponse("Can't retrieve the CurrentUser", false));
			}
		}
		console.log('returning observable');
		return this.$loggedIn.asObservable();
	}
	getUserPool() {
		if (environment.cognito.idp_endpoint) {
			CognitoUtil._POOL_DATA.endpoint = environment.cognito.idp_endpoint;
		}
		return new CognitoUserPool(CognitoUtil._POOL_DATA);
	}

	getCurrentUser() {
		return this.getUserPool().getCurrentUser();
	}
	
	getUserSession(): Observable<CognitoUserSession>{
		return this.isAuthenticated().pipe(map(
			(response:LoginResponse)=>
			{
				if(!response || !response.loggedIn) return null;
				else return this.getCurrentUser();
			}
		)).pipe(switchMap(
			(currentUser:CognitoUser|null)=>{
				let sessionResult = new ReplaySubject<CognitoUserSession>();
				if (currentUser != null)
					currentUser.getSession(function (err, session:CognitoUserSession|null) {
						if (err) {
							console.log("CognitoUtil: Can't get user session:" + err);
							sessionResult.next(null);
						}
						else {
							if (session.isValid()) {
								sessionResult.next(session);
							}else{
								sessionResult.next(null);
							}
						}
					});
				else{
					sessionResult.next(null);
				}
				return sessionResult.asObservable().pipe(first());
			}
		));
	}

	getAccessToken(): Observable<string> {
		return this.getUserSession().pipe(map(
			(userSession: CognitoUserSession|null)=>
			{
				if(userSession != null){
					return userSession.getAccessToken().getJwtToken();
				}else{
					return null;
				}
			}
		));
	}

	getIdToken(): Observable<string> {
		return this.getUserSession().pipe(map(
			(userSession: CognitoUserSession|null)=>
			{
				if(userSession != null){
					let newIdToken = userSession.getIdToken();
					let newIdTokenJwt = newIdToken.getJwtToken();
					if(newIdTokenJwt != this.currentIdToken){
						if(this.setCookie){
							let tokenDate = new Date(newIdToken.getExpiration()*1000);
							console.log('setting token', 'idToken',newIdTokenJwt,tokenDate,'/',this.cookieDomain,this.cookieSecure);
							console.log('expiration', tokenDate.toUTCString());
							this.cookieService.set('idToken',newIdTokenJwt,tokenDate,'/',this.cookieDomain,this.cookieSecure);
							
    					}
						this.currentIdToken = newIdTokenJwt;
					}
					return newIdTokenJwt;
				}else{
					return null;
				}
			}
		));
	}

	getRefreshToken(): Observable<string> {
		return this.getUserSession().pipe(map(
			(userSession: CognitoUserSession|null)=>
			{
				if(userSession != null){
					return userSession.getRefreshToken().getToken();
				}else{
					return null;
				}
			}
		));
	}

	refresh(): void {
		this.getCurrentUser().getSession(function (err, session) {
			if (err) {
				console.log("CognitoUtil: Can't set the credentials:" + err);
			}

			else {
				if (session.isValid()) {
					console.log("CognitoUtil: refreshed successfully");
				} else {
					console.log("CognitoUtil: refreshed but session is still not valid");
				}
			}
		});
	}
	
	register(user:RegistrationUser): Observable<CognitoResponse> {
		let registerResult = new ReplaySubject<CognitoResponse>();
		console.log("UserRegistrationService: user is " + user);

		let attributeList = [];
		user.address = JSON.stringify(user.addressInfo);
		let attributeNames = ['email', 'name','address', 'birthdate', 'nickname'];
		for(let i = 0; i < attributeNames.length; i++){
			attributeList.push(new CognitoUserAttribute({Name: attributeNames[i], Value: user[attributeNames[i]]})); 
		}
		console.log(attributeList);

		this.getUserPool().signUp(user.username, user.password, attributeList, null, (err, result) => {
			if (err) {
				registerResult.next(new CognitoResponse(err.message, null));
			} else {
				console.log("UserRegistrationService: registered user is " + result);
				//this.registeredUser = result.user;
				registerResult.next(new CognitoResponse(null, result));
			}
		});
		return registerResult.asObservable();
	}


	confirmRegistration(username: string, confirmationCode: string): Observable<CognitoResponse> {
		let confirmResult = new ReplaySubject<CognitoResponse>();
		let userData = {
			Username: username,
			Pool: this.getUserPool()
		};

		let cognitoUser = new CognitoUser(userData);

		cognitoUser.confirmRegistration(confirmationCode, true, (err, result) => {
			if (err) {
				confirmResult.next(new CognitoResponse(err.message, null));
			} else {
				confirmResult.next(new CognitoResponse(null, null));
			}
		});
		
		return confirmResult.asObservable().pipe(first());
	}
	
	isEmail(username: string) : boolean{
		var emailEx : RegExp = RegExp('^.+@.+\.');
		return emailEx.test(username);
	}


	resendCode(username: string): Observable<CognitoResponse>  {
		let resendResult = new ReplaySubject<CognitoResponse>();
		let userData = {
			Username: username,
			Pool: this.getUserPool()
		};

		let cognitoUser = new CognitoUser(userData);

		cognitoUser.resendConfirmationCode((err, result) => {
			if (err) {
				resendResult.next(new CognitoResponse(err.message, null));
			} else {
				resendResult.next(new CognitoResponse(null, result));
			}
		});
		return resendResult.asObservable().pipe(first());
	}

	setAuthChallenge(challenge: CognitoPasswordChallenge){
		console.log(challenge);
		this.challenge=challenge;
	}
	newPassword(newPasswordUser: NewPasswordUser, extraAttributes: any): Observable<CognitoResponse> {
		let newPasswordResult = new ReplaySubject<CognitoResponse>();
		console.log(newPasswordUser);
		console.log(extraAttributes);
		if(!extraAttributes) extraAttributes = {};
		// Get these details and call
		//cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, this);
		let authenticationData = {
			Username: newPasswordUser.username,
			Password: newPasswordUser.existingPassword,
		};
		let authenticationDetails = new AuthenticationDetails(authenticationData);

		let userData = {
			Username: newPasswordUser.username,
			Pool: this.getUserPool()
		};

		console.log("UserLoginService: Params set...Authenticating the user");
		let cognitoUser = new CognitoUser(userData);
		//console.log("UserLoginService: config is " + AWS.config);
		cognitoUser.authenticateUser(authenticationDetails, {
			newPasswordRequired: function (userAttributes, requiredAttributes) {
				// User was signed up by an admin and must provide new
				// password and required attributes, if any, to complete
				// authentication.

				// the api doesn't accept this field back
				delete userAttributes.email_verified;
				cognitoUser.completeNewPasswordChallenge(newPasswordUser.password, extraAttributes, {
					onSuccess: function (result) {
						newPasswordResult.next(new CognitoResponse(null, userAttributes));
					},
					onFailure: function (err) {
						newPasswordResult.next(new CognitoResponse(err, null));
					}
				});
			},
			onSuccess: function (result){
				newPasswordResult.next(new CognitoResponse(null, result));
			},
			onFailure: function (err) {
				newPasswordResult.next(new CognitoResponse(err, null));
			}
		});
		return newPasswordResult.asObservable().pipe(first()); 
	}
	
	getAttributes(): Observable<any>{
		let attributesResult = new ReplaySubject<CognitoResponse>();
		let currentUser = this.getCurrentUser();
		currentUser.getSession(
			(err, session) => {
				if (err) {
					console.log('getAttributes getSession error', err);
					attributesResult.error(err);
					return;
				}
				currentUser.getUserAttributes(function(err, result) {
					if (err) {
						console.log('getAttributes error', err);
						attributesResult.error(err);
						return;
					}
					let attributes: any = {};
					for (let i = 0; i < result.length; i++) {
						attributes[result[i].getName()] = result[i].getValue();
					}
					if(attributes.hasOwnProperty('address')){
						attributes.parsedAddress = JSON.parse(attributes.address);
					}
					attributesResult.next(attributes);
				});
		});
		return attributesResult.asObservable().pipe(first());
	}
	
	updateAttributes(attributes){
		console.log('update attributes', attributes);
		let attributesResult = new ReplaySubject<any>();
		let currentUser = this.getCurrentUser();
		currentUser.getSession(
			(err, session) => {
				if (err) {
					console.log('getAttributes getSession error', err);
					attributesResult.error(err);
					return;
				}
				let attributeList = [];
				attributes.address = JSON.stringify(attributes.addressInfo);
				let attributeNames = ['name','address', 'birthdate', 'nickname'];
				for(let i = 0; i < attributeNames.length; i++){
					attributeList.push(new CognitoUserAttribute({Name: attributeNames[i], Value: attributes[attributeNames[i]]})); 
				}
				console.log('calling updateAttributes');
				currentUser.updateAttributes(attributeList, function(err, result) {
					console.log('received return from updateAttributes');
					if (err) {
						console.log('setAttributes error', err);
						attributesResult.error(err);
						return;
					}
					console.log('call result: ' + result);
					attributesResult.next(result);
				});
		});
		return attributesResult.asObservable().pipe(first()).pipe(switchMap(
			(result) => {
				let refreshResult = new ReplaySubject<any>();
				let currentUser = this.getCurrentUser();
				currentUser.getSession(
					(err, session) => {
						if (err) {
							console.log('refresh getSession error', err);
							refreshResult.error(err);
							return;
						}
						let refreshToken = session.getRefreshToken();
						currentUser.refreshSession(refreshToken, (err, session) => {
							console.log('sucessfully refreshed session!');
							refreshResult.next(result);
						});
				});
				return refreshResult.asObservable().pipe(first());
			}
			
		));
		
	}
	
	updatePassword(oldPassword: string, newPassword: string): Observable<any>{
		let passwordResult = new ReplaySubject<any>();
		let currentUser = this.getCurrentUser();
		currentUser.getSession(
			(err, session) => {
				if(err){
					passwordResult.error(err);
					return;
				}
				currentUser.changePassword(oldPassword, newPassword, function(err, result) {
					if (err) {
						passwordResult.error(err);
						return;
					}
					passwordResult.next(result);
				});
			});
		return passwordResult.asObservable().pipe(first());
	}
}