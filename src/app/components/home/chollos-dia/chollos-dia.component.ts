import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';
import { CurrencyEsPipe } from '../../../shared/pipes/currency-es.pipe';
import { DiscountPercentPipe } from '../../../shared/pipes/discount-percent.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

export interface OfertaSimple {
  id: number;
  titulo: string;
  precioOferta: number;
  precioOriginal?: number;
  tienda?: string;
  imagenPrincipal?: string;
  sparkCount: number;
  badge?: 'CHOLLAZO' | 'DESTACADA' | 'EXPIRA_HOY' | 'GRATUITA' | 'NUEVA' | 'PORCENTAJE';
  esActiva: boolean;
  fechaPublicacion?: string;
  urlProducto?: string;
}

const BADGE_META: Record<string, { label: string; mod: string }> = {
  CHOLLAZO: { label: 'Chollazo', mod: 'badge--fire' },
  DESTACADA: { label: 'Destacada', mod: 'badge--blue' },
  EXPIRA_HOY: { label: 'Expira hoy', mod: 'badge--red' },
  GRATUITA: { label: 'Gratis', mod: 'badge--green' },
  NUEVA: { label: 'Nueva', mod: 'badge--purple' },
  PORCENTAJE: { label: 'Oferta', mod: 'badge--amber' },
};

@Component({
  selector: 'app-chollos-dia',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyEsPipe, DiscountPercentPipe, TimeAgoPipe],
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
    // Usar /oferta/trending — endpoint dedicado, sin params problemáticos,
    // ordena por sparkScore de las últimas 24h y tiene permitAll en SecurityConfig
    this.http.get<any>(`${environment.apiUrl}/oferta/trending`).subscribe({
      next: (res) => {
        const list: OfertaSimple[] = Array.isArray(res)
          ? res
          : (res?.content ?? res?.ofertas ?? res?.data ?? []);
        this.ofertas.set(list.slice(0, 8));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  badgeLabel(badge?: string): string {
    return badge ? (BADGE_META[badge]?.label ?? badge) : '';
  }

  badgeMod(badge?: string): string {
    return badge ? (BADGE_META[badge]?.mod ?? '') : '';
  }

  hasDiscount(oferta: OfertaSimple): boolean {
    return !!oferta.precioOriginal && oferta.precioOriginal > oferta.precioOferta;
  }

  goToAll() {
    this.router.navigate(['/oferta/filtrar']);
  }

  goToOffer(id: number) {
    this.router.navigate(['/oferta/filtrar', id]);
  }
}
