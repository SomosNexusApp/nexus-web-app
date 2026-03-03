import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';
import { CurrencyEsPipe } from '../../../shared/pipes/currency-es.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

export interface ProductoSimple {
  id: number;
  titulo: string;
  precio: number;
  imagenPrincipal?: string;
  condicion?: 'NUEVO' | 'COMO_NUEVO' | 'MUY_BUEN_ESTADO' | 'BUEN_ESTADO' | 'ACEPTABLE';
  localidad?: string;
  provincia?: string;
  envioDisponible?: boolean;
  favoritos?: number;
  vendedor?: { nombre: string; verificado?: boolean };
  fechaPublicacion?: string;
  estadoProducto?: string;
}

const CONDICION_META: Record<string, { label: string; mod: string }> = {
  NUEVO: { label: 'Nuevo', mod: 'cond--new' },
  COMO_NUEVO: { label: 'Como nuevo', mod: 'cond--likenew' },
  MUY_BUEN_ESTADO: { label: 'Muy buen estado', mod: 'cond--good' },
  BUEN_ESTADO: { label: 'Buen estado', mod: 'cond--fair' },
  ACEPTABLE: { label: 'Aceptable', mod: 'cond--ok' },
};

@Component({
  selector: 'app-productos-recientes',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyEsPipe, TimeAgoPipe],
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
    // Usar /producto sin params de filtro — el endpoint base tiene permitAll
    // y devuelve lista ordenada por fechaPublicacion desc desde el servicio
    this.http.get<any>(`${environment.apiUrl}/producto`).subscribe({
      next: (res) => {
        const list: ProductoSimple[] = Array.isArray(res)
          ? res
          : (res?.content ?? res?.productos ?? res?.data ?? []);
        this.productos.set(list.slice(0, 12));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  condicionLabel(c?: string): string {
    return c ? (CONDICION_META[c]?.label ?? c) : '';
  }

  condicionMod(c?: string): string {
    return c ? (CONDICION_META[c]?.mod ?? '') : '';
  }

  goToProduct(id: number) {
    this.router.navigate(['/producto/filtrar', id]);
  }

  goToAll() {
    this.router.navigate(['/producto/filtrar']);
  }
}
