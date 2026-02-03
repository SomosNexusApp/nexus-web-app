import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NexusItem } from '../../models/nexus-item';
import { Producto } from '../../models/producto';
import { Oferta } from '../../models/oferta';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css']
})
export class ProductCardComponent {
  @Input() product!: NexusItem;

  isOferta(item: NexusItem): boolean {
    return (item as Oferta).precioOferta !== undefined;
  }

  getImageUrl(item: NexusItem): string {
    if (this.isOferta(item)) {
      return (item as Oferta).urlOferta || 'assets/placeholder-offer.jpg';
    }
    // Como Producto no tiene imagen en BD, usamos una aleatoria de tecnología
    return `https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=500&q=60&random=${item.id}`;
  }

  getPrice(item: NexusItem): number {
    return this.isOferta(item) ? (item as Oferta).precioOferta : (item as Producto).precio;
  }

  getOriginalPrice(item: NexusItem): number | null {
    if (this.isOferta(item)) {
      const oferta = item as Oferta;
      return oferta.precioOriginal > oferta.precioOferta ? oferta.precioOriginal : null;
    }
    return null;
  }

  getDiscount(item: NexusItem): number {
    if (this.isOferta(item)) {
      const off = item as Oferta;
      if (off.precioOriginal > 0 && off.precioOferta < off.precioOriginal) {
        return Math.round(((off.precioOriginal - off.precioOferta) / off.precioOriginal) * 100);
      }
    }
    return 0;
  }

  getSellerName(item: NexusItem): string {
    if (this.isOferta(item)) {
      return (item as Oferta).tienda || 'Tienda';
    }
    const prod = item as Producto;
    // En tu backend el campo es 'user', no 'nombre'
    return prod.publicador?.user || 'Usuario Nexus';
  }
  
  getSellerAvatar(item: NexusItem): string {
     if (!this.isOferta(item)) {
         const prod = item as Producto;
         return prod.publicador?.fotoPerfil || '';
     }
     return '';
  }
}