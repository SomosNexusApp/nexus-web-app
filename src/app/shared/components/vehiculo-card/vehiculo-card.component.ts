import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CurrencyEsPipe } from '../../pipes/currency-es.pipe';
import { SkeletonCardComponent } from '../skeleton-card/skeleton-card.component';
import { CoverImagePipe } from '../../pipes/cover-image.pipe';
import { MarketplaceItem } from '../../../models/marketplace-item.model';

@Component({
  selector: 'app-vehiculo-card',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage, CurrencyEsPipe, SkeletonCardComponent, CoverImagePipe],
  templateUrl: './vehiculo-card.component.html',
  styleUrls: ['./vehiculo-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiculoCardComponent {
  @Input() vehiculo!: MarketplaceItem;
  @Input() isSkeleton = false;

  private router = inject(Router);

  get tipoEmoji(): string {
    const map: Record<string, string> = {
      COCHE: '🚗',
      MOTO: '🏍️',
      FURGONETA: '🚐',
      SCOOTER: '🛵',
      OTRO: '🚘',
    };
    const tipo = (this.vehiculo as any).tipoVehiculo;
    return tipo ? (map[tipo] ?? '🚘') : '🚘';
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
    if (!km) return '—';
    return new Intl.NumberFormat('es-ES').format(km) + ' km';
  }

  navigateToDetail(): void {
    this.router.navigate(['/search'], { queryParams: { q: this.vehiculo.titulo, tipo: 'VEHICULO' } });
  }
}
