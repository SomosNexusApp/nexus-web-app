import {
  Component,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CompraService } from '../../../core/services/compra.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Compra } from '../../../models/compra.model';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { CurrencyEsPipe } from '../../../shared/pipes/currency-es.pipe';
import { CoverImagePipe } from '../../../shared/pipes/cover-image.pipe';
import { ValoracionModalComponent } from '../../../shared/components/valoracion-modal/valoracion-modal.component';

@Component({
  selector: 'app-mis-compras',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeAgoPipe, CurrencyEsPipe, CoverImagePipe, ValoracionModalComponent],
  templateUrl: './mis-compras.component.html',
  styleUrl: './mis-compras.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisComprasComponent implements OnInit {
  private compraSrv = inject(CompraService);
  private authSrv = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  @ViewChild(ValoracionModalComponent) valoracionModal!: ValoracionModalComponent;

  activeTab = signal<'COMPRAS' | 'VENTAS'>('COMPRAS');
  compras = signal<Compra[]>([]);
  ventas = signal<Compra[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.cargarDatos();
  }

  setTab(tab: 'COMPRAS' | 'VENTAS') {
    this.activeTab.set(tab);
  }

  cargarDatos() {
    this.loading.set(true);
    this.compraSrv.getMisCompras().subscribe({
      next: (data) => {
        this.compras.set(data);
        if (this.activeTab() === 'COMPRAS') this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        if (this.activeTab() === 'COMPRAS') this.loading.set(false);
        this.cdr.markForCheck();
      },
    });

    this.compraSrv.getMisVentas().subscribe({
      next: (data) => {
        this.ventas.set(data);
        if (this.activeTab() === 'VENTAS') this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        if (this.activeTab() === 'VENTAS') this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  confirmarRecepcion(item: Compra) {
    this.compraSrv.getEnvioPorCompra(item.id).subscribe({
      next: (envio) => {
        if (envio && envio.id) {
          // Abrimos el modal para que el usuario valore mientras confirma
          this.valoracionModal.abrir(item.producto?.vendedor?.user || 'Vendedor', item.id);
          
          // Sobrescribimos el comportamiento de enviar del modal para que primero llame a confirmar
          const originalEnviar = this.valoracionModal.enviarValoracion.bind(this.valoracionModal);
          this.valoracionModal.enviarValoracion = () => {
            if (this.valoracionModal.estrellas() === 0) return;
            
            this.valoracionModal.enviando.set(true);
            this.compraSrv.confirmarEntrega(
              envio.id, 
              this.valoracionModal.estrellas(), 
              this.valoracionModal.comentario()
            ).subscribe({
              next: () => {
                this.valoracionModal.enviando.set(false);
                this.valoracionModal.completado.set(true);
                this.cargarDatos();
              },
              error: (err) => {
                this.valoracionModal.enviando.set(false);
                this.valoracionModal.error.set(err.error?.error || 'Error al confirmar la recepción.');
              }
            });
          };
        }
      }
    });
  }

  abrirValoracion(item: Compra) {
    this.valoracionModal.abrir(item.producto?.vendedor?.user || 'Vendedor', item.id);
  }

  getBadgeColor(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return '#9ca3af';
      case 'PAGADO': return '#3b82f6';
      case 'ENVIADO': return '#06b6d4';
      case 'EN_TRANSITO': return '#1d4ed8';
      case 'ENTREGADO': return '#eab308';
      case 'COMPLETADA': return '#22c55e';
      case 'CANCELADA': return '#ef4444';
      case 'REEMBOLSADA': return '#a855f7';
      case 'EN_DISPUTA': return '#f97316';
      default: return '#6b7280';
    }
  }
}
