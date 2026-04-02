import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { environment } from '../../../environments/enviroment';
import { AuthStore } from '../../core/auth/auth-store';
import { ToastService } from '../../core/services/toast.service';

interface ContratoRow {
  id: number;
  tipoContrato: string;
  estado: string;
  monto?: number;
  descripcion?: string;
  fecha?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

@Component({
  selector: 'app-empresa-contratos-page',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, DecimalPipe],
  templateUrl: './empresa-contratos-page.component.html',
  styleUrl: './empresa-contratos-page.component.css',
})
export class EmpresaContratosPageComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  authStore = inject(AuthStore);

  contratos = signal<ContratoRow[]>([]);
  loading = signal(true);
  procesandoId = signal<number | null>(null);

  hasPropuestasPendientes = computed(() =>
    this.contratos().some(c => c.estado === 'PROPUESTA_ADMIN')
  );

  countPropuestasPendientes = computed(() =>
    this.contratos().filter(c => c.estado === 'PROPUESTA_ADMIN').length
  );

  labelEstado(estado: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Borrador',
      PROPUESTA_ADMIN: 'Propuesta recibida',
      PENDIENTE_PAGO: 'Pago en proceso',
      ACTIVE: 'Activa',
      RECHAZADO: 'Rechazada',
      EXPIRED: 'Expirada',
      CANCELLED: 'Cancelada',
    };
    return map[estado] || estado;
  }

  ngOnInit(): void {
    if (!this.authStore.isEmpresa()) {
      this.loading.set(false);
      return;
    }
    this.route.queryParams.subscribe((q) => {
      if (q['pago'] === 'ok') {
        this.toast.success('¡Pago recibido! Tu campaña se activará en breve tras la confirmación de Stripe.');
      }
      if (q['pago'] === 'cancel') {
        this.toast.info('Pago cancelado. Puedes intentarlo de nuevo cuando quieras.');
      }
    });
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.http.get<ContratoRow[]>(`${environment.apiUrl}/api/empresas/contratos/mios`).subscribe({
      next: (list) => {
        this.contratos.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('No se pudieron cargar los contratos.');
      },
    });
  }

  aceptar(c: ContratoRow): void {
    if (c.estado !== 'PROPUESTA_ADMIN') return;
    this.procesandoId.set(c.id);
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http
      .post<{ checkoutUrl: string }>(
        `${environment.apiUrl}/api/empresas/contratos/${c.id}/aceptar`,
        {},
        { headers },
      )
      .subscribe({
        next: (res) => {
          this.procesandoId.set(null);
          if (res.checkoutUrl) {
            window.location.href = res.checkoutUrl;
          }
        },
        error: (err) => {
          this.procesandoId.set(null);
          this.toast.error(err.error?.error || 'No se pudo iniciar el pago. Inténtalo de nuevo.');
        },
      });
  }

  rechazar(c: ContratoRow): void {
    if (c.estado !== 'PROPUESTA_ADMIN') return;
    if (!confirm('¿Seguro que quieres rechazar esta propuesta de publicidad?')) return;
    this.procesandoId.set(c.id);
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http
      .post(`${environment.apiUrl}/api/empresas/contratos/${c.id}/rechazar`, {}, { headers })
      .subscribe({
        next: () => {
          this.procesandoId.set(null);
          this.toast.success('Propuesta rechazada correctamente.');
          this.cargar();
        },
        error: (err) => {
          this.procesandoId.set(null);
          this.toast.error(err.error?.error || 'Error al rechazar la propuesta.');
        },
      });
  }
}
