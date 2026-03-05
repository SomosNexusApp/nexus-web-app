import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CurrencyEsPipe } from '../../pipes/currency-es.pipe';
import { SkeletonCardComponent } from '../skeleton-card/skeleton-card.component';
import { Vehiculo } from '../../../models/vehiculo.model';

@Component({
  selector: 'app-vehiculo-card',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage, CurrencyEsPipe, SkeletonCardComponent],
  templateUrl: './vehiculo-card.component.html',
  styleUrls: ['./vehiculo-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiculoCardComponent {
  @Input() vehiculo!: Vehiculo;
  @Input() isSkeleton = false;

  private router = inject(Router);

  get coverImage(): string {
    if (this.vehiculo?.imagenPrincipal) return this.vehiculo.imagenPrincipal;
    if (this.vehiculo?.galeriaImagenes?.length) return this.vehiculo.galeriaImagenes[0];
    return '/assets/placeholder-vehicle.webp';
  }

  get tipoEmoji(): string {
    const map: Record<string, string> = {
      COCHE: '🚗',
      MOTO: '🏍️',
      FURGONETA: '🚐',
      SCOOTER: '🛵',
      OTRO: '🚘',
    };
    return this.vehiculo?.tipoVehiculo ? (map[this.vehiculo.tipoVehiculo] ?? '🚘') : '🚘';
  }

  get tipoLabel(): string {
    const map: Record<string, string> = {
      COCHE: 'Coche',
      MOTO: 'Moto',
      FURGONETA: 'Furgoneta',
      SCOOTER: 'Scooter',
      OTRO: 'Vehículo',
    };
    return this.vehiculo?.tipoVehiculo
      ? (map[this.vehiculo.tipoVehiculo] ?? 'Vehículo')
      : 'Vehículo';
  }

  get kmFormateados(): string {
    if (!this.vehiculo?.kilometros) return '—';
    return new Intl.NumberFormat('es-ES').format(this.vehiculo.kilometros) + ' km';
  }

  navigateToDetail(): void {
    this.router.navigate(['/vehiculos', this.vehiculo.id]);
  }
}
