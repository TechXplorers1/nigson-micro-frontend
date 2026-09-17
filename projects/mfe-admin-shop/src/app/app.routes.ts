import { Routes } from '@angular/router';

export const routes: Routes = [
  // Sales & CRM Routes
  {
    path: 'orders',
    loadComponent: () => import('./sales/orders.component').then(m => m.AdminOrdersComponent)
  },
  {
    path: 'customers',
    loadComponent: () => import('./sales/customers.component').then(m => m.AdminCustomersComponent)
  },
  {
    path: 'quotes',
    loadComponent: () => import('./sales/quotes.component').then(m => m.AdminQuotesComponent)
  },
  {
    path: 'applications',
    loadComponent: () => import('./sales/applications.component').then(m => m.AdminApplicationsComponent)
  },
  {
    path: 'inquiries',
    loadComponent: () => import('./sales/inquiries.component').then(m => m.AdminInquiriesComponent)
  },
  
  // Inventory Routes
  {
    path: 'inventory',
    loadComponent: () => import('./inventory/inventory-dashboard.component').then(m => m.InventoryDashboardComponent)
  },
  {
    path: 'inventory/products',
    loadComponent: () => import('./inventory/product-list.component').then(m => m.ProductListComponent)
  },
  {
    path: 'inventory/products/new',
    loadComponent: () => import('./inventory/product-edit.component').then(m => m.ProductEditComponent)
  },
  {
    path: 'inventory/products/:sku/edit',
    loadComponent: () => import('./inventory/product-edit.component').then(m => m.ProductEditComponent)
  },
  {
    path: 'inventory/stock-in',
    loadComponent: () => import('./inventory/stock-adjustment.component').then(m => m.StockAdjustmentComponent),
    data: { type: 'stock-in' }
  },
  {
    path: 'inventory/adjustment',
    loadComponent: () => import('./inventory/stock-adjustment.component').then(m => m.StockAdjustmentComponent),
    data: { type: 'adjustment' }
  },
  {
    path: 'inventory/movements',
    loadComponent: () => import('./inventory/stock-movements.component').then(m => m.StockMovementsComponent)
  },
  {
    path: 'inventory/low-stock',
    loadComponent: () => import('./inventory/stock-report.component').then(m => m.StockReportComponent),
    data: { type: 'low-stock' }
  },
  {
    path: 'inventory/out-of-stock',
    loadComponent: () => import('./inventory/stock-report.component').then(m => m.StockReportComponent),
    data: { type: 'out-of-stock' }
  }
];
