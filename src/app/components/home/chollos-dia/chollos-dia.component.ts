import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';
import { OfertaCardComponent } from '../../../shared/components/marketplace/oferta-card/oferta-card.component';

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
  selector: 'app-chollos-dia',
  standalone: true,
  imports: [CommonModule, RouterModule, OfertaCardComponent],
  templateUrl: './chollos-dia.component.html',
  styleUrls: ['./chollos-dia.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChollosDiaComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  ofertas = signal<OfertaSimple[]>([]);
  loading = signal(true);
  error = signal(false);

  readonly skeletons = Array(8).fill(0);

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/oferta/trending`).subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.content ?? res?.ofertas ?? res?.data ?? []);
        this.ofertas.set(list.slice(0, 8));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  goToAll() {
    this.router.navigate(['/search'], { queryParams: { tipo: 'OFERTA' } });
  }
}
