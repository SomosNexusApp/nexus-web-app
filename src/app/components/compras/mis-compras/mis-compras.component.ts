import {
  Component,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CompraService } from '../../../core/services/compra.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Compra } from '../../../models/compra.model';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { CurrencyEsPipe } from '../../../shared/pipes/currency-es.pipe';
import { CoverImagePipe } from '../../../shared/pipes/cover-image.pipe';

@Component({
  selector: 'app-mis-compras',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeAgoPipe, CurrencyEsPipe, CoverImagePipe],
  templateUrl: './mis-compras.component.html',
  styleUrl: './mis-compras.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisComprasComponent implements OnInit {
  private compraSrv = inject(CompraService);
  private authSrv = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

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

    // Cargar compras
    this.compraSrv.getMisCompras().subscribe({
      next: (data) => {
        this.compras.set(data);
        if (this.activeTab() === 'COMPRAS') {
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      },
      error: () => {
        if (this.activeTab() === 'COMPRAS') {
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      },
    });

    // Cargar ventas
    this.compraSrv.getMisVentas().subscribe({
      next: (data) => {
        this.ventas.set(data);
        if (this.activeTab() === 'VENTAS') {
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      },
      error: () => {
        if (this.activeTab() === 'VENTAS') {
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      },
    });
  }

  getBadgeColor(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return '#9ca3af'; // gris
      case 'PAGADO':
        return '#3b82f6'; // azul
      case 'ENVIADO':
        return '#06b6d4'; // cyan
      case 'EN_TRANSITO':
        return '#1d4ed8'; // azul oscuro
      case 'ENTREGADO':
        return '#eab308'; // amarillo
      case 'COMPLETADA':
        return '#22c55e'; // verde
      case 'CANCELADA':
        return '#ef4444'; // rojo
      case 'REEMBOLSADA':
        return '#a855f7'; // morado
      case 'EN_DISPUTA':
        return '#f97316'; // naranja
      default:
        return '#6b7280';
    }
  }
}
