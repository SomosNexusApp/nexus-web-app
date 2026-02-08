import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Servicios y Modelos
import { OfertaService } from '../../services/oferta-service';
import { Oferta } from '../../models/oferta';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../components/empty-state/empty-state';

@Component({
  selector: 'app-cupones',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './cupones.html',
  styleUrls: ['./cupones.css']
})
export class CuponesComponent implements OnInit {
  private ofertaService = inject(OfertaService);

  cupones: Oferta[] = [];
  loading: boolean = true;
  codigoCopiadoId: number | null = null;

  ngOnInit(): void {
    this.cargarCupones();
  }

  cargarCupones(): void {
    // Usamos las ofertas destacadas como "Cupones"
    this.ofertaService.getDestacadas().subscribe({
      next: (data) => {
        // Filtramos solo las que tengan precio original para poder calcular descuento
        this.cupones = data.filter(o => o.precioOriginal && o.precioOriginal > o.precioOferta);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando cupones', err);
        this.loading = false;
      }
    });
  }

  /**
   * Calcula el porcentaje de ahorro
   */
  calcularDescuento(original: number, oferta: number): number {
    if (!original || original <= 0) return 0;
    return Math.round(((original - oferta) / original) * 100);
  }

  /**
   * Simula copiar un código al portapapeles
   */
  copiarCodigo(oferta: Oferta): void {
    // Generamos un código falso basado en el título si no existe
    const codigo = `NEXUS-${oferta.id}-${oferta.tienda.substring(0, 3).toUpperCase()}25`;
    
    navigator.clipboard.writeText(codigo).then(() => {
      this.codigoCopiadoId = oferta.id;
      
      // Resetear estado después de 2 segundos
      setTimeout(() => {
        this.codigoCopiadoId = null;
      }, 2000);
    });
  }
  
  irAOferta(url: string): void {
    window.open(url, '_blank');
  }
}