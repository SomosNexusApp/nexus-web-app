import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';
import { getCategoryIconPath } from '../../utils/category-icons';

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  icono?: string;
  color?: string;
  orden?: number;
  activa?: boolean;
  hijos?: Categoria[];
}

@Component({
  selector: 'app-categoria-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categoria-panel.component.html',
  styleUrls: ['./categoria-panel.component.css'],
})
export class CategoriaPanelComponent implements OnInit {
  @Input() isOpen = false;
  @Output() cerrar = new EventEmitter<void>();

  private http = inject(HttpClient);
  private router = inject(Router);

  categorias = signal<Categoria[]>([]);
  expandidas = signal<Set<number>>(new Set());
  cargando = signal(true);

  ngOnInit(): void {
    this.http.get<Categoria[]>(`${environment.apiUrl}/categorias/raiz`).subscribe({
      next: (cats) => {
        this.categorias.set(cats);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  toggleExpandida(id: number, event: Event): void {
    event.stopPropagation();
    const set = new Set(this.expandidas());
    set.has(id) ? set.delete(id) : set.add(id);
    this.expandidas.set(set);
  }

  esExpandida(id: number): boolean {
    return this.expandidas().has(id);
  }

  // ── Fix bug 2: slug vacío = ir al catálogo sin filtro ────────────────
  navegarA(slug: string): void {
    if (slug) {
      this.router.navigate(['/search'], { queryParams: { categoria: slug } });
    } else {
      this.router.navigate(['/search']);
    }
    this.cerrar.emit();
  }

  onOverlayClick(): void {
    this.cerrar.emit();
  }

  getIconPath(cat: Categoria): string {
    return getCategoryIconPath(cat.icono, cat.slug ?? cat.nombre);
  }

  // Ruedas extra solo para vehículos
  esVehiculo(cat: Categoria): boolean {
    const t = (cat.slug || cat.nombre || '').toLowerCase();
    return t.includes('vehiculo') || t.includes('motor') || t.includes('moto');
  }
}
