import { Routes } from '@angular/router';

export const MEMBERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./members/members').then(m => m.MembersComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./member/member').then(m => m.MemberComponent),
  },
];
