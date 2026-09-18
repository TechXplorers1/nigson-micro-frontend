import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const routes: Routes = [
  {
    path: 'marketing',
    loadChildren: () => loadRemoteModule('mfe-marketing', './Routes').then(m => m.routes)
  },
  {
    path: 'shop',
    loadChildren: () => loadRemoteModule('mfe-shop', './Routes').then(m => m.routes)
  },
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
  // ---------------------------------------------------------------------------
  // NEW MARKETING ROUTES
  // ---------------------------------------------------------------------------
  {
    path: 'about',
    loadChildren: () => import('@angular-architects/native-federation').then(m => m.loadRemoteModule('mfe-marketing', './Routes').then(mod => mod.routes))
  },
  {
    path: 'contact',
    loadChildren: () => import('@angular-architects/native-federation').then(m => m.loadRemoteModule('mfe-marketing', './Routes').then(mod => mod.routes))
  },
  {
    path: 'careers',
    loadChildren: () => import('@angular-architects/native-federation').then(m => m.loadRemoteModule('mfe-marketing', './Routes').then(mod => mod.routes))
  },
  {
    path: 'distributor',
    loadChildren: () => import('@angular-architects/native-federation').then(m => m.loadRemoteModule('mfe-marketing', './Routes').then(mod => mod.routes))
  },
  {
    path: 'blog',
    loadChildren: () => import('@angular-architects/native-federation').then(m => m.loadRemoteModule('mfe-marketing', './Routes').then(mod => mod.routes))
  },
  {
    path: 'insights',
    loadChildren: () => import('@angular-architects/native-federation').then(m => m.loadRemoteModule('mfe-marketing', './Routes').then(mod => mod.routes))
  },
  {
    path: 'support',
    loadChildren: () => import('@angular-architects/native-federation').then(m => m.loadRemoteModule('mfe-marketing', './Routes').then(mod => mod.routes))
  },
  // ---------------------------------------------------------------------------
  // NEW SHOP ROUTES
  // ---------------------------------------------------------------------------
  {
    path: 'search',
    loadChildren: () => import('@angular-architects/native-federation').then(m => m.loadRemoteModule('mfe-shop', './Routes').then(mod => mod.routes))
  },
  {
    path: 'quote',
    loadChildren: () => import('@angular-architects/native-federation').then(m => m.loadRemoteModule('mfe-shop', './Routes').then(mod => mod.routes))
  },
  {
    path: '',
    redirectTo: 'marketing',
    pathMatch: 'full'
  }
];
