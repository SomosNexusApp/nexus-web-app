import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NexusService } from '../../services/nexus-service';
import { NexusItem, isOferta, isProducto } from '../../models/nexus-item';
import { Producto } from '../../models/producto';
import { Oferta } from '../../models/oferta';
import { UtilsService } from '../../services/utils-service';
import { ImageService } from '../../services/image-service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css']
})
export class ProductDetailComponent implements OnInit {
  item: NexusItem | null = null;
  loading = true;
  type: 'producto' | 'oferta' = 'producto';
  
  // Galería de imágenes
  selectedImageIndex = 0;
  allImages: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private nexusService: NexusService,
    private utils: UtilsService,
    private imageService: ImageService
  ) {}

  ngOnInit() {
    // Detectar tipo de ruta (producto u oferta)
    const path = this.route.snapshot.url[0].path;
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    this.type = path === 'oferta' ? 'oferta' : 'producto';

    if (this.type === 'oferta') {
      this.loadOferta(id);
    } else {
      this.loadProducto(id);
    }
  }

  /**
   * Carga un producto por ID
   */
  loadProducto(id: number) {
    this.loading = true;
    this.nexusService.getProductoById(id).subscribe({
      next: (data) => {
        this.item = data;
        this.setupGallery();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando producto:', err);
        this.loading = false;
      }
    });
  }

  /**
   * Carga una oferta por ID
   */
  loadOferta(id: number) {
    this.loading = true;
    this.nexusService.getOfertaById(id).subscribe({
      next: (data) => {
        this.item = data;
        this.setupGallery();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando oferta:', err);
        this.loading = false;
      }
    });
  }

  /**
   * Configura la galería de imágenes
   */
  setupGallery() {
    if (!this.item) return;

    this.allImages = [];
    
    // Agregar imagen principal
    if (this.item.imagenPrincipal) {
      this.allImages.push(this.item.imagenPrincipal);
    }
    
    // Agregar galería si existe
    if (this.item.galeriaImagenes && this.item.galeriaImagenes.length > 0) {
      this.allImages.push(...this.item.galeriaImagenes);
    }
    
    // Si no hay imágenes, usar placeholder
    if (this.allImages.length === 0) {
      this.allImages.push(
        this.imageService.getImageOrPlaceholder(null, this.type)
      );
    }
  }

  /**
   * Cambia la imagen seleccionada
   */
  selectImage(index: number) {
    if (index >= 0 && index < this.allImages.length) {
      this.selectedImageIndex = index;
    }
  }

  /**
   * Imagen siguiente
   */
  nextImage() {
    this.selectedImageIndex = (this.selectedImageIndex + 1) % this.allImages.length;
  }

  /**
   * Imagen anterior
   */
  previousImage() {
    this.selectedImageIndex = 
      (this.selectedImageIndex - 1 + this.allImages.length) % this.allImages.length;
  }

  // ===== GETTERS =====

  get asProducto(): Producto {
    return this.item as Producto;
  }

  get asOferta(): Oferta {
    return this.item as Oferta;
  }

  get currentImage(): string {
    return this.allImages[this.selectedImageIndex] || '';
  }

  get hasMultipleImages(): boolean {
    return this.allImages.length > 1;
  }

  /**
   * Obtiene el precio actual
   */
  getCurrentPrice(): string {
    if (!this.item) return '0';
    const price = this.type === 'oferta' 
      ? this.asOferta.precioOferta 
      : this.asProducto.precio;
    return this.utils.formatPrice(price);
  }

  /**
   * Obtiene el precio original (si es oferta con descuento)
   */
  getOriginalPrice(): string | null {
    if (this.type === 'oferta' && this.asOferta.precioOriginal > this.asOferta.precioOferta) {
      return this.utils.formatPrice(this.asOferta.precioOriginal);
    }
    return null;
  }

  /**
   * Calcula el ahorro
   */
  getSavings(): string | null {
    if (this.type === 'oferta' && this.asOferta.precioOriginal > this.asOferta.precioOferta) {
      const savings = this.asOferta.precioOriginal - this.asOferta.precioOferta;
      return this.utils.formatPrice(savings);
    }
    return null;
  }

  /**
   * Obtiene el porcentaje de descuento
   */
  getDiscountPercentage(): number {
    if (this.type === 'oferta') {
      return this.utils.calculateDiscount(
        this.asOferta.precioOriginal,
        this.asOferta.precioOferta
      );
    }
    return 0;
  }

  /**
   * Obtiene el nombre del vendedor/tienda
   */
  getSellerName(): string {
    if (this.type === 'oferta') {
      return this.asOferta.tienda || 'Tienda';
    }
    return this.asProducto.publicador?.user || 'Usuario Nexus';
  }

  /**
   * Obtiene la inicial del vendedor (para avatar)
   */
  getSellerInitial(): string {
    const name = this.getSellerName();
    return this.utils.getInitials(name);
  }

  /**
   * Obtiene el avatar del vendedor
   */
  getSellerAvatar(): string | null {
    if (this.type === 'producto' && this.asProducto.publicador?.avatar) {
      return this.asProducto.publicador.avatar;
    }
    return null;
  }

  /**
   * Obtiene días restantes (para ofertas)
   */
  getDaysRemaining(): number {
    if (this.type === 'oferta') {
      return this.utils.daysUntil(this.asOferta.fechaExpiracion);
    }
    return 0;
  }

  /**
   * Verifica si está próxima a expirar
   */
  isExpiringSoon(): boolean {
    const days = this.getDaysRemaining();
    return this.type === 'oferta' && days <= 1 && days >= 0;
  }

  /**
   * Verifica si ha expirado
   */
  isExpired(): boolean {
    return this.type === 'oferta' && this.utils.isExpired(this.asOferta.fechaExpiracion);
  }

  /**
   * Obtiene el estado del producto
   */
  getEstado(): string {
    if (this.type === 'producto') {
      return this.asProducto.estadoProducto;
    }
    return this.isExpired() ? 'EXPIRADA' : 'ACTIVA';
  }

  /**
   * Verifica si está disponible
   */
  isDisponible(): boolean {
    if (this.type === 'oferta') {
      return !this.isExpired();
    }
    return this.asProducto.estadoProducto === 'DISPONIBLE';
  }

  /**
   * Comparte el producto/oferta
   */
  async shareItem() {
    if (!this.item) return;

    const url = window.location.href;
    const title = this.item.titulo;
    const text = `Mira esta ${this.type} en Nexus: ${title}`;

    const shared = await this.utils.share({ title, text, url });
    
    if (!shared) {
      // Fallback: copiar al portapapeles
      await this.utils.copyToClipboard(url);
      alert('Enlace copiado al portapapeles');
    }
  }

  /**
   * Copia el enlace al portapapeles
   */
  async copyLink() {
    const url = window.location.href;
    const success = await this.utils.copyToClipboard(url);
    
    if (success) {
      alert('Enlace copiado al portapapeles');
    }
  }
}