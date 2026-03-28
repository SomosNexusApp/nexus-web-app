import {
  Component,
  OnInit,
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
export class EnviarPedidoComponent implements OnInit {
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
  marcandoEnviado = signal(false);
  enviado = signal(false);
  copiado = signal(false);

  ngOnInit(): void {
    const compraId = this.route.snapshot.paramMap.get('compraId');
    if (!compraId) {
      this.router.navigate(['/']);
      return;
    }
    this.cargarEnvio(+compraId);
  }

  private cargarEnvio(compraId: number): void {
    this.compraSrv.getEnvioPorCompra(compraId).subscribe({
      next: (e: Envio) => {
        this.envio.set(e);
        this.cargarPuntosYContexto(compraId);
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

  marcarComoEnviado(): void {
    const e = this.envio();
    if (!e) return;
    this.marcandoEnviado.set(true);

    const body = {
      transportista: e.transportistaEnum ?? e.transportista ?? 'CORREOS',
      numeroSeguimiento: '',
      diasEntregaEstimados: 5,
    };

    this.http.post<Envio>(`${environment.apiUrl}/envio/${e.id}/enviar`, body).subscribe({
      next: (updated) => {
        this.envio.set(updated);
        this.enviado.set(true);
        this.marcandoEnviado.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'Error al marcar como enviado.');
        this.marcandoEnviado.set(false);
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

  volver(): void {
    this.router.navigate(['/']);
  }
}
