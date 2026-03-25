import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../admin.service';
import { AdminDevolucion, PagedResult } from '../admin.models';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-devoluciones-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  templateUrl: './devoluciones.component.html',
  styleUrls: ['./devoluciones.component.css'],
})
export class DevolucionesAdminComponent implements OnInit {
  private svc = inject(AdminService);

  tabs = ['SOLICITADA', 'EN_REVISION', 'ACEPTADA', 'RECHAZADA', 'COMPLETADA'];
  activeTab = signal('SOLICITADA');
  result = signal<PagedResult<AdminDevolucion> | null>(null);
  selectedDev = signal<AdminDevolucion | null>(null);
  panelOpen = signal(false);
  page = 0;

  showAceptarModal = signal(false);
  showRechazarModal = signal(false);
  showCerrarModal = signal(false);

  notaAceptar = '';
  importeReembolso = 0;
  esReembolsoParcial = false;
  motivoRechazo = '';
  motivoCierre = '';

  ngOnInit(): void { this.load(); }

  setTab(tab: string): void { this.activeTab.set(tab); this.page = 0; this.load(); }

  load(): void {
    this.svc.getDevoluciones({ estado: this.activeTab(), page: this.page, size: 20 }).subscribe({
      next: r => this.result.set(r),
    });
  }

  openPanel(d: AdminDevolucion): void {
    this.selectedDev.set(d);
    this.importeReembolso = d.compra.precioFinal;
    this.panelOpen.set(true);
  }

  closePanel(): void { this.panelOpen.set(false); }

  doAceptar(): void {
    const d = this.selectedDev();
    if (!d) return;
    this.svc.aceptarDevolucion(d.id, {
      nota: this.notaAceptar,
      importeReembolso: this.importeReembolso,
    }).subscribe(() => {
      this.showAceptarModal.set(false);
      this.load();
      this.closePanel();
    });
  }

  doRechazar(): void {
    const d = this.selectedDev();
    if (!d) return;
    this.svc.rechazarDevolucion(d.id, this.motivoRechazo).subscribe(() => {
      this.showRechazarModal.set(false);
      this.load();
      this.closePanel();
    });
  }

  doCerrar(): void {
    const d = this.selectedDev();
    if (!d) return;
    this.svc.cerrarDevolucion(d.id, this.motivoCierre).subscribe(() => {
      this.showCerrarModal.set(false);
      this.load();
      this.closePanel();
    });
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  prevPage(): void { if (this.page > 0) { this.page--; this.load(); } }
  nextPage(): void {
    const r = this.result();
    if (r && this.page < r.totalPages - 1) { this.page++; this.load(); }
  }
}
