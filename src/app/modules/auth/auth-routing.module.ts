import { NgModule }     from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuardService } from 'app/modules/core/guard.service';
import { AuthComponent } from './components/auth/auth.component';
import { ConfirmComponent } from './components/confirm/confirm.component';
import { ForgotComponent } from './components/forgot/forgot.component';
import { LoginComponent } from './components/login/login.component';
import { LogoutComponent } from './components/logout/logout.component';
import { PasswordComponent } from './components/password/password.component';
import { RedirectComponent } from './components/redirect/redirect.component';
import { RegisterComponent } from './components/register/register.component';
import { ResendComponent } from './components/resend/resend.component';
@NgModule({
	imports: [
		RouterModule.forChild([
			{
				path: '',
				component: AuthComponent,
				children: [
					{ path: '', redirectTo: 'login', pathMatch: 'full' },
					{ path: 'confirm/:username', component: ConfirmComponent },
					{ path: 'confirm', component: ConfirmComponent },
					{ path: 'forgot', component: ForgotComponent },
					{ path: 'resend/:username', component: ResendComponent },
					{ path: 'resend', component: ResendComponent },
					{ path: 'login', component: LoginComponent },
					{ path: 'logout', component: LogoutComponent },
					{ path: 'password', component: PasswordComponent },
					{ path: 'register', component: RegisterComponent },
					{ path: 'redirect', component: RedirectComponent, canActivate: [GuardService] },

				]
			}
		])
	],
	exports: [
		RouterModule
	]
})
export class AuthRoutingModule {}