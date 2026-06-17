
import {of as observableOf, Observable} from 'rxjs';

import {catchError, map, first} from 'rxjs/operators';
import { Injectable, Inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';




import { CognitoUtil, LoginResponse } from './cognito.service';
@Injectable()
export class GuardService implements CanActivate {

	constructor(@Inject('cognitoMain') private cognitoMain: CognitoUtil, private router: Router) { }
	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
		return this.cognitoMain.isAuthenticated().pipe(first(),map(
			(response:LoginResponse)=>{
				console.log('map called!');
				console.log('loggedIn?',response.loggedIn);
				if(response.loggedIn){
					console.log('returning true!');
					return true;
				}
				else {
					console.log('navigating to login!');
					let returnUrl = '';
					if(route.queryParams['returnUrl']) returnUrl = route.queryParams['returnUrl'];
					else returnUrl = state.url;
					this.router.navigate(['/auth/login'],{ queryParams: { returnUrl: returnUrl }});
					console.log('returning false!');
					return false;
				}
			}
		),catchError(
			(err: any, caught: Observable<boolean>) => {
				console.log('received error!');
				this.router.navigate(['/auth/login']);
				return observableOf(false);
			}
		),);
			
	}

}
