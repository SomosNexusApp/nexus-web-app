import { Component, Input, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CurrencyEsPipe } from '../../../pipes/currency-es.pipe';
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';
import { SkeletonCardComponent } from '../../skeleton-card/skeleton-card.component';
import { Producto } from '../../../../models/producto.model';

@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage, CurrencyEsPipe, TimeAgoPipe, SkeletonCardComponent],
  templateUrl: './producto-card.component.html',
  styleUrls: ['./producto-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoCardComponent {
  @Input() producto!: Producto;
  @Input() isSkeleton = false;
  @Input() showFavorito = true;

  private router = inject(Router);
  // private authService = inject(AuthService);
  // private favoritoService = inject(FavoritoService);
  // private guestPopupService = inject(GuestPopupService);

  esFavorito = signal(false);
  animandoCorazon = signal(false);

  // Simula estado auth — reemplazar con authService.isLoggedIn()
  get isLoggedIn(): boolean {
    return false; // this.authService.isLoggedIn()
  }

  get coverImage(): string {
    if (this.producto?.imagenPrincipal) return this.producto.imagenPrincipal;
    if (this.producto?.galeriaImagenes?.length) return this.producto.galeriaImagenes[0];
    return '/assets/placeholder-image.webp';
  }

  get formatCondicion(): string {
    if (!this.producto?.condicion) return '';
    const map: Record<string, string> = {
      NUEVO: 'Nuevo',
      COMO_NUEVO: 'Como nuevo',
      MUY_BUEN_ESTADO: 'Muy buen estado',
      BUEN_ESTADO: 'Buen estado',
      ACEPTABLE: 'Aceptable',
    };
    return map[this.producto.condicion] ?? this.producto.condicion.replace(/_/g, ' ');
  }

  get condicionClass(): string {
    const map: Record<string, string> = {
      NUEVO: 'cond-nuevo',
      COMO_NUEVO: 'cond-como-nuevo',
      MUY_BUEN_ESTADO: 'cond-muy-buen',
      BUEN_ESTADO: 'cond-buen',
      ACEPTABLE: 'cond-aceptable',
    };
    return this.producto?.condicion ? (map[this.producto.condicion] ?? '') : '';
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
      // this.guestPopupService.showPopup('Para guardar favoritos');
      console.log('Guest: mostrar popup favoritos');
      return;
    }

    this.animandoCorazon.set(true);
    this.esFavorito.update((v) => !v);

    setTimeout(() => this.animandoCorazon.set(false), 400);

    // this.favoritoService.toggleFavorito(this.producto.id).subscribe();
  }
}
