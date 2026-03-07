import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CurrencyEsPipe } from '../../pipes/currency-es.pipe';
import { SkeletonCardComponent } from '../skeleton-card/skeleton-card.component';
import { CoverImagePipe } from '../../pipes/cover-image.pipe';
import { MarketplaceItem } from '../../../models/marketplace-item.model';

@Component({
  selector: 'app-vehiculo-card',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyEsPipe, SkeletonCardComponent, CoverImagePipe],
  templateUrl: './vehiculo-card.component.html',
  styleUrls: ['./vehiculo-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiculoCardComponent {
  @Input() vehiculo!: MarketplaceItem;
  @Input() isSkeleton = false;

  private router = inject(Router);

  // Mapeo de iconos SVG para tipos de vehículo
  get tipoIconPath(): string {
    const map: Record<string, string> = {
      COCHE: 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12.4V16c0 .6.4 1 1 1h2',
      MOTO: 'M12 15h.01 M10 8.5a15 15 0 0 1 5 0 M17 10l1.5-2 M11 5l1.5-2 M4.5 10L3 8',
      FURGONETA: 'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2 M16 18h3a1 1 0 0 0 1-1v-3.34a4 4 0 0 0-1.17-2.83L15 7.17V18Z',
      SCOOTER: 'M10 15h.01 M15 15h.01 M11 11V7a1 1 0 0 1 1-1h3a2 2 0 0 1 2 2v3 M17 11h2l.5 2 M3 13v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2',
    };
    const tipo = (this.vehiculo as any).tipoVehiculo;
    return map[tipo] || map['COCHE'];
  }

  get tipoLabel(): string {
    const map: Record<string, string> = {
      COCHE: 'Coche',
      MOTO: 'Moto',
      FURGONETA: 'Furgoneta',
      SCOOTER: 'Scooter',
      OTRO: 'Vehículo',
    };
    const tipo = (this.vehiculo as any).tipoVehiculo;
    return tipo ? (map[tipo] ?? 'Vehículo') : 'Vehículo';
  }

  get kmFormateados(): string {
    const km = (this.vehiculo as any).kilometros;
    if (!km && km !== 0) return '—';
    return new Intl.NumberFormat('es-ES').format(km) + ' km';
  }

  navigateToDetail(): void {
    if (!this.vehiculo?.id) return;
    this.router.navigate(['/vehiculos', this.vehiculo.id]);
  }
}
