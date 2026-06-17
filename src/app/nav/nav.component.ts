
import {filter} from 'rxjs/operators';
import { Inject, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Location, PopStateEvent } from "@angular/common";
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { HubService } from 'app/modules/core/hub.service';
import { CognitoUtil, LoginResponse } from 'app/modules/core/cognito.service';
import { SubmenuService } from 'app/modules/core/submenu.service';
import { SubmenuItem } from 'app/modules/core/submenu-item.model';

import {
	Component,
	OnInit
} from '@angular/core';

import{
	trigger,
	state,
	style,
	transition,
	animate
} from '@angular/animations';

 @Component({
	 selector: 'app-nav',
	 templateUrl: './nav.component.html',
 })
export class NavComponent implements OnInit {
	@ViewChild('scrollOutlet', { static: true }) scrollOutlet: ElementRef;
	private lastPoppedUrl: string;
	private yScrollStack: number[] = [];
	public user: Object;
	public hubUser: Object;
	public hubResponse: boolean = false;
	public showNav: Boolean = false;
	public submenuItems:SubmenuItem[];
	constructor(private router: Router, private location: Location, @Inject('cognitoMain') private cognitoMain: CognitoUtil, private hubService: HubService, private submenuService: SubmenuService) { }
	
	ngOnInit() {
		this.cognitoMain.isAuthenticated().subscribe(
			(response: LoginResponse) => {
				if(response.loggedIn == true){
					this.user = this.cognitoMain.getCurrentUser();
					console.log('setting Nav cognito User');
					console.log(this.user);
				}else{
					this.user = null;
				}
			},
			err => console.log(err)
		);
		
		this.hubService.getCurrentUser().subscribe(
			(user) => {
				console.log('setting Nav Hub User');
				this.hubUser = user;
				console.log(this.hubUser);
			},
			err => console.log(err),
			() => {this.hubResponse=true;}
		);
		
		this.submenuService.getItems().subscribe(
			(items) => { this.submenuItems = items; console.log('submenu items', this.submenuItems);}
		);
		
		
		
	}
	
	ngAfterViewInit(){
		//scroll to the top of new pages, and save scrolling details so the back button works correctly
		this.location.subscribe((ev:PopStateEvent) => {
			this.lastPoppedUrl = ev.url;
		});
		
		this.router.events.pipe(
		filter(event => event instanceof NavigationStart || event instanceof NavigationEnd))
		.subscribe((ev: NavigationStart | NavigationEnd) => {
			let scrollheight = 0;
			const contentContainer = document.querySelector('.ng-sidebar__content');
			let evstring = ev.toString();
			//Checking NavigationEnd first because typescript doesn't work very well with instanceof right now, and NavigationEnd contains the properties of NavigationStart
			if (ev instanceof NavigationEnd) {
				if (ev.url == this.lastPoppedUrl) {
					this.lastPoppedUrl = undefined;
					scrollheight = this.yScrollStack.pop();
				} else{
					scrollheight = 0;
				}
				contentContainer.scrollTo(0, scrollheight);
			}
			else if (ev instanceof NavigationStart) {
				if (ev.url != this.lastPoppedUrl){
					this.yScrollStack.push(contentContainer.scrollTop);
				}
			}
			
		});
	}
	onNavClick() {
		this.showNav = ! this.showNav;
	}
	logout(){
		this.cognitoMain.logout();
	}

}
