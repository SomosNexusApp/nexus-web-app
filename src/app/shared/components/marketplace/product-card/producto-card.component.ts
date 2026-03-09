import { Component, Input, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CurrencyEsPipe } from '../../../pipes/currency-es.pipe';
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';
import { SkeletonCardComponent } from '../../skeleton-card/skeleton-card.component';
import { CoverImagePipe } from '../../../pipes/cover-image.pipe';
import { MarketplaceItem } from '../../../../models/marketplace-item.model';

@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CurrencyEsPipe,
    TimeAgoPipe,
    SkeletonCardComponent,
    CoverImagePipe,
  ],
  templateUrl: './producto-card.component.html',
  styleUrls: ['./producto-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoCardComponent {
  @Input() producto!: MarketplaceItem;
  @Input() isSkeleton = false;
  @Input() showFavorito = true;

  private router = inject(Router);

  esFavorito = signal(false);
  animandoCorazon = signal(false);

  // Simula estado auth
  get isLoggedIn(): boolean {
    return false;
  }

  get formatCondicion(): string {
    const c = this.producto?.condicion;
    if (!c) return '';
    const map: Record<string, string> = {
      NUEVO: 'Nuevo',
      COMO_NUEVO: 'Como nuevo',
      MUY_BUEN_ESTADO: 'Muy buen estado',
      BUEN_ESTADO: 'Buen estado',
      ACEPTABLE: 'Aceptable',
    };
    return map[c] ?? c.replace(/_/g, ' ');
  }

  get condicionClass(): string {
    const c = this.producto?.condicion;
    const map: Record<string, string> = {
      NUEVO: 'cond-nuevo',
      COMO_NUEVO: 'cond-como-nuevo',
      MUY_BUEN_ESTADO: 'cond-muy-buen',
      BUEN_ESTADO: 'cond-buen',
      ACEPTABLE: 'cond-aceptable',
    };
    return c ? (map[c] ?? '') : '';
  }

  get isVendido(): boolean {
    return this.producto?.estado === 'VENDIDO';
  }

  get isReservado(): boolean {
    return this.producto?.estado === 'RESERVADO';
  }

  navigateToDetail(event: MouseEvent): void {
    this.router.navigate(['/productos', this.producto.id]);
  }

  toggleFavorito(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    if (!this.isLoggedIn) {
      console.log('Guest: mostrar popup favoritos');
      return;
    }

    this.animandoCorazon.set(true);
    this.esFavorito.update((v) => !v);
    setTimeout(() => this.animandoCorazon.set(false), 400);
  }
}
