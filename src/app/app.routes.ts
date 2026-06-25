import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then(m => m.HomeComponent),
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'locations',
    loadChildren: () => import('./locations/locations.routes').then(m => m.LOCATIONS_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'members',
    loadChildren: () => import('./members/members.routes').then(m => m.MEMBERS_ROUTES),
    canActivate: [authGuard],
  },
];
