import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';
import { ProductoCardComponent } from '../../../shared/components/marketplace/product-card/producto-card.component';

export interface ProductoSimple {
  id: number;
  titulo: string;
  precio: number;
  imagenPrincipal?: string;
  condicion?: string;
  localidad?: string;
  provincia?: string;
  envioDisponible?: boolean;
  favoritos?: number;
  vendedor?: { nombre: string; verificado?: boolean };
  fechaPublicacion?: string;
}

@Component({
  selector: 'app-productos-recientes',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductoCardComponent],
  templateUrl: './productos-recientes.component.html',
  styleUrls: ['./productos-recientes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductosRecientesComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  productos = signal<ProductoSimple[]>([]);
  loading = signal(true);
  error = signal(false);

  readonly skeletons = Array(12).fill(0);

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/producto`).subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.content ?? res?.productos ?? res?.data ?? []);
        this.productos.set(list.slice(0, 12));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  goToAll() {
    this.router.navigate(['/search'], { queryParams: { tipo: 'PRODUCTO' } });
  }
}
