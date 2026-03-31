import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';
import { CompraService } from '../../../core/services/compra.service';
import { Envio } from '../../../models/envio.model';

@Component({
  selector: 'app-enviar-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './enviar-pedido.component.html',
  styleUrls: ['./enviar-pedido.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnviarPedidoComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private compraSrv = inject(CompraService);
  private cdr = inject(ChangeDetectorRef);

  envio = signal<Envio | null>(null);
  puntosRecogida = signal<{ nombre: string; direccion: string; ciudad: string; horario: string; transportista: string }[]>(
    [],
  );
  pasosExpandido = signal(true);
  cargando = signal(true);
  error = signal<string | null>(null);
  copiado = signal(false);
  refrescandoTracking = signal(false);
  registrandoEntrega = signal(false);
  trackingInput = signal('');
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const compraId = this.route.snapshot.paramMap.get('compraId');
    if (!compraId) {
      this.router.navigate(['/']);
      return;
    }
    this.cargarEnvio(+compraId);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }

  private cargarEnvio(compraId: number): void {
    this.compraSrv.getEnvioPorCompra(compraId).subscribe({
      next: (e: Envio) => {
        this.envio.set(e);
        this.cargarPuntosYContexto(compraId);
        this.iniciarTrackingPoll();
        this.cargando.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.error.set('No se encontró el envío para esta compra.');
        this.cargando.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  private iniciarTrackingPoll(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
    this.pollTimer = setInterval(() => {
      const current = this.envio();
      if (!current?.id) return;
      if (current.estado === 'ENTREGADO' || current.estado === 'CANCELADO') {
        if (this.pollTimer) clearInterval(this.pollTimer);
        return;
      }
      this.compraSrv.refreshTracking(current.id).subscribe({
        next: (updated: Envio) => {
          if (updated?.estado) {
            this.envio.set(updated);
            this.cdr.markForCheck();
          }
        },
      });
    }, 20000);
  }

  private cargarPuntosYContexto(compraId: number): void {
    this.compraSrv.getCompra(compraId).subscribe({
      next: (c: any) => {
        const ubi = c?.producto?.ubicacion ?? '';
        const q = encodeURIComponent(ubi.split(',')[0]?.trim() || 'Madrid');
        this.http.get<{ puntos: any[] }>(`${environment.apiUrl}/envio/puntos-recogida?ciudad=${q}`).subscribe({
          next: (r) => this.puntosRecogida.set(r.puntos ?? []),
          error: () => this.puntosRecogida.set([]),
        });
        this.cdr.markForCheck();
      },
      error: () => {
        this.http
          .get<{ puntos: any[] }>(`${environment.apiUrl}/envio/puntos-recogida?ciudad=Madrid`)
          .subscribe((r) => this.puntosRecogida.set(r.puntos ?? []));
      },
    });
  }

  refrescarTrackingManual(): void {
    const e = this.envio();
    if (!e?.id) return;
    this.refrescandoTracking.set(true);
    this.compraSrv.refreshTracking(e.id).subscribe({
      next: (updated: Envio) => {
        if (updated?.estado) {
          this.envio.set(updated);
        }
        this.refrescandoTracking.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.refrescandoTracking.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  registrarEntregaEnCorreos(): void {
    const e = this.envio();
    const tracking = this.trackingInput().trim();
    if (!e?.id || !tracking) {
      this.error.set('Debes introducir el tracking real que te dio Correos.');
      return;
    }

    this.registrandoEntrega.set(true);
    const body = {
      transportista: e.transportistaEnum ?? e.transportista ?? 'CORREOS',
      numeroSeguimiento: tracking,
      diasEntregaEstimados: 3,
    };
    this.http.post<Envio>(`${environment.apiUrl}/envio/${e.id}/enviar`, body).subscribe({
      next: (updated) => {
        this.envio.set(updated);
        this.registrandoEntrega.set(false);
        this.error.set(null);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'No se pudo registrar el tracking.');
        this.registrandoEntrega.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  copiarCodigo(): void {
    const code = this.envio()?.codigoEnvio;
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        this.copiado.set(true);
        setTimeout(() => {
          this.copiado.set(false);
          this.cdr.markForCheck();
        }, 2000);
        this.cdr.markForCheck();
      });
    }
  }

  getNombreTransportista(t?: string): string {
    switch (t) {
      case 'CORREOS':
        return 'Correos';
      case 'SEUR':
        return 'SEUR';
      case 'MRW':
        return 'MRW';
      default:
        return t ?? 'Transportista';
    }
  }

  getPesoLabel(kg?: number): string {
    if (!kg) return '—';
    if (kg <= 0.5) return 'Menos de 0,5 kg';
    if (kg <= 2) return 'Entre 0,5 y 2 kg';
    if (kg <= 5) return 'Entre 2 y 5 kg';
    return 'Entre 5 y 10 kg';
  }

  getQrSrc(base64?: string): string {
    return base64 ? `data:image/png;base64,${base64}` : '';
  }

  getPuntoMapsUrl(p: { nombre?: string; direccion?: string; ciudad?: string }): string {
    const q = [p.nombre, p.direccion, p.ciudad].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }

  getTransportistaWebUrl(transportista?: string): string {
    const t = (transportista || '').toUpperCase();
    if (t.includes('SEUR')) return 'https://www.seur.com';
    if (t.includes('MRW')) return 'https://www.mrw.es';
    return 'https://www.correos.es';
  }

  getPasoActual(estado?: string): number {
    switch (estado) {
      case 'ENVIADO':
        return 3;
      case 'EN_TRANSITO':
        return 4;
      case 'EN_REPARTO':
        return 5;
      case 'ENTREGADO':
        return 6;
      default:
        return 2;
    }
  }

  volver(): void {
    this.router.navigate(['/']);
  }
}
