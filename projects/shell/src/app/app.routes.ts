import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => loadRemoteModule('auth', './Routes').then(m => m.routes)
  },
  {
    path: 'account',
    loadChildren: () => loadRemoteModule('account', './Routes').then(m => m.routes)
  },
  {
    path: 'admin',
    loadChildren: () => loadRemoteModule('admin-core', './Routes').then(m => m.routes)
  },
  {
    path: '',
    loadChildren: () => loadRemoteModule('marketing', './Routes').then(m => m.routes)
  },
  {
    path: 'shop',
    loadChildren: () => loadRemoteModule('shop', './Routes').then(m => m.routes)
  }
];
