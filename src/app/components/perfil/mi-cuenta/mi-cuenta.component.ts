import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../../core/auth/auth-store';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/enviroment';
import { CurrencyEsPipe } from '../../../shared/pipes/currency-es.pipe';

import { CoverImagePipe } from '../../../shared/pipes/cover-image.pipe';
import { ProductoCardComponent } from '../../../shared/components/marketplace/product-card/producto-card.component';
import { MisComprasComponent } from '../../compras/mis-compras/mis-compras.component';
import { ConversacionesListComponent } from '../../mensajes/conversaciones-list/conversaciones-list';
import { PagosComponent } from '../pagos/pagos.component';

type SidebarSection =
  | 'resumen'
  | 'productos'
  | 'ofertas'
  | 'compras'
  | 'ventas'
  | 'buzon'
  | 'favoritos'
  | 'estadisticas'
  | 'pagos'
  | 'configuracion'
  | 'ayuda';

@Component({
  selector: 'app-mi-cuenta',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CurrencyEsPipe,

    CoverImagePipe,
    ProductoCardComponent,
    MisComprasComponent,
    ConversacionesListComponent,
    PagosComponent,
  ],
  templateUrl: './mi-cuenta.component.html',
  styleUrls: ['./mi-cuenta.component.css'],
})
export class MiCuentaComponent implements OnInit {
  authStore = inject(AuthStore);
  authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Sidebar
  activeSection = signal<SidebarSection>('resumen');
  mobileMenuOpen = signal(false);

  // Resumen KPIs
  kpis = signal<any>({
    ventas: 0,
    compras: 0,
    valoracionMedia: 0,
    tasaRespuesta: 0,
  });

  // Mis Productos
  misProductos = signal<any[]>([]);
  productoTab = signal<string>('DISPONIBLE');
  cargandoProductos = signal(false);

  // Mis Ofertas
  misOfertas = signal<any[]>([]);
  cargandoOfertas = signal(false);

  // Favoritos
  favProductos = signal<any[]>([]);
  favOfertas = signal<any[]>([]);
  favTab = signal<'productos' | 'ofertas'>('productos');
  cargandoFavs = signal(false);

  // Configuración
  editando = signal(false);
  editForm = signal<any>({});

  // Ayuda FAQs
  faqs = [
    {
      q: '¿Cómo publico un producto?',
      a: 'Ve a "Publicar" en el menú superior y rellena el formulario con los datos y fotos de tu producto.',
    },
    {
      q: '¿Cómo funciona el envío?',
      a: 'El vendedor se encarga del envío. Puedes elegir entre envío a domicilio o recogida en persona según el anuncio.',
    },
    {
      q: '¿Cómo cancelo una compra?',
      a: 'Ve a "Mis Compras" y selecciona la compra. Si aún no ha sido enviada, podrás solicitar la cancelación.',
    },
    {
      q: '¿Cómo contacto con soporte?',
      a: 'Envía un email a somosnexusapp@gmail.com o usa el formulario de "Reportar un problema" más abajo.',
    },
    {
      q: '¿Cómo dejo una valoración?',
      a: 'Después de que tu compra se marque como completada, podrás dejar una valoración desde el detalle de la compra.',
    },
  ];
  faqOpen = signal<number>(-1);

  // Modal
  showLogoutModal = signal(false);
  showDeleteModal = signal(false);

  // Computed
  user = this.authStore.user;
  iniciales = computed(() => {
    const u = this.user();
    if (!u?.nombre) return u?.user?.[0]?.toUpperCase() || '?';
    return u.nombre
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  sidebarItems: { id: SidebarSection; icon: string; label: string }[] = [
    { id: 'resumen', icon: 'fa-user', label: 'Resumen' },
    { id: 'productos', icon: 'fa-box-open', label: 'Mis Productos' },
    { id: 'ofertas', icon: 'fa-tags', label: 'Mis Ofertas' },
    { id: 'compras', icon: 'fa-shopping-cart', label: 'Mis Compras' },
    { id: 'ventas', icon: 'fa-coins', label: 'Mis Ventas' },
    { id: 'buzon', icon: 'fa-comments', label: 'Buzón' },
    { id: 'favoritos', icon: 'fa-heart', label: 'Favoritos' },
    { id: 'estadisticas', icon: 'fa-chart-bar', label: 'Estadísticas' },
    { id: 'pagos', icon: 'fa-credit-card', label: 'Métodos de Pago' },
    { id: 'configuracion', icon: 'fa-cog', label: 'Configuración' },
    { id: 'ayuda', icon: 'fa-question-circle', label: 'Ayuda' },
  ];

  ngOnInit() {
    this.cargarKPIs();
    this.route.queryParams.subscribe((params) => {
      const tab = params['tab'];
      if (tab) {
        this.setSection(tab as SidebarSection);
      }
    });
  }

  setSection(section: SidebarSection) {
    this.activeSection.set(section);
    this.mobileMenuOpen.set(false);

    switch (section) {
      case 'productos':
        if (this.misProductos().length === 0) this.cargarMisProductos();
        break;
      case 'ofertas':
        if (this.misOfertas().length === 0) this.cargarMisOfertas();
        break;
      case 'favoritos':
        if (this.favProductos().length === 0) this.cargarFavoritos();
        break;
      case 'configuracion':
        this.prepararEdicion();
        break;
    }
  }

  // ── KPIs ─────────────────────────────────
  cargarKPIs() {
    const u = this.user();
    if (!u) return;
    this.http.get<any>(`${environment.apiUrl}/valoracion/vendedor/${u.id}/resumen`).subscribe({
      next: (res) => {
        this.kpis.update((k) => ({
          ...k,
          valoracionMedia: res.media || 0,
          ventas: u.totalVentas || 0,
          compras: res.totalCompras || 0,
          tasaRespuesta: res.tasaRespuesta || 100,
        }));
      },
    });
  }

  // ── Mis Productos ────────────────────────
  cargarMisProductos() {
    const u = this.user();
    if (!u) return;
    this.cargandoProductos.set(true);
    this.http
      .get<any>(`${environment.apiUrl}/producto/filtrar?vendedorId=${u.id}&tamano=50`)
      .subscribe({
        next: (res) => {
          const lista = res?.contenido ?? res?.content ?? res ?? [];
          this.misProductos.set(Array.isArray(lista) ? lista : []);
          this.cargandoProductos.set(false);
        },
        error: () => this.cargandoProductos.set(false),
      });
  }

  productosFiltrados() {
    return this.misProductos().filter((p) => p.estado === this.productoTab());
  }

  cambiarEstadoProducto(productoId: number, nuevoEstado: string) {
    this.http
      .patch(`${environment.apiUrl}/producto/${productoId}/estado`, { estado: nuevoEstado })
      .subscribe({
        next: () => {
          this.misProductos.update((ps) =>
            ps.map((p) => (p.id === productoId ? { ...p, estado: nuevoEstado } : p)),
          );
        },
      });
  }

  eliminarProducto(productoId: number) {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
    this.http.delete(`${environment.apiUrl}/producto/${productoId}`).subscribe({
      next: () => {
        this.misProductos.update((ps) => ps.filter((p) => p.id !== productoId));
      },
    });
  }

  // ── Mis Ofertas ──────────────────────────
  cargarMisOfertas() {
    const u = this.user();
    if (!u) return;
    this.cargandoOfertas.set(true);
    this.http
      .get<any>(`${environment.apiUrl}/oferta/filtrar?vendedorId=${u.id}&tamano=50`)
      .subscribe({
        next: (res) => {
          const lista = res?.contenido ?? res?.content ?? res ?? [];
          this.misOfertas.set(Array.isArray(lista) ? lista : []);
          this.cargandoOfertas.set(false);
        },
        error: () => {
          this.misOfertas.set([]);
          this.cargandoOfertas.set(false);
        },
      });
  }

  eliminarOferta(ofertaId: number) {
    if (!confirm('¿Seguro que quieres eliminar esta oferta?')) return;
    this.http.delete(`${environment.apiUrl}/oferta/${ofertaId}`).subscribe({
      next: () => {
        this.misOfertas.update((os) => os.filter((o) => o.id !== ofertaId));
      },
    });
  }

  // ── Favoritos ────────────────────────────
  cargarFavoritos() {
    this.cargandoFavs.set(true);
    const u = this.authStore.user();
    if (!u) return;
    this.http
      .get<any[]>(`${environment.apiUrl}/api/favoritos/usuario/${u.id}`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this.favProductos.set((data || []).filter((f: any) => f.producto));
          this.favOfertas.set((data || []).filter((f: any) => f.oferta));
          this.cargandoFavs.set(false);
        },
        error: () => {
          this.favProductos.set([]);
          this.favOfertas.set([]);
          this.cargandoFavs.set(false);
        },
      });
  }

  quitarFavorito(favId: number) {
    // Fíjate que aquí dice /api/favoritos/ en lugar de /favorito/
    this.http.delete(`${environment.apiUrl}/api/favoritos/${favId}`).subscribe({
      next: () => {
        this.favProductos.update((fs) => fs.filter((f) => f.id !== favId));
        this.favOfertas.update((fs) => fs.filter((f) => f.id !== favId));
      },
    });
  }

  // ── Configuración ────────────────────────
  prepararEdicion() {
    const u = this.user();
    if (!u) return;
    this.editForm.set({
      nombre: u.nombre || '',
      user: u.user || '',
      email: u.email || '',
      telefono: (u as any).telefono || '',
      biografia: u.biografia || '',
      ubicacion: u.ubicacion || '',
    });
  }

  updateConfigField(field: string, value: any) {
    this.editForm.update((f: any) => ({ ...f, [field]: value }));
  }

  guardarPerfil() {
    const u = this.user();
    if (!u) return;
    this.http.put(`${environment.apiUrl}/usuario/${u.id}`, this.editForm()).subscribe({
      next: () => {
        alert('Perfil actualizado correctamente.');
        this.editando.set(false);
      },
      error: () => alert('Error al guardar los cambios.'),
    });
  }

  onAvatarChange(event: Event) {
    const u = this.user();
    if (!u) return;
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const fd = new FormData();
    fd.append('file', input.files[0]);

    this.http.post<any>(`${environment.apiUrl}/usuario/${u.id}/avatar`, fd).subscribe({
      next: (res) => {
        alert('Avatar actualizado.');
        // Actualizar localmente
        this.authStore.setUser({ ...u, avatar: res.url } as any);
      },
      error: () => alert('Error al subir el avatar.'),
    });
  }

  // ── FAQs ─────────────────────────────────
  toggleFaq(index: number) {
    this.faqOpen.set(this.faqOpen() === index ? -1 : index);
  }

  // ── Logout ───────────────────────────────
  confirmarLogout() {
    this.showLogoutModal.set(true);
  }

  logout() {
    this.showLogoutModal.set(false);
    this.authService.logout();
  }

  // ── Helpers ──────────────────────────────
  getStarsArray(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map((n) => n <= Math.round(rating));
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'DISPONIBLE':
        return '#22c55e';
      case 'RESERVADO':
        return '#f59e0b';
      case 'VENDIDO':
        return '#6b7280';
      default:
        return '#9ca3af';
    }
  }

  irAChat(conv: any) {
    this.router.navigate(['/mensajes']);
  }
}
