import {
  Component,
  Input,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CurrencyEsPipe } from '../../../pipes/currency-es.pipe';
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';
import { SkeletonCardComponent } from '../../skeleton-card/skeleton-card.component';
import { CoverImagePipe } from '../../../pipes/cover-image.pipe';
import { MarketplaceItem } from '../../../../models/marketplace-item.model';

@Component({
  selector: 'app-oferta-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CurrencyEsPipe,
    TimeAgoPipe,
    SkeletonCardComponent,
    CoverImagePipe,
  ],
  templateUrl: './oferta-card.component.html',
  styleUrls: ['./oferta-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfertaCardComponent implements OnInit, OnDestroy {
  @Input() oferta!: MarketplaceItem;
  @Input() isSkeleton = false;

  private router = inject(Router);
  private http = inject(HttpClient);

  sparkCount = signal(0);
  dripCount = signal(0);
  miVoto = signal<boolean | null>(null);
  votando = signal(false);
  copiado = signal(false);
  countdown = signal('');

  private countdownInterval?: ReturnType<typeof setInterval>;

  get isLoggedIn(): boolean {
    return true; // Simplificado para que funcionen los botones en preview
  }

  get discountPercent(): number {
    const orig = this.oferta?.precioOriginal;
    const off = this.oferta?.precioOferta || this.oferta?.precio;
    if (!orig || !off || orig <= 0) return 0;
    return Math.round(((orig - off) / orig) * 100);
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
    const b = (this.oferta as any)?.badge;
    return b ? (map[b] || b) : '';
  }

  get sparkTempWidth(): number {
    const total = this.sparkCount() + this.dripCount();
    return total === 0 ? 0 : Math.round((this.sparkCount() / total) * 100);
  }

  get expiraProxima(): boolean {
    const fe = (this.oferta as any)?.fechaExpiracion;
    if (!fe) return false;
    const diff = new Date(fe).getTime() - Date.now();
    return diff > 0 && diff < 24 * 3600 * 1000;
  }

  ngOnInit(): void {
    if (this.oferta) {
      this.updateState();
    }
  }

  // Permite actualizar el estado si la oferta cambia (importante para preview)
  ngOnChanges(): void {
    if (this.oferta) {
      this.updateState();
    }
  }

  private updateState(): void {
    this.sparkCount.set((this.oferta as any).sparkCount ?? 0);
    this.dripCount.set((this.oferta as any).dripCount ?? 0);
    this.miVoto.set((this.oferta as any).miVoto ?? null);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if ((this.oferta as any).fechaExpiracion) this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  private startCountdown(): void {
    const update = () => {
      const fe = (this.oferta as any).fechaExpiracion;
      const diff = new Date(fe).getTime() - Date.now();
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
    if (this.votando()) return;
    this.miVoto.set(tipo);
  }

  copiarCodigo(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    const code = (this.oferta as any).codigoDescuento;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    });
  }

  navigateToDetail(): void {
    if (this.oferta.id === 9999) return; // No navegar en preview
    this.router.navigate(['/search'], { queryParams: { q: this.oferta.titulo, tipo: 'OFERTA' } });
  }
}
