import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';

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
    const slug = (cat.slug || cat.nombre || '').toLowerCase();
    const map: Record<string, string> = {
      electronica: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
      movil: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
      ropa: 'M6.5 2h11l1 4-5 3v11H9.5V9l-5-3z',
      moda: 'M6.5 2h11l1 4-5 3v11H9.5V9l-5-3z',
      hogar: 'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5zM9 21V12h6v9',
      informatica:
        'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      videojuego:
        'M6 12h4m2 0h4M9 9v6M3 7h18a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1z',
      deporte: 'M12 2a10 10 0 100 20A10 10 0 0012 2zM4.93 4.93l14.14 14.14',
      libro:
        'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      vehiculo:
        'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.6 2 12.2 2 12.8V16c0 .6.4 1 1 1h2',
      motor:
        'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.6 2 12.2 2 12.8V16c0 .6.4 1 1 1h2',
      juguete:
        'M12 2a3 3 0 013 3v1h3a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h3V5a3 3 0 013-3z',
      inmueble: 'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z',
      audio:
        'M9 18V5l12-2v13M9 18c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2zm12-2c0 1.1-1.34 2-3 2s-3-.9-3-2 1.34-2 3-2 3 .9 3 2z',
      camara:
        'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z',
      coleccion: 'M5 3l14 9-14 9V3z',
    };
    for (const key of Object.keys(map)) {
      if (slug.includes(key)) return map[key];
    }
    return 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z';
  }

  // Ruedas extra solo para vehículos
  esVehiculo(cat: Categoria): boolean {
    const t = (cat.slug || cat.nombre || '').toLowerCase();
    return t.includes('vehiculo') || t.includes('motor') || t.includes('moto');
  }
}
