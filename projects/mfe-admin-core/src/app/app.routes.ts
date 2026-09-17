import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AnalyticsComponent } from './analytics/analytics.component';
import { AdminUsersComponent } from './users/users.component';
import { AdminRolesComponent } from './roles/roles.component';

export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'roles', component: AdminRolesComponent },
      
      // Load CMS MFE routes directly into the Admin Layout
      {
        path: '',
        loadChildren: () => import('@angular-architects/native-federation').then(m => m.loadRemoteModule('mfe-admin-cms', './Routes').then(mod => mod.routes))
      },
      
      // Load Shop MFE routes directly into the Admin Layout
      {
        path: '',
        loadChildren: () => import('@angular-architects/native-federation').then(m => m.loadRemoteModule('mfe-admin-shop', './Routes').then(mod => mod.routes))
      }
    ]
  }
];
