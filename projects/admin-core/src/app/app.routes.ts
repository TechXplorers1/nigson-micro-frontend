import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AnalyticsComponent } from './analytics/analytics.component';
import { AdminUsersComponent } from './users/users.component';
import { AdminRolesComponent } from './roles/roles.component';

// These are only the routes that admin-core directly owns.
// The admin-cms and admin-shop child routes are wired up by the shell,
// which is the only host that can call loadRemoteModule for other remotes.
export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AdminDashboardComponent, pathMatch: 'full' },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'roles', component: AdminRolesComponent },
    ]
  }
];
