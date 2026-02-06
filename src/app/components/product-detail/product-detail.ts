import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OfertaService } from '../../services/oferta-service';
import { ProductoService } from '../../services/producto-service';
import { AuthService } from '../../services/auth-service';
import { Producto } from '../../models/producto';
import { Oferta } from '../../models/oferta';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css']
})
export class ProductDetailComponent implements OnInit {
  tipo: 'oferta' | 'producto' = 'producto';
  oferta?: Oferta;
  producto?: Producto;
  imagenActual: string = '';
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ofertaService: OfertaService,
    private productoService: ProductoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const url = this.router.url;
    
    if (url.includes('/oferta/')) {
      this.tipo = 'oferta';
      this.cargarOferta();
    } else if (url.includes('/producto/')) {
      this.tipo = 'producto';
      this.cargarProducto();
    }
  }

  cargarOferta(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    this.ofertaService.getById(id).subscribe({
      next: (oferta) => {
        this.oferta = oferta;
        this.imagenActual = oferta.imagenPrincipal;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar oferta:', err);
        this.router.navigate(['/']);
      }
    });
  }

  cargarProducto(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    this.productoService.getById(id).subscribe({
      next: (producto) => {
        this.producto = producto;
        this.imagenActual = producto.imagenPrincipal;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar producto:', err);
        this.router.navigate(['/']);
      }
    });
  }

  cambiarImagen(url: string): void {
    this.imagenActual = url;
  }

  darSpark(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.tipo === 'oferta' && this.oferta) {
      const usuarioId = this.authService.getUserId();
      this.ofertaService.votar(this.oferta.id, usuarioId, true).subscribe({
        next: (res) => {
          this.oferta!.sparkCount = res.sparkScore + (this.oferta!.dripCount || 0);
          console.log('⚡ Spark dado');
        },
        error: (err) => console.error('Error al votar:', err)
      });
    }
  }

  irAOferta(): void {
    if (this.tipo === 'oferta' && this.oferta) {
      window.open(this.oferta.urlOferta, '_blank');
    }
  }

  contactarVendedor(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    // Implementar chat o contacto
    console.log('Abrir chat con vendedor');
  }
}