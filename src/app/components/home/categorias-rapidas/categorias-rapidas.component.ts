import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';
import { getCategoryColor, getCategoryIconPath } from '../../../shared/utils/category-icons';

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  icono?: string;
  color?: string;
  totalProductos?: number;
}

@Component({
  selector: 'app-categorias-rapidas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categorias-rapidas.component.html',
  styleUrls: ['./categorias-rapidas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriasRapidasComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  categorias = signal<Categoria[]>([]);
  loading = signal(true);
  error = signal(false);

  readonly skeletons = Array(10).fill(0);

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/categorias/raiz`).subscribe({
      next: (res) => {
        const data: Categoria[] = Array.isArray(res) ? res : (res?.content ?? res?.data ?? []);
        this.categorias.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  getIconPath(cat: Categoria): string {
    return getCategoryIconPath(cat.icono, cat.slug ?? cat.nombre);
  }

  getAccentColor(cat: Categoria): string {
    return cat.color ?? getCategoryColor(cat.slug ?? cat.nombre);
  }

  navegar(slug: string) {
    this.router.navigate(['/search'], { queryParams: { categoria: slug } });
  }
}
