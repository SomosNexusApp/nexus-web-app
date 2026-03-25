import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AdminService } from '../admin.service';
import { AdminReporte, PagedResult } from '../admin.models';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AvatarComponent],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css'],
})
export class ReportesComponent implements OnInit {
  private svc = inject(AdminService);
  private route = inject(ActivatedRoute);

  tabs = ['PENDIENTE', 'EN_REVISION', 'RESUELTO', 'DESESTIMADO'];
  tabLabels: Record<string, string> = {
    PENDIENTE: 'Pendientes',
    EN_REVISION: 'En revisión',
    RESUELTO: 'Resueltos',
    DESESTIMADO: 'Desestimados',
  };

  activeTab = signal('PENDIENTE');
  result = signal<PagedResult<AdminReporte> | null>(null);
  loading = signal(true);
  selectedReporte = signal<AdminReporte | null>(null);
  panelOpen = signal(false);
  page = 0;

  // Action modals
  showResolutionModal = signal(false);
  showDestimarModal = signal(false);
  showSuspenderModal = signal(false);
  showBanModal = signal(false);
  showEliminarModal = signal(false);
  resolucionTexto = '';
  motivoSuspension = '';
  duracionHoras = 24;
  motivoBan = '';
  accionPendiente = '';

  ngOnInit(): void {
    this.route.queryParams.subscribe(p => {
      if (p['id']) {
        // Open specific reporte via query param
      }
    });
    this.loadReportes();
  }

  setTab(tab: string): void {
    this.activeTab.set(tab);
    this.page = 0;
    this.loadReportes();
  }

  loadReportes(): void {
    this.loading.set(true);
    this.svc.getReportes({ estado: this.activeTab(), page: this.page, size: 20 }).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openPanel(r: AdminReporte): void {
    this.selectedReporte.set(r);
    this.panelOpen.set(true);
  }

  closePanel(): void { this.panelOpen.set(false); }

  markEnRevision(): void {
    this.updateEstado('EN_REVISION');
  }

  resolverSinAccion(): void {
    if (!this.resolucionTexto) return;
    this.updateEstado('RESUELTO', this.resolucionTexto);
    this.showResolutionModal.set(false);
    this.resolucionTexto = '';
  }

  desestimar(): void {
    this.updateEstado('DESESTIMADO');
    this.showDestimarModal.set(false);
  }

  advertirUsuario(): void {
    const r = this.selectedReporte();
    if (!r?.actorDenunciado) return;
    this.svc.enviarAviso(r.actorDenunciado.id, `Advertencia en relación al reporte #${r.id}: ${r.motivo}`).subscribe(() => {
      this.updateEstado('RESUELTO', 'Advertencia enviada al usuario');
    });
  }

  eliminarContenido(): void {
    const r = this.selectedReporte();
    if (!r) return;
    this.updateEstado('RESUELTO', 'Contenido eliminado');
    this.showEliminarModal.set(false);
  }

  doSuspenderYResolver(): void {
    const r = this.selectedReporte();
    if (!r || !r.actorDenunciado) return;
    this.svc.suspenderYResolver({
      usuarioId: r.actorDenunciado.id,
      duracionHoras: this.duracionHoras,
      motivo: this.motivoSuspension,
      reporteId: r.id,
    }).subscribe(() => {
      this.showSuspenderModal.set(false);
      this.motivoSuspension = '';
      this.loadReportes();
      this.closePanel();
    });
  }

  doBanearYResolver(): void {
    const r = this.selectedReporte();
    if (!r || !r.actorDenunciado) return;
    Promise.all([
      this.svc.banearUsuario(r.actorDenunciado.id, this.motivoBan).toPromise(),
      this.svc.updateReporte(r.id, { estado: 'RESUELTO', resolucion: `Ban: ${this.motivoBan}` }).toPromise(),
    ]).then(() => {
      this.showBanModal.set(false);
      this.motivoBan = '';
      this.loadReportes();
      this.closePanel();
    });
  }

  private updateEstado(estado: string, resolucion?: string): void {
    const r = this.selectedReporte();
    if (!r) return;
    const body: any = { estado };
    if (resolucion) body.resolucion = resolucion;
    this.svc.updateReporte(r.id, body).subscribe(() => {
      this.loadReportes();
      this.closePanel();
    });
  }

  prevPage(): void { if (this.page > 0) { this.page--; this.loadReportes(); } }
  nextPage(): void {
    const r = this.result();
    if (r && this.page < r.totalPages - 1) { this.page++; this.loadReportes(); }
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
