import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/feed', pathMatch: 'full' },
  
  // Feed principal
  { 
    path: 'feed', 
    loadComponent: () => import('./pages/feed/feed.component').then(m => m.FeedComponent) 
  },
  
  // Ofertas
  { 
    path: 'ofertas', 
    loadComponent: () => import('./pages/ofertas/ofertas.component').then(m => m.OfertasComponent) 
  },
  { 
    path: 'oferta/:id', 
    loadComponent: () => import('./components/product-detail/product-detail.component').then(m => m.ProductDetailComponent) 
  },
  
  // Productos
  { 
    path: 'productos', 
    loadComponent: () => import('./pages/productos/productos.component').then(m => m.ProductosComponent) 
  },
  { 
    path: 'producto/:id', 
    loadComponent: () => import('./components/product-detail/product-detail.component').then(m => m.ProductDetailComponent) 
  },
  
  // Vehículos
  { 
    path: 'vehiculos', 
    loadComponent: () => import('./pages/vehiculos/vehiculos.component').then(m => m.VehiculosComponent) 
  },
  
  // Auth
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'registro', 
    loadComponent: () => import('./pages/registro/registro.component').then(m => m.RegistroComponent) 
  },
  
  // Área privada
  { 
    path: 'perfil', 
    loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.PerfilComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'publicar', 
    loadComponent: () => import('./pages/publicar/publicar.component').then(m => m.PublicarComponent),
    canActivate: [authGuard]
  },
  
  // Admin
  { 
    path: 'admin', 
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ADMIN' }
  },
  
  // 404
  { path: '**', redirectTo: '/feed' }
];