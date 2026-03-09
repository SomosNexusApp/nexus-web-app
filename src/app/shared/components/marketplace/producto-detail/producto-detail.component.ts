import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';
import { CurrencyEsPipe } from '../../../pipes/currency-es.pipe';
import { ProductoCardComponent } from '../product-card/producto-card.component';
import { Producto } from '../../../../models/producto.model';
import { Valoracion } from '../../../../models/valoracion.model';
import { Usuario } from '../../../../models/usuario.model';
import { environment } from '../../../../../environments/enviroment';
import { AuthStore } from '../../../../core/auth/auth-store';

@Component({
  selector: 'app-producto-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TimeAgoPipe,
    CurrencyEsPipe,
    ProductoCardComponent,
  ],
  templateUrl: './producto-detail.component.html',
  styleUrls: ['./producto-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private http = inject(HttpClient);
  private authStore = inject(AuthStore);
  // private guestPopupService = inject(GuestPopupService);
  // private favoritoService  = inject(FavoritoService);

  // ── Estado principal ────────────────────────────────────────────────
  producto = signal<Producto | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  // ── Galería ──────────────────────────────────────────────────────────
  imagenActivaIdx = signal(0);
  zoomActivo = signal(false);

  // ── Vendedor ─────────────────────────────────────────────────────────
  vendedor = signal<Usuario | null>(null);
  valoraciones = signal<Valoracion[]>([]);
  productosVendedor = signal<Producto[]>([]);
  cargandoVendedor = signal(false);

  // ── Productos relacionados ────────────────────────────────────────────
  relacionados = signal<Producto[]>([]);

  // ── Auth state (desde AuthStore) ─────────────────────────────────────
  isLoggedIn = this.authStore.isLoggedIn;
  currentUserId = computed(() => this.authStore.user()?.id ?? null);
  esFavorito = signal(false);

  // ── Modales ──────────────────────────────────────────────────────────
  modalOfertaAbierto = signal(false);
  modalReporteAbierto = signal(false);
  modalBorrarAbierto = signal(false);
  precioOfertaInput = signal<number | null>(null);
  motivoReporte = signal('');
  descReporte = signal('');

  // ── Descripción expandida ─────────────────────────────────────────────
  descExpandida = signal(false);

  // ── Computed ──────────────────────────────────────────────────────────
  todasImagenes = computed(() => {
    const p = this.producto();
    if (!p) return [];
    const imgs: string[] = [];
    if (p.imagenPrincipal) imgs.push(p.imagenPrincipal);
    if (p.galeriaImagenes?.length) imgs.push(...p.galeriaImagenes);
    return imgs.length > 0 ? imgs : ['/assets/placeholder-image.webp'];
  });

  imagenActiva = computed(() => this.todasImagenes()[this.imagenActivaIdx()]);

  esVendedorPropietario = computed(() => {
    const p = this.producto();
    const userId = this.currentUserId();
    if (!p || !userId) return false;
    return (p.vendedor as any)?.id === userId;
  });

  puedeComprar = computed(() => {
    const p = this.producto();
    // Solo se puede comprar si el producto admite envío (recogida personal = solo chat)
    return (
      p?.estado === 'DISPONIBLE' &&
      this.isLoggedIn() &&
      !this.esVendedorPropietario() &&
      p.admiteEnvio === true
    );
  });

  soloRecogidaPersonal = computed(() => {
    const p = this.producto();
    return !!p && p.admiteEnvio === false && p.estado === 'DISPONIBLE';
  });

  mediaEstrellas = computed(() => {
    const vals = this.valoraciones();
    if (!vals.length) return 0;
    return vals.reduce((sum, v) => sum + v.puntuacion, 0) / vals.length;
  });

  starArray = computed(() => {
    const media = this.mediaEstrellas();
    return [1, 2, 3, 4, 5].map((n) => ({
      full: n <= Math.floor(media),
      half: n === Math.ceil(media) && media % 1 >= 0.5,
      empty: n > Math.ceil(media),
    }));
  });

  descLarga = computed(() => (this.producto()?.descripcion?.length ?? 0) > 300);

  private routeSub: any;

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) this.cargarProducto(+id);
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  // ── Carga de datos ────────────────────────────────────────────────────
  cargarProducto(id: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.imagenActivaIdx.set(0);

    this.http.get<Producto>(`${environment.apiUrl}/producto/${id}`).subscribe({
      next: (p) => {
        this.producto.set(p);
        this.cargando.set(false);
        this.cargarVendedor(p);
        this.cargarRelacionados(p);
      },
      error: () => {
        this.error.set('No se pudo cargar el producto.');
        this.cargando.set(false);
      },
    });
  }

  private cargarVendedor(p: Producto): void {
    const vendedorId = (p.vendedor as any)?.id;
    if (!vendedorId) return;
    this.cargandoVendedor.set(true);

    this.http.get<Usuario>(`${environment.apiUrl}/usuario/${vendedorId}/perfil`).subscribe({
      next: (u) => this.vendedor.set(u),
    });

    this.http
      .get<Valoracion[]>(`${environment.apiUrl}/valoracion/vendedor/${vendedorId}`)
      .subscribe({ next: (v) => this.valoraciones.set(v.slice(0, 3)) });

    this.http
      .get<any>(`${environment.apiUrl}/producto/filtrar?vendedorId=${vendedorId}&tamano=4`)
      .subscribe({
        next: (res) => {
          const lista = res?.contenido ?? res ?? [];
          this.productosVendedor.set(lista.filter((pp: Producto) => pp.id !== p.id));
          this.cargandoVendedor.set(false);
        },
        error: () => this.cargandoVendedor.set(false),
      });
  }

  private cargarRelacionados(p: Producto): void {
    const catSlug = p.categoria?.slug;
    if (!catSlug) return;
    this.http
      .get<any>(`${environment.apiUrl}/producto/filtrar?categoria=${catSlug}&tamano=6`)
      .subscribe({
        next: (res) => {
          const lista = res?.contenido ?? res ?? [];
          this.relacionados.set(lista.filter((pp: Producto) => pp.id !== p.id).slice(0, 6));
        },
      });
  }

  // ── Galería ───────────────────────────────────────────────────────────
  setImagenActiva(idx: number): void {
    this.imagenActivaIdx.set(idx);
  }

  prevImagen(): void {
    const len = this.todasImagenes().length;
    this.imagenActivaIdx.update((i) => (i - 1 + len) % len);
  }

  nextImagen(): void {
    const len = this.todasImagenes().length;
    this.imagenActivaIdx.update((i) => (i + 1) % len);
  }

  // ── Acciones comprador ────────────────────────────────────────────────
  comprarAhora(): void {
    if (!this.isLoggedIn()) {
      // Redirige al flujo de login y vuelve al producto después
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }
    const id = this.producto()?.id;
    if (!id) return;
    // Verificar estado fresco antes de navegar
    this.http.get<Producto>(`${environment.apiUrl}/producto/${id}`).subscribe({
      next: (p) => {
        if (p.estado === 'DISPONIBLE') {
          this.router.navigate(['/checkout', id]);
        } else {
          this.producto.set(p);
        }
      },
    });
  }

  irAlChat(): void {
    if (!this.isLoggedIn()) {
      // this.guestPopupService.showPopup('Para contactar al vendedor');
      return;
    }
    this.router.navigate(['/mensajes'], { queryParams: { productoId: this.producto()?.id } });
  }

  toggleFavorito(): void {
    if (!this.isLoggedIn()) {
      // this.guestPopupService.showPopup('Para guardar favoritos');
      return;
    }
    this.esFavorito.update((v) => !v);
    // this.favoritoService.toggleFavorito(this.producto()!.id).subscribe();
  }

  // ── Acciones vendedor ─────────────────────────────────────────────────
  marcarVendido(): void {
    const id = this.producto()?.id;
    if (!id) return;
    this.http
      .patch(`${environment.apiUrl}/producto/${id}/estado`, { estado: 'VENDIDO' })
      .subscribe({
        next: () => this.producto.update((p) => (p ? { ...p, estado: 'VENDIDO' } : p)),
      });
  }

  confirmarEliminar(): void {
    this.modalBorrarAbierto.set(true);
  }

  eliminarProducto(): void {
    const id = this.producto()?.id;
    if (!id) return;
    this.http.delete(`${environment.apiUrl}/producto/${id}`).subscribe({
      next: () => this.router.navigate(['/perfil']),
    });
    this.modalBorrarAbierto.set(false);
  }

  // ── Modal oferta de precio ────────────────────────────────────────────
  abrirModalOferta(): void {
    if (!this.isLoggedIn()) {
      // this.guestPopupService.showPopup('Para hacer ofertas');
      return;
    }
    this.modalOfertaAbierto.set(true);
  }

  enviarOferta(): void {
    const precio = this.precioOfertaInput();
    const p = this.producto();
    if (!precio || !p) return;
    this.http
      .post(`${environment.apiUrl}/chat/mensaje`, {
        productoId: p.id,
        tipo: 'OFERTA_PRECIO',
        precioPropuesto: precio,
      })
      .subscribe();
    this.modalOfertaAbierto.set(false);
    this.irAlChat();
  }

  // ── Reporte ───────────────────────────────────────────────────────────
  reportarAnuncio(): void {
    if (!this.isLoggedIn()) {
      // this.guestPopupService.showPopup('Para reportar anuncios');
      return;
    }
    this.modalReporteAbierto.set(true);
  }

  enviarReporte(): void {
    const p = this.producto();
    if (!p || !this.motivoReporte()) return;
    this.http
      .post(`${environment.apiUrl}/reporte`, {
        tipo: 'PRODUCTO',
        motivo: this.motivoReporte(),
        descripcion: this.descReporte(),
        productoDenunciadoId: p.id,
      })
      .subscribe();
    this.modalReporteAbierto.set(false);
  }

  // ── Helpers UI ────────────────────────────────────────────────────────
  trackByIdx(i: number): number {
    return i;
  }

  getAvatarFallback(nombre?: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : 'U';
  }
}
