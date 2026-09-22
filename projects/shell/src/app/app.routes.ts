import { Routes, UrlSegment } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

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
    path: 'auth',
    loadChildren: () => loadRemoteModule('auth', './Routes').then(m => m.routes)
  },
  {
    path: 'account',
    loadChildren: () => loadRemoteModule('account', './Routes').then(m => m.routes)
  },

  // ── Admin section ─────────────────────────────────────────────────────────
  // The shell owns the full /admin route tree because only the host (shell) app
  // can call loadRemoteModule for other remotes via the federation orchestrator.
  {
    path: 'admin',
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
        loadComponent: () => loadRemoteModule('admin-cms', './Pages')
          .then(m => m.AdminPagesComponent)
      },
      {
        path: 'reviews',
        loadComponent: () => loadRemoteModule('admin-cms', './Reviews')
          .then(m => m.AdminReviewsComponent)
      },
      {
        path: 'blog',
        loadComponent: () => loadRemoteModule('admin-cms', './Blog')
          .then(m => m.AdminBlogComponent)
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

  // ── Public / Shop routes ─────────────────────────────────────────────────
  {
    path: '',
    loadChildren: () => loadRemoteModule('marketing', './Routes').then(m => m.routes)
  },
  {
    matcher: shopMatcher,
    loadChildren: () => loadRemoteModule('shop', './Routes').then(m => m.routes)
  }
];
