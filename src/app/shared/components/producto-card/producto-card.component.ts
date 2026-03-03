import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CurrencyEsPipe } from '../../pipes/currency-es.pipe';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { Producto } from '../../../models/producto.model';

@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage, CurrencyEsPipe, TimeAgoPipe],
  templateUrl: './producto-card.component.html',
  styleUrls: ['./producto-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoCardComponent {
  @Input() producto!: Producto;
  @Input() isSkeleton = false;

  get coverImage(): string {
    if (this.producto?.imagenPrincipal) {
      return this.producto.imagenPrincipal;
    }
    if (this.producto?.galeriaImagenes?.length) {
      return this.producto.galeriaImagenes[0];
    }
    return '/assets/placeholder-image.webp';
  }

  get formatCondicion(): string {
    if (!this.producto?.condicion) return '';
    return this.producto.condicion.replace(/_/g, ' ');
  }
}
