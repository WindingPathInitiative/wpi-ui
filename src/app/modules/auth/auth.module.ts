import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule} from "@angular/forms";
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { LoginComponent } from './components/login/login.component';
import { AuthRoutingModule } from './auth-routing.module';
import { AuthComponent } from './components/auth/auth.component';
import { PasswordComponent } from './components/password/password.component';
import { RegisterComponent } from './components/register/register.component';
import { ConfirmComponent } from './components/confirm/confirm.component';
import { ResendComponent } from './components/resend/resend.component';
import { ForgotComponent } from './components/forgot/forgot.component';
import { LogoutComponent } from './components/logout/logout.component';
import { RedirectComponent } from './components/redirect/redirect.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    BsDatepickerModule.forRoot(),
    AuthRoutingModule
  ],
  declarations: [LoginComponent, AuthComponent, PasswordComponent, RegisterComponent, ConfirmComponent, ResendComponent, ForgotComponent, LogoutComponent, RedirectComponent]
})
export class AuthModule {
	constructor() {
		console.log('auth module constructor!');
	}
}
