import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { OfertaCardComponent } from '../../../shared/components/marketplace/oferta-card/oferta-card.component';
import { AuthStore } from '../../../core/auth/auth-store';

export interface OfertaSimple {
  id: number;
  titulo: string;
  precioOferta: number;
  precioOriginal?: number;
  tienda?: string;
  imagenPrincipal?: string;
  sparkCount: number;
  badge?: string;
  esActiva: boolean;
  fechaPublicacion?: string;
}

@Component({
  selector: 'app-ofertas-flash',
  standalone: true,
  imports: [CommonModule, RouterModule, OfertaCardComponent],
  templateUrl: './ofertas-flash.component.html',
  styleUrls: ['./ofertas-flash.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfertasFlashComponent implements OnInit {
  private http = inject(HttpClient);
  private authStore = inject(AuthStore);

  ofertas = signal<OfertaSimple[]>([]);
  loading = signal(true);
  error = signal(false);

  readonly skeletons = Array(12).fill(0);

  ngOnInit() {
    this.cargarOfertas();
  }

  cargarOfertas() {
    this.loading.set(true);
    const usuarioId = this.authStore.user()?.id;
    let url = `${environment.apiUrl}/oferta/flash`;
    // Para la página completa, pedimos más resultados (p.ej. 40)
    if (usuarioId) url += `?usuarioId=${usuarioId}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.content ?? res?.ofertas ?? res?.data ?? []);
        this.ofertas.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }
}
