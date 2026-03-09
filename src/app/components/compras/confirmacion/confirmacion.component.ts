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
import { CompraService } from '../../../core/services/compra.service';
import { Compra } from '../../../models/compra.model';

@Component({
  selector: 'app-confirmacion',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './confirmacion.component.html',
  styleUrls: ['./confirmacion.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmacionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private compraSrv = inject(CompraService);
  private cdr = inject(ChangeDetectorRef);

  compra = signal<Compra | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  pagoOk = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const query = this.route.snapshot.queryParamMap.get('pago');
    this.pagoOk.set(query === 'ok');

    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    this.compraSrv.getCompra(+id).subscribe({
      next: (c) => {
        this.compra.set(c);
        this.cargando.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.error.set('No se pudo cargar la información de tu compra.');
        this.cargando.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  formatPrice(val: number): string {
    return (
      val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
    );
  }

  getLabelEnvio(tipo?: string): string {
    if (tipo === 'DOMICILIO') return 'Envío a domicilio';
    if (tipo === 'PUNTO_RECOGIDA') return 'Punto de recogida';
    if (tipo === 'RECOGIDA_PERSONAL') return 'Recogida en persona';
    return tipo ?? '—';
  }
}
