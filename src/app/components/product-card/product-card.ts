import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Oferta } from '../../models/oferta';
import { Producto } from '../../models/producto';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css']
})
export class ProductCardComponent {
  @Input() product!: Oferta | Producto;

  constructor(private router: Router) {}

  get esOferta(): boolean {
    return 'precioOferta' in this.product;
  }

  get imagen(): string {
    return this.product.imagenPrincipal || 'https://via.placeholder.com/300';
  }

  get titulo(): string {
    return this.product.titulo;
  }

  get precio(): number {
    return this.esOferta
      ? (this.product as Oferta).precioOferta
      : (this.product as Producto).precio;
  }

  get precioOriginal(): number | undefined {
    return this.esOferta ? (this.product as Oferta).precioOriginal : undefined;
  }

  get descuento(): number | undefined {
    if (!this.esOferta) return undefined;
    const oferta = this.product as Oferta;
    if (!oferta.precioOriginal) return undefined;
    return Math.round(((oferta.precioOriginal - oferta.precioOferta) / oferta.precioOriginal) * 100);
  }

  get sparkScore(): number | undefined {
    if (!this.esOferta) return undefined;
    const oferta = this.product as Oferta;
    return (oferta.sparkCount || 0) - (oferta.dripCount || 0);
  }

  get badge(): string | undefined {
    if (!this.esOferta) return undefined;
    const oferta = this.product as Oferta;
    return oferta.badge;
  }

  get tienda(): string | undefined {
    return this.esOferta ? (this.product as Oferta).tienda : undefined;
  }

  get vistas(): number | undefined {
    return this.esOferta ? (this.product as Oferta).numeroVistas : undefined;
  }

  verDetalle(): void {
    const ruta = this.esOferta ? '/oferta' : '/producto';
    this.router.navigate([ruta, this.product.id]);
  }
}