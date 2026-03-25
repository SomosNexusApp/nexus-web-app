import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../admin.service';
import { AdminKpis, DiaValorDTO, CatValorDTO, AdminReporte } from '../admin.models';
import { interval, Subscription } from 'rxjs';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AvatarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private svc = inject(AdminService);

  kpis = signal<AdminKpis | null>(null);
  topVendedores = signal<any[]>([]);
  ultimasCompras = signal<any[]>([]);
  ultimosReportes = signal<AdminReporte[]>([]);
  loading = signal(true);
  lastRefresh = signal(new Date());

  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.loadAll();
    const refresh = interval(60_000).subscribe(() => this.loadAll());
    this.subs.push(refresh);
  }

  loadAll(): void {
    this.loading.set(true);

    this.svc.getKpis().subscribe({
      next: k => {
        this.kpis.set(k);
        this.loading.set(false);
        this.lastRefresh.set(new Date());
      },
      error: () => this.loading.set(false),
    });

    this.svc.getTopVendedores().subscribe({ next: v => this.topVendedores.set(v) });
    this.svc.getUltimasCompras().subscribe({ next: c => this.ultimasCompras.set(c) });
    this.svc.getUltimosReportes().subscribe({ next: r => this.ultimosReportes.set(r) });
  }

  get kpiCards() {
    const k = this.kpis();
    if (!k) return [];
    return [
      { label: 'Usuarios totales', value: k.usuariosTotal, delta: k.usuariosDelta, icon: 'fa-users', color: 'blue' },
      { label: 'Productos activos', value: k.productosActivos, delta: k.productosDelta, icon: 'fa-box', color: 'emerald' },
      { label: 'Ofertas activas', value: k.ofertasActivas, delta: k.ofertasDelta, icon: 'fa-tag', color: 'violet' },
      { label: 'Compras hoy', value: k.comprasHoy, delta: k.comprasDelta, icon: 'fa-bag-shopping', color: 'amber' },
      { label: 'Revenue mes (€)', value: k.revenueMes.toFixed(2) + ' €', delta: k.revenueDelta, icon: 'fa-euro-sign', color: 'green' },
      { label: 'Reportes pendientes', value: k.reportesPendientes, delta: k.reportesDelta, icon: 'fa-flag', color: k.reportesPendientes > 0 ? 'red' : 'gray', urgent: k.reportesPendientes > 0 },
    ];
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  estadoColor(estado: string): string {
    const map: Record<string, string> = {
      COMPLETADA: 'estado-verde',
      PENDIENTE: 'estado-naranja',
      REEMBOLSADA: 'estado-azul',
      CANCELADA: 'estado-rojo',
    };
    return map[estado] || 'estado-gray';
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
