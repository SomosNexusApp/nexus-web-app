import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'estadisticas',
        loadComponent: () =>
          import('./estadisticas/estadisticas.component').then(m => m.EstadisticasComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./usuarios/usuarios.component').then(m => m.UsuariosAdminComponent),
      },
      {
        path: 'fraude',
        loadComponent: () =>
          import('./fraude/fraude.component').then(m => m.FraudeComponent),
      },
      {
        path: 'sanciones',
        loadComponent: () =>
          import('./sanciones/sanciones.component').then(m => m.SancionesComponent),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./reportes/reportes.component').then(m => m.ReportesComponent),
      },
      {
        path: 'devoluciones',
        loadComponent: () =>
          import('./devoluciones/devoluciones.component').then(m => m.DevolucionesAdminComponent),
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./productos/productos-admin.component').then(m => m.ProductosAdminComponent),
      },
      {
        path: 'ofertas',
        loadComponent: () =>
          import('./ofertas/ofertas-admin.component').then(m => m.OfertasAdminComponent),
      },
      {
        path: 'cupones',
        loadComponent: () =>
          import('./cupones/cupones.component').then(m => m.CuponesComponent),
      },
      {
        path: 'vehiculos',
        loadComponent: () =>
          import('./vehiculos/vehiculos-admin.component').then(m => m.VehiculosAdminComponent),
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./categorias/categorias-admin.component').then(m => m.CategoriasAdminComponent),
      },
      {
        path: 'newsletter',
        loadComponent: () =>
          import('./newsletter/newsletter-admin.component').then(m => m.NewsletterAdminComponent),
      },
      {
        path: 'contratos',
        loadComponent: () =>
          import('./contratos/contratos-admin.component').then(m => m.ContratosAdminComponent),
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./configuracion/configuracion-admin.component').then(m => m.ConfiguracionAdminComponent),
      },
      {
        path: 'audit-log',
        loadComponent: () =>
          import('./audit-log/audit-log.component').then(m => m.AuditLogComponent),
      },
    ],
  },
];
