import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { ProductoService } from '../../services/producto-service';
import { Producto, EstadoProducto, TipoOferta } from '../../models/producto';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css']
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  isLoading = true;
  
  // Filtros
  filtros = {
    busqueda: '',
    precioMin: undefined as number | undefined,
    precioMax: undefined as number | undefined,
    tipoOferta: undefined as TipoOferta | undefined,
    categoria: undefined as string | undefined
  };
  
  categorias = ['Electrónica', 'Moda', 'Hogar', 'Deportes', 'Juguetes', 'Libros', 'Música', 'Otros'];
  tiposOferta = [
    { value: TipoOferta.VENTA, label: 'Venta' },
    { value: TipoOferta.INTERCAMBIO, label: 'Intercambio' },
    { value: TipoOferta.SUBASTA, label: 'Subasta' }
  ];

  constructor(private productoService: ProductoService) {}

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.isLoading = true;
    this.productoService.getDisponibles().subscribe({
      next: (data) => {
        this.productos = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading = false;
      }
    });
  }

  get productosFiltrados(): Producto[] {
    return this.productos.filter(p => {
      // Búsqueda por texto
      if (this.filtros.busqueda) {
        const busqueda = this.filtros.busqueda.toLowerCase();
        const match = p.titulo.toLowerCase().includes(busqueda) || 
                     p.descripcion.toLowerCase().includes(busqueda);
        if (!match) return false;
      }
      
      // Precio
      if (this.filtros.precioMin !== undefined && p.precio < this.filtros.precioMin) return false;
      if (this.filtros.precioMax !== undefined && p.precio > this.filtros.precioMax) return false;
      
      // Tipo de oferta
      if (this.filtros.tipoOferta && p.tipoOferta !== this.filtros.tipoOferta) return false;
      
      // Categoría
      if (this.filtros.categoria && p.categoria !== this.filtros.categoria) return false;
      
      return true;
    });
  }

  limpiarFiltros() {
    this.filtros = {
      busqueda: '',
      precioMin: undefined,
      precioMax: undefined,
      tipoOferta: undefined,
      categoria: undefined
    };
  }
}