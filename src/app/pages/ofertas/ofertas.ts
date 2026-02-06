import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { OfertaService } from '../../services/oferta-service';
import { Oferta, FiltroOferta, BadgeOferta } from '../../models/oferta';

@Component({
  selector: 'app-ofertas',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './ofertas.html',
  styleUrls: ['./ofertas.css']
})
export class OfertasComponent implements OnInit {
  ofertas: Oferta[] = [];
  isLoading = true;
  
  // Filtros
  filtro: FiltroOferta = {
    soloActivas: true,
    ordenarPor: 'spark',
    direccion: 'desc',
    pagina: 0,
    tamañoPagina: 20
  };
  
  categorias = ['Tecnología', 'Moda', 'Hogar', 'Deportes', 'Alimentación'];
  ordenamiento = [
    { value: 'spark', label: '⚡ Más Spark' },
    { value: 'precio', label: '💰 Precio' },
    { value: 'fecha', label: '📅 Más recientes' },
    { value: 'vistas', label: '👁️ Más vistos' }
  ];

  constructor(private ofertaService: OfertaService) {}

  ngOnInit() {
    this.cargarOfertas();
  }

  cargarOfertas() {
    this.isLoading = true;
    this.ofertaService.filtrar(this.filtro).subscribe({
      next: (response) => {
        this.ofertas = response.ofertas;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading = false;
      }
    });
  }

  aplicarFiltros() {
    this.filtro.pagina = 0;
    this.cargarOfertas();
  }

  cambiarOrden(orden: string) {
    this.filtro.ordenarPor = orden as any;
    this.cargarOfertas();
  }

  limpiarFiltros() {
    this.filtro = {
      soloActivas: true,
      ordenarPor: 'spark',
      direccion: 'desc',
      pagina: 0,
      tamañoPagina: 20
    };
    this.cargarOfertas();
  }
}