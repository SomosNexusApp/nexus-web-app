import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NexusItem, isProducto, isOferta } from '../../models/nexus-item';
import { Producto } from '../../models/producto';
import { Oferta } from '../../models/oferta';
import { UtilsService } from '../../services/utils-service';
import { ImageService } from '../../services/image-service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css']
})
export class ProductCardComponent {
  @Input() product!: NexusItem;

  constructor(
    private utils: UtilsService,
    private imageService: ImageService
  ) {}

  /**
   * Verifica si el item es una oferta
   */
  isOferta(item: NexusItem): boolean {
    return isOferta(item);
  }

  /**
   * Obtiene la URL de la imagen principal
   */
  getImageUrl(item: NexusItem): string {
    if (!item.imagenPrincipal) {
      return this.imageService.getImageOrPlaceholder(
        null,
        this.isOferta(item) ? 'oferta' : 'producto'
      );
    }
    return item.imagenPrincipal;
  }

  /**
   * Obtiene el precio actual del item
   */
  getPrice(item: NexusItem): number {
    return this.isOferta(item) 
      ? (item as Oferta).precioOferta 
      : (item as Producto).precio;
  }

  /**
   * Obtiene el precio formateado
   */
  getFormattedPrice(item: NexusItem): string {
    return this.utils.formatPrice(this.getPrice(item));
  }

  /**
   * Obtiene el precio original (si existe)
   */
  getOriginalPrice(item: NexusItem): number | null {
    if (this.isOferta(item)) {
      const oferta = item as Oferta;
      return oferta.precioOriginal > oferta.precioOferta ? oferta.precioOriginal : null;
    }
    return null;
  }

  /**
   * Obtiene el precio original formateado
   */
  getFormattedOriginalPrice(item: NexusItem): string | null {
    const original = this.getOriginalPrice(item);
    return original ? this.utils.formatPrice(original) : null;
  }

  /**
   * Calcula el porcentaje de descuento
   */
  getDiscount(item: NexusItem): number {
    if (this.isOferta(item)) {
      const oferta = item as Oferta;
      return this.utils.calculateDiscount(oferta.precioOriginal, oferta.precioOferta);
    }
    return 0;
  }

  /**
   * Obtiene el nombre del vendedor/tienda
   */
  getSellerName(item: NexusItem): string {
    if (this.isOferta(item)) {
      return (item as Oferta).tienda || 'Tienda';
    }
    const prod = item as Producto;
    return prod.publicador?.user || 'Usuario Nexus';
  }

  /**
   * Obtiene el avatar del vendedor (solo para productos)
   */
  getSellerAvatar(item: NexusItem): string {
    if (!this.isOferta(item)) {
      const prod = item as Producto;
      return this.imageService.getImageOrPlaceholder(
        prod.publicador?.avatar,
        'avatar'
      );
    }
    return '';
  }

  /**
   * Obtiene la URL del detalle
   */
  getDetailUrl(item: NexusItem): string {
    return this.isOferta(item) 
      ? `/oferta/${item.id}` 
      : `/producto/${item.id}`;
  }

  /**
   * Verifica si la oferta está próxima a expirar (menos de 24 horas)
   */
  isExpiringSoon(item: NexusItem): boolean {
    if (!this.isOferta(item)) return false;
    
    const oferta = item as Oferta;
    const daysRemaining = this.utils.daysUntil(oferta.fechaExpiracion);
    return daysRemaining <= 1 && daysRemaining >= 0;
  }

  /**
   * Verifica si la oferta ha expirado
   */
  isExpired(item: NexusItem): boolean {
    if (!this.isOferta(item)) return false;
    
    const oferta = item as Oferta;
    return this.utils.isExpired(oferta.fechaExpiracion);
  }

  /**
   * Obtiene el estado del producto
   */
  getEstadoProducto(item: NexusItem): string {
    if (this.isOferta(item)) return '';
    return (item as Producto).estadoProducto;
  }

  /**
   * Verifica si el producto está disponible
   */
  isDisponible(item: NexusItem): boolean {
    if (this.isOferta(item)) {
      return !this.isExpired(item);
    }
    return (item as Producto).estadoProducto === 'DISPONIBLE';
  }

  /**
   * Obtiene el badge text según el tipo
   */
  getBadgeText(item: NexusItem): string {
    if (this.isOferta(item)) {
      return this.isExpiringSoon(item) ? '¡Última oportunidad!' : 'Oferta';
    }
    return 'Segunda Mano';
  }

  /**
   * Obtiene clase CSS para el badge
   */
  getBadgeClass(item: NexusItem): string {
    if (this.isOferta(item)) {
      return this.isExpiringSoon(item) ? 'badge-urgent' : 'badge-deal';
    }
    return 'badge-secondhand';
  }
}