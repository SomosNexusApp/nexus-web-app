import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';
import { OfertaCardComponent } from '../../../shared/components/marketplace/oferta-card/oferta-card.component';
import { AuthStore } from '../../../../app/core/auth/auth-store';

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
}

@Component({
  selector: 'app-ofertas-categoria',
  standalone: true,
  imports: [CommonModule, RouterModule, OfertaCardComponent],
  templateUrl: './ofertas-categoria.component.html',
  styleUrls: ['./ofertas-categoria.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfertasCategoriaComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authStore = inject(AuthStore);

  categorias = signal<Categoria[]>([]);
  activeSlug = signal<string>('');
  ofertas = signal<any[]>([]);

  loadingCats = signal(true);
  loadingItems = signal(false);
  errorCats = signal(false);
  errorItems = signal(false);

  private cache = new Map<string, any[]>();

  readonly skeletonTabs = Array(6).fill(0);
  readonly skeletonCards = Array(6).fill(0);

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/categorias/raiz`).subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.content ?? res?.data ?? []);
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

    let params = new HttpParams()
      .set('categoria', slug)
      .set('soloActivas', 'true')
      .set('page', '0')
      .set('size', '6');

    const usuarioId = this.authStore.user()?.id;
    if (usuarioId) params = params.set('usuarioId', String(usuarioId));

    this.http.get<any>(`${environment.apiUrl}/oferta/filtrar`, { params }).subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.content ?? res?.ofertas ?? res?.data ?? []);
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

  goToCategory(slug: string) {
    this.router.navigate(['/search'], { queryParams: { categoria: slug, tipo: 'OFERTA' } });
  }
}
