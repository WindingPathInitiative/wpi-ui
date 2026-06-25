import { Routes } from '@angular/router';

export const LOCATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./location-list/location-list').then(m => m.LocationListComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./location/location').then(m => m.LocationComponent),
  },
];
