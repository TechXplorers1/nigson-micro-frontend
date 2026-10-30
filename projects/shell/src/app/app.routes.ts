import { Routes, UrlSegment } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { BffCallbackComponent } from './bff-callback/bff-callback.component';
import { authGuard, adminGuard } from 'shared-ui';

export function shopMatcher(url: UrlSegment[]) {
  if (url.length === 0) return null;
  const path = url[0].path;
  if (['products', 'cart', 'checkout', 'search', 'quote'].includes(path)) {
    return { consumed: [] };
  }
  return null;
}

export const routes: Routes = [
  {
    path: 'auth/callback',
    component: BffCallbackComponent
  },
  {
    path: 'auth',
    loadChildren: () => loadRemoteModule('auth', './Routes')
      .then(m => m.routes)
      .catch(() => import('../../../auth/src/app/app.routes').then(m => m.routes))
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadChildren: () => loadRemoteModule('account', './Routes')
      .then(m => m.routes)
      .catch(() => import('../../../account/src/app/app.routes').then(m => m.routes))
  },

  // â”€â”€ Admin section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // The shell owns the full /admin route tree because only the host (shell) app
  // can call loadRemoteModule for other remotes via the federation orchestrator.
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => loadRemoteModule('admin-core', './AdminLayout')
      .then(m => m.AdminLayoutComponent),
    children: [
      // admin-core owned routes
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => loadRemoteModule('admin-core', './AdminDashboard')
          .then(m => m.AdminDashboardComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => loadRemoteModule('admin-core', './Analytics')
          .then(m => m.AnalyticsComponent)
      },
      {
        path: 'users',
        loadComponent: () => loadRemoteModule('admin-core', './Users')
          .then(m => m.AdminUsersComponent)
      },
      {
        path: 'roles',
        loadComponent: () => loadRemoteModule('admin-core', './Roles')
          .then(m => m.AdminRolesComponent)
      },

      // CMS routes (admin-cms MFE)
      {
        path: 'pages',
        loadComponent: () => loadRemoteModule({
          remoteName: 'admin-cms',
          remoteEntry: 'http://localhost:4211/remoteEntry.json',
          exposedModule: './Pages'
        }).then(m => m.AdminPagesComponent)
      },
      {
        path: 'pages/:id',
        loadComponent: () => loadRemoteModule({
          remoteName: 'admin-cms',
          remoteEntry: 'http://localhost:4211/remoteEntry.json',
          exposedModule: './VisualHome'
        }).then(m => m.VisualHomeEditorComponent)
      },
      {
        path: 'reviews',
        loadComponent: () => loadRemoteModule({
          remoteName: 'admin-cms',
          remoteEntry: 'http://localhost:4211/remoteEntry.json',
          exposedModule: './Reviews'
        }).then(m => m.AdminReviewsComponent)
      },
      {
        path: 'blog',
        loadComponent: () => loadRemoteModule({
          remoteName: 'admin-cms',
          remoteEntry: 'http://localhost:4211/remoteEntry.json',
          exposedModule: './Blog'
        }).then(m => m.AdminBlogComponent)
      },

      // Inventory routes (admin-shop MFE)
      {
        path: 'inventory',
        loadComponent: () => loadRemoteModule('admin-shop', './InventoryDashboard')
          .then(m => m.InventoryDashboardComponent)
      },
      {
        path: 'inventory/products',
        loadComponent: () => loadRemoteModule('admin-shop', './ProductList')
          .then(m => m.ProductListComponent)
      },
      {
        path: 'inventory/products/new',
        loadComponent: () => loadRemoteModule('admin-shop', './ProductEdit')
          .then(m => m.ProductEditComponent)
      },
      {
        path: 'inventory/products/:sku/edit',
        loadComponent: () => loadRemoteModule('admin-shop', './ProductEdit')
          .then(m => m.ProductEditComponent)
      },
      {
        path: 'inventory/stock-in',
        loadComponent: () => loadRemoteModule('admin-shop', './StockAdjustment')
          .then(m => m.StockAdjustmentComponent),
        data: { type: 'stock-in' }
      },
      {
        path: 'inventory/adjustment',
        loadComponent: () => loadRemoteModule('admin-shop', './StockAdjustment')
          .then(m => m.StockAdjustmentComponent),
        data: { type: 'adjustment' }
      },
      {
        path: 'inventory/movements',
        loadComponent: () => loadRemoteModule('admin-shop', './StockMovements')
          .then(m => m.StockMovementsComponent)
      },
      {
        path: 'inventory/low-stock',
        loadComponent: () => loadRemoteModule('admin-shop', './StockReport')
          .then(m => m.StockReportComponent),
        data: { type: 'low-stock' }
      },
      {
        path: 'inventory/out-of-stock',
        loadComponent: () => loadRemoteModule('admin-shop', './StockReport')
          .then(m => m.StockReportComponent),
        data: { type: 'out-of-stock' }
      },

      // Sales / Lead routes (admin-shop MFE)
      {
        path: 'orders',
        loadComponent: () => loadRemoteModule('admin-shop', './Orders')
          .then(m => m.AdminOrdersComponent)
      },
      {
        path: 'customers',
        loadComponent: () => loadRemoteModule('admin-shop', './Customers')
          .then(m => m.AdminCustomersComponent)
      },
      {
        path: 'quotes',
        loadComponent: () => loadRemoteModule('admin-shop', './Quotes')
          .then(m => m.AdminQuotesComponent)
      },
      {
        path: 'applications',
        loadComponent: () => loadRemoteModule('admin-shop', './Applications')
          .then(m => m.AdminApplicationsComponent)
      },
      {
        path: 'inquiries',
        loadComponent: () => loadRemoteModule('admin-shop', './Inquiries')
          .then(m => m.AdminInquiriesComponent)
      },
    ]
  },

  // â”€â”€ Public / Shop routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    path: '',
    loadChildren: () => loadRemoteModule('marketing', './Routes')
      .then(m => m.routes)
      .catch(() => import('../../../marketing/src/app/app.routes').then(m => m.routes))
  },
  {
    matcher: shopMatcher,
    loadChildren: () => loadRemoteModule('shop', './Routes')
      .then(m => m.routes)
      .catch(err => {
        console.warn('[Shell] Remote shop load failed, falling back to local shop routes:', err);
        return import('../../../shop/src/app/app.routes').then(m => m.routes);
      })
  }
];


