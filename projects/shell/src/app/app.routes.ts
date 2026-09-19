import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => loadRemoteModule('mfe-auth', './Routes').then(m => m.routes)
  },
  {
    path: 'account',
    loadChildren: () => loadRemoteModule('mfe-account', './Routes').then(m => m.routes)
  },
  {
    path: 'admin',
    loadChildren: () => loadRemoteModule('mfe-admin-core', './Routes').then(m => m.routes)
  },
  // Mount both Marketing and Shop routes directly into the Shell's root
  {
    path: '',
    loadChildren: () => Promise.all([
      loadRemoteModule('mfe-marketing', './Routes').then(m => m.routes),
      loadRemoteModule('mfe-shop', './Routes').then(m => m.routes)
    ]).then(([marketingRoutes, shopRoutes]) => {
      // Retain mfe-marketing's empty path (HomeComponent) but filter out mfe-shop's empty path redirect
      const shop = shopRoutes.filter((r: any) => r.path !== '');
      return [...marketingRoutes, ...shop];
    })
  }
];
