import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';
import { CurrencyEsPipe } from '../../../shared/pipes/currency-es.pipe';
import { DiscountPercentPipe } from '../../../shared/pipes/discount-percent.pipe';

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
}
export interface OfertaCat {
  id: number;
  titulo: string;
  precioOferta: number;
  precioOriginal?: number;
  imagenPrincipal?: string;
  tienda?: string;
  sparkCount?: number;
}

@Component({
  selector: 'app-ofertas-categoria',
  standalone: true,
  imports: [CommonModule, CurrencyEsPipe, DiscountPercentPipe],
  templateUrl: './ofertas-categoria.component.html',
  styleUrls: ['./ofertas-categoria.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfertasCategoriaComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  categorias = signal<Categoria[]>([]);
  activeSlug = signal<string>('');
  ofertas = signal<OfertaCat[]>([]);

  loadingCats = signal(true);
  loadingItems = signal(false);
  errorCats = signal(false);
  errorItems = signal(false);

  private cache = new Map<string, OfertaCat[]>();

  readonly skeletonTabs = Array(6).fill(0);
  readonly skeletonCards = Array(6).fill(0);

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/categorias/raiz`).subscribe({
      next: (res) => {
        const list: Categoria[] = Array.isArray(res) ? res : (res?.content ?? res?.data ?? []);
        const top = list.slice(0, 8);
        this.categorias.set(top);
        this.loadingCats.set(false);
        if (top.length > 0) this.selectTab(top[0].slug);
      },
      error: () => {
        this.loadingCats.set(false);
        this.errorCats.set(true);
      },
    });
  }

  selectTab(slug: string) {
    if (this.activeSlug() === slug) return;
    this.activeSlug.set(slug);

    if (this.cache.has(slug)) {
      this.ofertas.set(this.cache.get(slug)!);
      return;
    }

    this.loadingItems.set(true);
    this.errorItems.set(false);

    // Solo mandar params ASCII-safe que Spring mapea sin problemas.
    // tamañoPagina tiene ñ y se codifica raro → usar 'pagina' y dejar size en default.
    // El 500 de /filtrar es bug del backend (defaultValue="fecha") — ver OfertaController.
    const params = new HttpParams()
      .set('categoria', slug)
      .set('soloActivas', 'true')
      .set('pagina', '0');

    this.http.get<any>(`${environment.apiUrl}/oferta/filtrar`, { params }).subscribe({
      next: (res) => {
        const list: OfertaCat[] = Array.isArray(res)
          ? res
          : (res?.content ?? res?.ofertas ?? res?.data ?? []);
        const items = list.slice(0, 6);
        this.cache.set(slug, items);
        this.ofertas.set(items);
        this.loadingItems.set(false);
      },
      error: () => {
        this.loadingItems.set(false);
        this.errorItems.set(true);
        this.ofertas.set([]);
      },
    });
  }

  hasDiscount(o: OfertaCat): boolean {
    return !!o.precioOriginal && o.precioOriginal > o.precioOferta;
  }

  goToOffer(id: number) {
    this.router.navigate(['/oferta/filtrar', id]);
  }

  goToCategory(slug: string) {
    this.router.navigate(['/oferta/filtrar'], { queryParams: { categoria: slug } });
  }
}
