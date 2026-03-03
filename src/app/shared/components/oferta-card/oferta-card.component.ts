import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CurrencyEsPipe } from '../../pipes/currency-es.pipe';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { DiscountPercentPipe } from '../../pipes/discount-percent.pipe';
import { Oferta } from '../../../models/oferta.model';

@Component({
  selector: 'app-oferta-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgOptimizedImage,
    CurrencyEsPipe,
    TimeAgoPipe,
    DiscountPercentPipe,
  ],
  templateUrl: './oferta-card.component.html',
  styleUrls: ['./oferta-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfertaCardComponent {
  @Input() oferta!: Oferta;
  @Input() isSkeleton = false;

  get coverImage(): string {
    if (this.oferta?.imagenPrincipal) {
      return this.oferta.imagenPrincipal;
    }
    if (this.oferta?.galeriaImagenes?.length) {
      return this.oferta.galeriaImagenes[0];
    }
    return '/assets/placeholder-image.webp';
  }
}
