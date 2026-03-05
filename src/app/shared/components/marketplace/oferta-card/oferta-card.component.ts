import {
  Component,
  Input,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CurrencyEsPipe } from '../../../pipes/currency-es.pipe';
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';
import { DiscountPercentPipe } from '../../../pipes/discount-percent.pipe';
import { SkeletonCardComponent } from '../../skeleton-card/skeleton-card.component';
import { Oferta } from '../../../../models/oferta.model';

@Component({
  selector: 'app-oferta-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgOptimizedImage,
    CurrencyEsPipe,
    TimeAgoPipe,
    DiscountPercentPipe,
    SkeletonCardComponent,
  ],
  templateUrl: './oferta-card.component.html',
  styleUrls: ['./oferta-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfertaCardComponent implements OnInit, OnDestroy {
  @Input() oferta!: Oferta;
  @Input() isSkeleton = false;

  private router = inject(Router);
  private http = inject(HttpClient);
  // private authService = inject(AuthService);
  // private guestPopupService = inject(GuestPopupService);

  sparkCount = signal(0);
  dripCount = signal(0);
  miVoto = signal<boolean | null>(null); // true=spark, false=drip, null=sin voto
  votando = signal(false);
  copiado = signal(false);
  countdown = signal('');

  private countdownInterval?: ReturnType<typeof setInterval>;

  get isLoggedIn(): boolean {
    return false; // this.authService.isLoggedIn()
  }

  get coverImage(): string {
    if (this.oferta?.imagenPrincipal) return this.oferta.imagenPrincipal;
    if (this.oferta?.galeriaImagenes?.length) return this.oferta.galeriaImagenes[0];
    return '/assets/placeholder-image.webp';
  }

  get discountPercent(): number {
    if (!this.oferta?.precioOriginal || this.oferta.precioOriginal <= 0) return 0;
    return Math.round((1 - this.oferta.precioOferta / this.oferta.precioOriginal) * 100);
  }

  get badgeEmoji(): string {
    const map: Record<string, string> = {
      CHOLLAZO: '🔥',
      EXPIRA_HOY: '⏰',
      GRATUITA: '🎁',
      NUEVA: '⭐',
      DESTACADA: '💎',
      PORCENTAJE: '%',
    };
    return this.oferta?.badge ? (map[this.oferta.badge] ?? '') : '';
  }

  get badgeLabel(): string {
    const map: Record<string, string> = {
      CHOLLAZO: 'CHOLLAZO',
      EXPIRA_HOY: 'EXPIRA HOY',
      GRATUITA: 'GRATIS',
      NUEVA: 'NUEVA',
      DESTACADA: 'DESTACADA',
      PORCENTAJE: 'OFERTA',
    };
    return this.oferta?.badge ? (map[this.oferta.badge] ?? this.oferta.badge) : '';
  }

  get sparkTempWidth(): number {
    const total = this.sparkCount() + this.dripCount();
    if (total === 0) return 0;
    return Math.round((this.sparkCount() / total) * 100);
  }

  get expiraProxima(): boolean {
    if (!this.oferta?.fechaExpiracion) return false;
    const diff = new Date(this.oferta.fechaExpiracion).getTime() - Date.now();
    return diff > 0 && diff < 24 * 3600 * 1000;
  }

  ngOnInit(): void {
    if (this.oferta) {
      this.sparkCount.set(this.oferta.sparkCount ?? 0);
      this.dripCount.set(this.oferta.dripCount ?? 0);
      this.miVoto.set(this.oferta.miVoto ?? null);
    }
    if (this.oferta?.fechaExpiracion) {
      this.startCountdown();
    }
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  private startCountdown(): void {
    const update = () => {
      const diff = new Date(this.oferta.fechaExpiracion!).getTime() - Date.now();
      if (diff <= 0) {
        this.countdown.set('Expirada');
        clearInterval(this.countdownInterval);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      this.countdown.set(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    };
    update();
    this.countdownInterval = setInterval(update, 1000);
  }

  votar(tipo: boolean, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    if (!this.isLoggedIn) {
      // this.guestPopupService.showPopup('Para votar en chollos');
      console.log('Guest: mostrar popup votación');
      return;
    }

    if (this.votando()) return;
    this.votando.set(true);

    const votoActual = this.miVoto();

    // Toggle: si ya votó igual, quita el voto
    if (votoActual === tipo) {
      if (tipo) this.sparkCount.update((n) => Math.max(0, n - 1));
      else this.dripCount.update((n) => Math.max(0, n - 1));
      this.miVoto.set(null);
    } else {
      // Quitar voto anterior si lo había
      if (votoActual === true) this.sparkCount.update((n) => Math.max(0, n - 1));
      if (votoActual === false) this.dripCount.update((n) => Math.max(0, n - 1));
      // Añadir nuevo voto
      if (tipo) this.sparkCount.update((n) => n + 1);
      else this.dripCount.update((n) => n + 1);
      this.miVoto.set(tipo);
    }

    // POST al backend
    this.http
      .post('/api/spark-votos', { ofertaId: this.oferta.id, tipo })
      .subscribe({ error: () => {} })
      .add(() => this.votando.set(false));
  }

  copiarCodigo(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    if (!this.oferta?.codigoDescuento) return;
    navigator.clipboard.writeText(this.oferta.codigoDescuento).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    });
  }

  navigateToDetail(): void {
    this.router.navigate(['/ofertas', this.oferta.id]);
  }
}
