import {
  Component, OnInit, OnDestroy, inject, signal, computed, HostListener
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../core/auth/auth-store';
import { AdminService } from '../admin.service';
import { environment } from '../../../environments/enviroment';
import { AdminHealth } from '../admin.models';
import { interval, Subscription } from 'rxjs';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private adminSvc = inject(AdminService);
  private authStore = inject(AuthStore);
  private router = inject(Router);

  user = this.authStore.user;
  isProd = environment.production;
  appUrl = environment.appUrl;
  sidebarOpen = signal(true);
  mobileDrawerOpen = signal(false);
  health = signal<AdminHealth | null>(null);
  reportesBadge = signal(0);
  isMobile = signal(false);

  private subs: Subscription[] = [];

  navGroups: NavGroup[] = [
    {
      title: 'Analítica',
      items: [
        { label: 'Dashboard', icon: 'fa-chart-pie', route: '/admin/dashboard' },
        { label: 'Estadísticas live', icon: 'fa-chart-line', route: '/admin/estadisticas' },
      ],
    },
    {
      title: 'Usuarios & Seguridad',
      items: [
        { label: 'Usuarios', icon: 'fa-users', route: '/admin/usuarios' },
        { label: 'Fraude', icon: 'fa-magnifying-glass', route: '/admin/fraude' },
        { label: 'Sanciones', icon: 'fa-ban', route: '/admin/sanciones' },
      ],
    },
    {
      title: 'Moderación',
      items: [
        { label: 'Reportes', icon: 'fa-flag', route: '/admin/reportes' },
        { label: 'Devoluciones', icon: 'fa-rotate-left', route: '/admin/devoluciones' },
      ],
    },
    {
      title: 'Comercio',
      items: [
        { label: 'Productos', icon: 'fa-box', route: '/admin/productos' },
        { label: 'Ofertas', icon: 'fa-tag', route: '/admin/ofertas' },
        { label: 'Cupones', icon: 'fa-ticket', route: '/admin/cupones' },
        { label: 'Vehículos', icon: 'fa-car', route: '/admin/vehiculos' },
        { label: 'Categorías', icon: 'fa-layer-group', route: '/admin/categorias' },
      ],
    },
    {
      title: 'Comunicación',
      items: [
        { label: 'Newsletter', icon: 'fa-envelope', route: '/admin/newsletter' },
        { label: 'Contratos', icon: 'fa-file-contract', route: '/admin/contratos' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { label: 'Configuración', icon: 'fa-gear', route: '/admin/configuracion' },
        { label: 'Audit Log', icon: 'fa-scroll', route: '/admin/audit-log' },
      ],
    },
  ];

  ngOnInit(): void {
    this.checkMobile();
    this.loadHealth();
    this.loadReportesBadge();

    const healthSub = interval(60_000).subscribe(() => this.loadHealth());
    const badgeSub = interval(30_000).subscribe(() => this.loadReportesBadge());
    this.subs.push(healthSub, badgeSub);

    // Auto-inject badge on Reportes navitem
    this.subs.push(
      this.adminSvc.getCountReportesPendientes().subscribe(res => {
        this.reportesBadge.set(res.total);
        const modGroup = this.navGroups.find(g => g.title === 'Moderación');
        if (modGroup) {
          const rep = modGroup.items.find(i => i.label === 'Reportes');
          if (rep) rep.badge = res.total;
        }
      })
    );
  }

  @HostListener('window:resize')
  onResize() { this.checkMobile(); }

  checkMobile() {
    this.isMobile.set(window.innerWidth < 1024);
    if (!this.isMobile()) this.mobileDrawerOpen.set(false);
  }

  loadHealth() {
    this.adminSvc.getHealth().subscribe({
      next: h => this.health.set(h),
      error: () => this.health.set({ version: '—', uptime: '—', status: 'DOWN' }),
    });
  }

  loadReportesBadge() {
    this.adminSvc.getCountReportesPendientes().subscribe({
      next: r => {
        this.reportesBadge.set(r.total);
        const mod = this.navGroups.find(g => g.title === 'Moderación');
        if (mod) {
          const rep = mod.items.find(i => i.label === 'Reportes');
          if (rep) rep.badge = r.total;
        }
      },
    });
  }

  openApp() {
    window.open(this.appUrl, '_blank');
  }

  toggleMobileDrawer() {
    this.mobileDrawerOpen.update(v => !v);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
