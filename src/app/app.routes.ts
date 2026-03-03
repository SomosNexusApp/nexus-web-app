import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then((m) => m.HomeComponent),
  },

  // Auth
  {
    path: 'login',
    loadComponent: () =>
      import('./components/auth/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/auth/register/register.component').then((m) => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./components/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./components/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./components/auth/verify-email/verify-email.component').then(
        (m) => m.VerifyEmailComponent,
      ),
  },

  // // Public
  {
    path: 'search',
    loadComponent: () =>
      import('./components/search/search.component').then((m) => m.SearchComponent),
  },
  // {
  //   path: 'categorias/:slug',
  //   loadComponent: () =>
  //     import('./components/categorias/categoria-detail/categoria-detail.component').then(
  //       (m) => m.CategoriaDetailComponent,
  //     ),
  // },
  // {
  //   path: 'productos/:id',
  //   loadComponent: () =>
  //     import('./components/marketplace/producto-detail/producto-detail.component').then(
  //       (m) => m.ProductoDetailComponent,
  //     ),
  // },
  // {
  //   path: 'ofertas/:id',
  //   loadComponent: () =>
  //     import('./components/ofertas/oferta-detail/oferta-detail.component').then(
  //       (m) => m.OfertaDetailComponent,
  //     ),
  // },
  // {
  //   path: 'vehiculos/:id',
  //   loadComponent: () =>
  //     import('./components/vehiculos/vehiculo-detail/vehiculo-detail.component').then(
  //       (m) => m.VehiculoDetailComponent,
  //     ),
  // },

  // // Protected - User Actions
  // {
  //   path: 'publicar',
  //   loadComponent: () =>
  //     import('./components/marketplace/publish/publish.component').then((m) => m.PublishComponent),
  //   canActivate: [authGuard],
  // },
  // {
  //   path: 'checkout/:productoId',
  //   loadComponent: () =>
  //     import('./components/compras/checkout/checkout.component').then((m) => m.CheckoutComponent),
  //   canActivate: [authGuard],
  // },
  // {
  //   path: 'compras/:id',
  //   loadComponent: () =>
  //     import('./components/compras/compra-detail/compra-detail.component').then(
  //       (m) => m.CompraDetailComponent,
  //     ),
  //   canActivate: [authGuard],
  // },
  // {
  //   path: 'devoluciones/nueva/:compraId',
  //   loadComponent: () =>
  //     import('./components/devoluciones/nueva-devolucion/nueva-devolucion.component').then(
  //       (m) => m.NuevaDevolucionComponent,
  //     ),
  //   canActivate: [authGuard],
  // },
  // {
  //   path: 'mensajes',
  //   loadComponent: () =>
  //     import('./components/mensajes/conversaciones-list/conversaciones-list.component').then(
  //       (m) => m.ConversacionesListComponent,
  //     ),
  //   canActivate: [authGuard],
  // },

  // // Perfiles
  // {
  //   path: 'perfil',
  //   loadComponent: () =>
  //     import('./components/perfil/mi-cuenta/mi-cuenta.component').then((m) => m.MiCuentaComponent),
  //   canActivate: [authGuard],
  // },
  // {
  //   path: 'perfil/:username',
  //   loadComponent: () =>
  //     import('./components/perfil/perfil-publico/perfil-publico.component').then(
  //       (m) => m.PerfilPublicoComponent,
  //     ),
  // },
  // {
  //   path: 'configuracion',
  //   loadComponent: () =>
  //     import('./components/perfil/configuracion/configuracion.component').then(
  //       (m) => m.ConfiguracionComponent,
  //     ),
  //   canActivate: [authGuard],
  // },

  // // Legal
  // {
  //   path: 'legal/terminos',
  //   loadComponent: () =>
  //     import('./components/legal/terminos/terminos.component').then((m) => m.TerminosComponent),
  // },
  // {
  //   path: 'legal/privacidad',
  //   loadComponent: () =>
  //     import('./components/legal/privacidad/privacidad.component').then(
  //       (m) => m.PrivacidadComponent,
  //     ),
  // },

  // // Admin
  // {
  //   path: 'admin',
  //   loadChildren: () => import('./components/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  //   canActivate: [adminGuard],
  // },

  // Wildcard (404 / Redirect)
  { path: '**', redirectTo: '' },
];
