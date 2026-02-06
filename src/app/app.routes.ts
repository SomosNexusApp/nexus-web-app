// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './guards/auth-guard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/feed', 
    pathMatch: 'full' 
  },
  
  // Feed principal (Home)
  { 
    path: 'feed', 
    loadComponent: () => import('./pages/feed/feed').then(m => m.FeedComponent) 
  },
  
  // Ofertas
  { 
    path: 'ofertas', 
    loadComponent: () => import('./pages/ofertas/ofertas').then(m => m.OfertasComponent) 
  },
  { 
    path: 'oferta/:id', 
    loadComponent: () => import('./components/product-detail/product-detail').then(m => m.ProductDetailComponent) 
  },
  
  // Productos
  { 
    path: 'productos', 
    loadComponent: () => import('./pages/productos/productos').then(m => m.ProductosComponent) 
  },
  { 
    path: 'producto/:id', 
    loadComponent: () => import('./components/product-detail/product-detail').then(m => m.ProductDetailComponent) 
  },
  
  // Vehículos
  { 
    path: 'vehiculos', 
    loadComponent: () => import('./pages/vehiculos/vehiculos').then(m => m.VehiculosComponent) 
  },
  
  // Autenticación
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./pages/registro/registro').then(m => m.RegistroComponent) 
  },
  
  // Área privada (requiere autenticación)
  { 
    path: 'perfil', 
    loadComponent: () => import('./pages/perfil/perfil').then(m => m.PerfilComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'publicar', 
    loadComponent: () => import('./pages/publicar/publicar').then(m => m.PublicarComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'favoritos', 
    loadComponent: () => import('./pages/favoritos/favoritos').then(m => m.FavoritosComponent),
    canActivate: [authGuard]
  },
  
  // Admin (requiere rol ADMIN)
  { 
    path: 'admin', 
    loadComponent: () => import('./pages/admin/admin').then(m => m.AdminComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ADMIN' }
  },
  
  // Categorías y búsqueda
  { 
    path: 'categorias', 
    loadComponent: () => import('./pages/categorias/categorias').then(m => m.CategoriasComponent) 
  },
  { 
    path: 'cerca', 
    loadComponent: () => import('./pages/cerca/cerca').then(m => m.CercaComponent) 
  },
  { 
    path: 'cupones', 
    loadComponent: () => import('./pages/cupones/cupones').then(m => m.CuponesComponent) 
  },
  
  // 404
  { 
    path: '**', 
    redirectTo: '/feed' 
  }
];