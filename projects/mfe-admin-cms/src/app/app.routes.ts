import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'blog',
    loadComponent: () => import('./cms/blog.component').then(m => m.AdminBlogComponent)
  },
  {
    path: 'pages',
    loadComponent: () => import('./cms/pages.component').then(m => m.AdminPagesComponent)
  },
  {
    path: 'reviews',
    loadComponent: () => import('./cms/reviews.component').then(m => m.AdminReviewsComponent)
  }
];
