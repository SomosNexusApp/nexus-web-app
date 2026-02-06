import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Oferta } from '../../models/oferta';
import { Producto } from '../../models/producto';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css']
})
export class ProductCardComponent {
  @Input() tipo: 'oferta' | 'producto' = 'producto';
  @Input() oferta?: Oferta;
  @Input() producto?: Producto;

  constructor(private router: Router) {}

  get imagen(): string {
    if (this.tipo === 'oferta' && this.oferta) {
      return this.oferta.imagenPrincipal;
    } else if (this.tipo === 'producto' && this.producto) {
      return this.producto.imagenPrincipal;
    }
    return 'assets/placeholder.png';
  }

  get titulo(): string {
    if (this.tipo === 'oferta' && this.oferta) {
      return this.oferta.titulo;
    } else if (this.tipo === 'producto' && this.producto) {
      return this.producto.titulo;
    }
    return '';
  }

  get precio(): number {
    if (this.tipo === 'oferta' && this.oferta) {
      return this.oferta.precioOferta;
    } else if (this.tipo === 'producto' && this.producto) {
      return this.producto.precio;
    }
    return 0;
  }

  get precioOriginal(): number | undefined {
    if (this.tipo === 'oferta' && this.oferta) {
      return this.oferta.precioOriginal;
    }
    return undefined;
  }

  get descuento(): number | undefined {
    if (this.tipo === 'oferta' && this.oferta && this.oferta.precioOriginal) {
      return Math.round(((this.oferta.precioOriginal - this.oferta.precioOferta) / this.oferta.precioOriginal) * 100);
    }
    return undefined;
  }

  get sparkScore(): number | undefined {
    if (this.tipo === 'oferta' && this.oferta) {
      return (this.oferta.sparkCount || 0) - (this.oferta.dripCount || 0);
    }
    return undefined;
  }

  verDetalle(): void {
    if (this.tipo === 'oferta' && this.oferta) {
      this.router.navigate(['/oferta', this.oferta.id]);
    } else if (this.tipo === 'producto' && this.producto) {
      this.router.navigate(['/producto', this.producto.id]);
    }
  }
}