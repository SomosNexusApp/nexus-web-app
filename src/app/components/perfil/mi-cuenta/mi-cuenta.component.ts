import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../../core/auth/auth-store';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/enviroment';
import { CurrencyEsPipe } from '../../../shared/pipes/currency-es.pipe';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ViewChild } from '@angular/core';

import { CoverImagePipe } from '../../../shared/pipes/cover-image.pipe';
import { ProductoCardComponent } from '../../../shared/components/marketplace/product-card/producto-card.component';
import { MisComprasComponent } from '../../compras/mis-compras/mis-compras.component';
import { ConversacionesListComponent } from '../../mensajes/conversaciones-list/conversaciones-list';
import { PagosComponent } from '../pagos/pagos.component';
import { ConfiguracionComponent } from '../configuracion/configuracion.component';

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
    ConfirmModalComponent,
    ConfiguracionComponent,
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
  private toast = inject(ToastService);

  @ViewChild('confirmDeleteModal') confirmDeleteModal!: ConfirmModalComponent;
  @ViewChild('logoutModal') logoutModal!: ConfirmModalComponent;
  private idToDelete: number | null = null;
  private typeToDelete: 'producto' | 'oferta' | null = null;

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

  // Ayuda FAQs
  faqs = [
    {
      q: '¿Cómo publico un producto de forma efectiva?',
      a: 'Haz clic en el botón "Publicar" en la cabecera. Te recomendamos usar fotos con luz natural, una descripción detallada y etiquetas relevantes para que los algoritmos de Nexus te posicionen mejor.',
    },
    {
      q: '¿Qué es el Sistema de Protección Nexus?',
      a: 'Es nuestro escudo de seguridad que retiene el pago hasta que el comprador confirma que el producto es correcto. Si hay algún problema, nuestro equipo de soporte intervendrá para mediar.',
    },
    {
      q: '¿Quién se hace cargo de los gastos de envío?',
      a: 'Por defecto, los gastos de envío los asume el comprador, a menos que el vendedor decida ofrecer "Envío Gratuito" como promoción especial en su anuncio.',
    },
    {
      q: '¿Cuándo recibiré el dinero de mi venta?',
      a: 'Una vez que el comprador recibe el paquete y confirma que todo está correcto (o pasan 48h desde la entrega sin disputas), el saldo se liberará en tu Monedero Nexus y podrás transferirlo a tu banco.',
    },
    {
      q: '¿Cómo puedo verificar mi perfil para ganar confianza?',
      a: 'Puedes verificar tu identidad en la sección de Configuración > Seguridad. Un perfil verificado con el sello azul genera hasta un 40% más de ventas.',
    },
    {
      q: '¿Qué hago si recibo un producto que no coincide?',
      a: 'No confirmes la recepción. Abre una disputa desde el chat del pedido adjuntando fotos del problema. Nuestro equipo revisará el caso en menos de 24 horas.',
    },
    {
      q: '¿Puedo cancelar una venta ya aceptada?',
      a: 'Sí, pero te recomendamos hacerlo solo en casos excepcionales. Las cancelaciones frecuentes pueden afectar negativamente a tu valoración de vendedor.',
    },
    {
      q: '¿Cómo funcionan los destacados de Nexus?',
      a: 'Puedes potenciar tus anuncios para que aparezcan en las primeras posiciones de búsqueda y en el feed principal. Consulta los planes disponibles al editar tu producto.',
    },
    {
      q: '¿Cómo cambio mi cuenta a nivel Profesional/Empresa?',
      a: 'Ve a Configuración > Tipo de Cuenta. La cuenta de empresa te permite subir stock ilimitado, acceder a analíticas avanzadas y emitir facturas legales.',
    },
    {
      q: '¿Nexus cobra comisiones por cada venta?',
      a: 'Somos transparentes: Nexus solo cobra una pequeña comisión de gestión para mantener la plataforma y el sistema de pagos seguros. No hay cuotas mensuales para usuarios particulares.',
    },
  ];
  faqOpen = signal<number>(-1);

  // Modal
  showLogoutModal = signal(false);
  showDeleteModal = signal(false);

  // Computed
  user = this.authStore.user;
  hasEnoughData = computed(() => {
    const total = (this.kpis().ventas || 0) + (this.kpis().compras || 0);
    return total >= 3;
  });

  statsByType = computed(() => {
    const ps = this.misProductos();
    const map: any = {};
    ps.forEach((p) => {
      const cat = p.categoria || 'Otros';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: (value as number) }));
  });

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
        // Ahora usa el componente embebido directamente
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
    this.idToDelete = productoId;
    this.typeToDelete = 'producto';
    this.confirmDeleteModal.open();
  }

  confirmAction() {
    if (!this.idToDelete || !this.typeToDelete) return;

    const url = this.typeToDelete === 'producto' 
      ? `${environment.apiUrl}/producto/${this.idToDelete}`
      : `${environment.apiUrl}/oferta/${this.idToDelete}`;

    this.http.delete(url).subscribe({
      next: () => {
        if (this.typeToDelete === 'producto') {
          this.misProductos.update((ps) => ps.filter((p) => p.id !== this.idToDelete));
          this.toast.success('Producto eliminado');
        } else {
          this.misOfertas.update((os) => os.filter((o) => o.id !== this.idToDelete));
          this.toast.success('Oferta eliminada');
        }
        this.idToDelete = null;
        this.typeToDelete = null;
      },
      error: () => this.toast.error('Error al eliminar')
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
    this.idToDelete = ofertaId;
    this.typeToDelete = 'oferta';
    this.confirmDeleteModal.open();
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

  // ── FAQs ─────────────────────────────────
  toggleFaq(index: number) {
    this.faqOpen.set(this.faqOpen() === index ? -1 : index);
  }

  confirmarLogout() {
    this.logoutModal.open();
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
