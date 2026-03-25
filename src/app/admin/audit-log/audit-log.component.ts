import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../admin.service';
import { AuditLogEntry, PagedResult } from '../admin.models';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.css'],
})
export class AuditLogComponent implements OnInit {
  private svc = inject(AdminService);

  result = signal<PagedResult<AuditLogEntry> | null>(null);
  loading = signal(true);
  page = 0;

  // Filters
  adminFilter = '';
  tipoFilter = '';
  entidadFilter = '';
  fechaDesde = '';
  fechaHasta = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    const params: any = { page: this.page, size: 30 };
    if (this.adminFilter) params.admin = this.adminFilter;
    if (this.tipoFilter) params.accion = this.tipoFilter;
    if (this.entidadFilter) params.entidadTipo = this.entidadFilter;
    if (this.fechaDesde) params.desde = this.fechaDesde;
    if (this.fechaHasta) params.hasta = this.fechaHasta;
    this.svc.getAuditLog(params).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  exportCsv(): void {
    this.svc.exportAuditLog().subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('es-ES');
  }

  prevPage(): void { if (this.page > 0) { this.page--; this.load(); } }
  nextPage(): void {
    const r = this.result();
    if (r && this.page < r.totalPages - 1) { this.page++; this.load(); }
  }
}
