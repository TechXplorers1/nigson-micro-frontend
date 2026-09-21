import { Routes, UrlSegment, UrlMatchResult } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AnalyticsComponent } from './analytics/analytics.component';
import { AdminUsersComponent } from './users/users.component';
import { AdminRolesComponent } from './roles/roles.component';

export function cmsMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  const cmsRoutes = ['blog', 'pages', 'reviews'];
  if (segments.length > 0 && cmsRoutes.includes(segments[0].path)) {
    return { consumed: [] }; // Do not consume segments so children can match them
  }
  return null;
}

export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AdminDashboardComponent, pathMatch: 'full' },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'roles', component: AdminRolesComponent },
      
      // Load CMS routes conditionally using a matcher
      {
        matcher: cmsMatcher,
        loadChildren: () => loadRemoteModule('admin-cms', './Routes')
          .then(m => m.routes)
          .catch(err => { console.error('Error loading admin-cms', err); return []; })
      },
      
      // Load Shop routes as fallback for all other inventory/sales routes
      {
        path: '',
        loadChildren: () => loadRemoteModule('admin-shop', './Routes')
          .then(m => m.routes)
          .catch(err => { console.error('Error loading admin-shop', err); return []; })
      }
    ]
  }
];
