import { Component, OnInit, inject, signal, computed, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';
import { AuthStore } from '../../../core/auth/auth-store';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { BloqueoService } from '../../../core/services/bloqueo.service';
import { ReporteModalComponent } from '../../../shared/components/reporte-modal/reporte-modal.component';
import { ProductoCardComponent } from '../../../shared/components/marketplace/product-card/producto-card.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-perfil-publico',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TimeAgoPipe,
    ProductoCardComponent,
    ReporteModalComponent,
    AvatarComponent,
  ],
  templateUrl: './perfil-publico.component.html',
  styleUrls: ['./perfil-publico.component.css'],
})
export class PerfilPublicoComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  authStore = inject(AuthStore);
  private bloqueoService = inject(BloqueoService);

  @ViewChild(ReporteModalComponent) reporteModal!: ReporteModalComponent;

  // Estado
  perfil = signal<any>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  activeTab = signal<'productos' | 'ofertas' | 'valoraciones' | 'sobre-mi'>('productos');

  // Actions states
  estaBloqueado = signal(false);
  mostrandoMenu = signal(false);

  // Datos de tabs
  productos = signal<any[]>([]);
  ofertas = signal<any[]>([]);
  valoraciones = signal<any[]>([]);
  resumenValoraciones = signal<any>(null);
  cargandoTab = signal(false);

  esMiPerfil = computed(() => {
    const p = this.perfil();
    const user = this.authStore.user();
    if (!p || !user) return false;
    return p.id === user.id;
  });

  fechaRegistroFormateada = computed(() => {
    const p = this.perfil();
    if (!p?.fechaRegistro) return '';
    const d = new Date(p.fechaRegistro);
    const meses = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];
    return `${meses[d.getMonth()]} ${d.getFullYear()}`;
  });

  private routeSub: any;

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const username = params.get('username');
      if (username) this.cargarPerfil(username);
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }

  cargarPerfil(username: string) {
    this.cargando.set(true);
    this.error.set(null);

    // El backend usa ID, intentamos primero buscar por username
    // Si el username es numérico, usamos directamente como ID
    const endpoint = isNaN(Number(username))
      ? `${environment.apiUrl}/usuario/username/${username}`
      : `${environment.apiUrl}/usuario/${username}/perfil`;

    this.http.get<any>(endpoint).subscribe({
      next: (data) => {
        this.perfil.set(data);
        this.cargando.set(false);
        this.cargarResumenValoraciones(data.id);
        this.cargarTabProductos(data.id);

        if (this.authStore.isLoggedIn() && data.id !== this.authStore.user()?.id) {
          this.bloqueoService.estaBloqueado(data.id).subscribe({
            next: (res) => this.estaBloqueado.set(res.bloqueado),
            error: () => this.estaBloqueado.set(false),
          });
        }
      },
      error: () => {
        this.error.set('No se encontró el perfil.');
        this.cargando.set(false);
      },
    });
  }

  cargarResumenValoraciones(userId: number) {
    this.http.get<any>(`${environment.apiUrl}/valoracion/vendedor/${userId}/resumen`).subscribe({
      next: (data) => this.resumenValoraciones.set(data),
    });
  }

  cambiarTab(tab: 'productos' | 'ofertas' | 'valoraciones' | 'sobre-mi') {
    this.activeTab.set(tab);
    const p = this.perfil();
    if (!p) return;

    if (tab === 'productos' && this.productos().length === 0) {
      this.cargarTabProductos(p.id);
    } else if (tab === 'ofertas' && this.ofertas().length === 0) {
      this.cargarTabOfertas(p.id);
    } else if (tab === 'valoraciones' && this.valoraciones().length === 0) {
      this.cargarTabValoraciones(p.id);
    }
  }

  cargarTabProductos(userId: number) {
    this.cargandoTab.set(true);
    this.http
      .get<any>(`${environment.apiUrl}/producto/filtrar?vendedorId=${userId}&tamano=20`)
      .subscribe({
        next: (res) => {
          const lista = res?.contenido ?? res?.content ?? res ?? [];
          this.productos.set(Array.isArray(lista) ? lista : []);
          this.cargandoTab.set(false);
        },
        error: () => this.cargandoTab.set(false),
      });
  }

  cargarTabOfertas(userId: number) {
    this.cargandoTab.set(true);
    this.http
      .get<any>(`${environment.apiUrl}/oferta/filtrar?vendedorId=${userId}&tamano=20`)
      .subscribe({
        next: (res) => {
          const lista = res?.contenido ?? res?.content ?? res ?? [];
          this.ofertas.set(Array.isArray(lista) ? lista : []);
          this.cargandoTab.set(false);
        },
        error: () => this.cargandoTab.set(false),
      });
  }

  cargarTabValoraciones(userId: number) {
    this.cargandoTab.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/valoracion/vendedor/${userId}`).subscribe({
      next: (data) => {
        this.valoraciones.set(data || []);
        this.cargandoTab.set(false);
      },
      error: () => this.cargandoTab.set(false),
    });
  }

  contactar() {
    if (!this.authStore.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    const p = this.perfil();
    if (p) {
      this.router.navigate(['/mensajes'], { queryParams: { usuarioId: p.id } });
    }
  }

  getStarsArray(rating: number): { full: boolean; half: boolean; empty: boolean }[] {
    return [1, 2, 3, 4, 5].map((n) => ({
      full: n <= Math.floor(rating),
      half: n === Math.ceil(rating) && rating % 1 >= 0.25,
      empty: n > Math.ceil(rating),
    }));
  }

  toggleOptionMenu() {
    this.mostrandoMenu.update((v) => !v);
  }

  abrirReporte() {
    this.mostrandoMenu.set(false);
    if (!this.authStore.isLoggedIn()) {
      alert('Debes iniciar sesión para reportar.');
      return;
    }
    this.reporteModal.abrir('USUARIO', this.perfil().id);
  }

  toggleBloqueo() {
    this.mostrandoMenu.set(false);
    if (!this.authStore.isLoggedIn()) {
      alert('Debes iniciar sesión para bloquear.');
      return;
    }

    const userId = this.perfil().id;
    if (this.estaBloqueado()) {
      this.bloqueoService.desbloquear(userId).subscribe({
        next: () => this.estaBloqueado.set(false),
        error: (err) => alert('Error al desbloquear: ' + (err.error?.error || err.message)),
      });
    } else {
      if (
        confirm('¿Estás seguro de que deseas bloquear a este usuario? No podrá enviarte mensajes.')
      ) {
        this.bloqueoService.bloquearUsuario(userId).subscribe({
          next: () => this.estaBloqueado.set(true),
          error: (err) => alert('Error al bloquear: ' + (err.error?.error || err.message)),
        });
      }
    }
  }
}
