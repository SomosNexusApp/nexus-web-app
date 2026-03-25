import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../admin.service';
import { AdminSancion, PagedResult } from '../admin.models';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-sanciones',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1 class="page-title"><i class="fa-solid fa-ban"></i> Sanciones</h1>
      </div>

      <div class="tabs-bar">
        <button class="tab-btn" [class.active]="tab() === 'ACTIVA'" (click)="setTab('ACTIVA')">Activas</button>
        <button class="tab-btn" [class.active]="tab() === 'HISTORICO'" (click)="setTab('HISTORICO')">Historial</button>
        <button class="export-btn" (click)="exportCsv()"><i class="fa-solid fa-download"></i> Exportar CSV</button>
      </div>

      <div class="admin-card">
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Tipo</th>
                <th>Motivo</th>
                <th>Admin</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (s of result()?.content || []; track s.id) {
                <tr>
                  <td>
                    <div class="user-cell">
                      <app-avatar [avatarUrl]="s.avatar" [username]="s.user" [size]="32"></app-avatar>
                      <span>@{{ s.user }}</span>
                    </div>
                  </td>
                  <td><span class="tipo-badge" [class.ban]="s.tipo === 'BAN'" [class.susp]="s.tipo === 'SUSPENSION'">{{ s.tipo }}</span></td>
                  <td class="motivo-cell">{{ s.motivo }}</td>
                  <td class="dim">{{ s.adminQueSanciono || '—' }}</td>
                  <td class="dim">{{ s.fechaInicio | date:'dd MMM yyyy' }}</td>
                  <td class="dim">{{ s.tipo === 'BAN' ? 'Permanente' : (s.fechaFin | date:'dd MMM yyyy') }}</td>
                  <td>
                    @if (s.activo) {
                      <button class="btn-action-sm" (click)="openDesbandModal(s)">Levantar</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="empty-row">Sin sanciones en este filtro</td></tr>
              }
            </tbody>
          </table>
        </div>
        @if (result() && result()!.totalPages > 1) {
          <div class="pagination">
            <button class="page-btn" [disabled]="page === 0" (click)="prevPage()"><i class="fa-solid fa-chevron-left"></i></button>
            <span>{{ page + 1 }} / {{ result()!.totalPages }}</span>
            <button class="page-btn" [disabled]="page >= result()!.totalPages - 1" (click)="nextPage()"><i class="fa-solid fa-chevron-right"></i></button>
          </div>
        }
      </div>
    </div>

    @if (showDesbanModal() && selected()) {
      <div class="modal-overlay">
        <div class="modal">
          <h3><i class="fa-solid fa-unlock"></i> Levantar sanción a @{{ selected()!.user }}</h3>
          <textarea [(ngModel)]="motivo" placeholder="Motivo del levantamiento..." rows="4" class="modal-textarea"></textarea>
          <div class="modal-actions">
            <button class="btn-modal-cancel" (click)="showDesbanModal.set(false)">Cancelar</button>
            <button class="btn-modal-confirm success" [disabled]="!motivo" (click)="doLevantar()">Levantar</button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrls: ['../usuarios/usuarios.component.css'],
})
export class SancionesComponent implements OnInit {
  private svc = inject(AdminService);
  result = signal<PagedResult<AdminSancion> | null>(null);
  tab = signal<'ACTIVA' | 'HISTORICO'>('ACTIVA');
  page = 0;
  showDesbanModal = signal(false);
  selected = signal<AdminSancion | null>(null);
  motivo = '';

  ngOnInit(): void { this.load(); }

  setTab(t: 'ACTIVA' | 'HISTORICO'): void { this.tab.set(t); this.page = 0; this.load(); }

  load(): void {
    const params: any = { page: this.page, size: 20 };
    if (this.tab() === 'ACTIVA') params.estado = 'ACTIVA';
    this.svc.getSanciones(params).subscribe({ next: r => this.result.set(r) });
  }

  openDesbandModal(s: AdminSancion): void { this.selected.set(s); this.showDesbanModal.set(true); }

  doLevantar(): void {
    const s = this.selected();
    if (!s || !this.motivo) return;
    this.svc.desbanearUsuario(s.id, this.motivo).subscribe(() => {
      this.showDesbanModal.set(false); this.motivo = ''; this.load();
    });
  }

  exportCsv(): void {
    window.open(`${this.svc['base']}/sanciones/export`, '_blank');
  }

  prevPage(): void { if (this.page > 0) { this.page--; this.load(); } }
  nextPage(): void {
    const r = this.result();
    if (r && this.page < r.totalPages - 1) { this.page++; this.load(); }
  }
}
