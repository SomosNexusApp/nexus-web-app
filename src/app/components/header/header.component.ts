import { Component, inject, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, Subject, takeUntil } from 'rxjs';

import { AuthStore } from '../../core/auth/auth-store';
import { AuthService } from '../../core/auth/auth.service';
import { GuestPopupService } from '../../core/services/guest-popup.service';
import { CategoriaPanelComponent } from '../../shared/components/categoria-panel/categoria-panel.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ViewChild } from '@angular/core';

interface NavLink {
  label: string;
  route: string;
  queryParams?: Record<string, string>;
  icon: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, CategoriaPanelComponent, ConfirmModalComponent, AvatarComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authStore = inject(AuthStore);
  private authService = inject(AuthService);
  private guestPopup = inject(GuestPopupService);
  private router = inject(Router);

  private destroy$ = new Subject<void>();

  // Signals del store
  readonly isLoggedIn = this.authStore.isLoggedIn;
  readonly usuario = this.authStore.user;

  // UI state
  readonly notifCount = signal(3);
  readonly isUserDropdownOpen = signal(false);

  // Buscador
  searchControl = new FormControl('');

  // Categorias
  readonly isCategoriasPanelOpen = signal(false);

  @ViewChild('logoutModal') logoutModal!: ConfirmModalComponent;

  navLinks: NavLink[] = [
    { label: 'Categorías', route: '/categorias', icon: 'grid' },
    { label: 'Ofertas Flash', route: '/ofertas', icon: 'flash' },
    {
      label: 'Vehículos',
      route: '/vehiculos',
      icon: 'car',
    },
    { label: 'Cerca de ti', route: '/cerca', icon: 'pin' },
    { label: 'Gratis', route: '/gratis', icon: 'gift' },
  ];

  ngOnInit() {
    // ── Sincronizar input con la URL al navegar ──────────────────────────────
    // Usamos Router.events porque el Header está en el app-shell (fuera del outlet)
    // y ActivatedRoute allí apunta a la ruta raíz, no a la ruta activa hija.
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        const urlTree = this.router.parseUrl(this.router.url);
        const q = (urlTree.queryParams['q'] as string) ?? '';
        // Solo actualizar si el valor es diferente para no re-disparar valueChanges
        if (this.searchControl.value !== q) {
          this.searchControl.setValue(q, { emitEvent: false });
        }
      });

    // ── Búsqueda con debounce ────────────────────────────────────────────────
    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.ejecutarBusqueda(value ?? '');
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleCategoriasPanel(): void {
    this.isCategoriasPanelOpen.update((v) => !v);
  }

  ejecutarBusqueda(query: string) {
    const q = query.trim();
    if (q) {
      // Navegar a search preservando sólo 'q' y limpiando filtros anteriores
      // (si quieres preservar otros queryParams, cambia a 'merge')
      this.router.navigate(['/search'], { queryParams: { q } });
    } else if (this.router.url.startsWith('/search')) {
      // Si estamos en search y vaciamos el input, limpiar q
      this.router.navigate(['/search'], {
        queryParams: { q: null },
        queryParamsHandling: 'merge',
      });
    }
  }

  limpiarBuscador() {
    this.searchControl.setValue('');
  }

  // ── Dropdown usuario ────────────────────────────────────────────────────────

  toggleUserDropdown(event: Event) {
    event.stopPropagation();
    this.isUserDropdownOpen.update((v) => !v);
  }

  @HostListener('document:click')
  closeDropdown() {
    this.isUserDropdownOpen.set(false);
  }

  // ── Acciones ────────────────────────────────────────────────────────────────

  onPublicarClick() {
    if (this.isLoggedIn()) {
      this.router.navigate(['/publicar']);
    } else {
      this.guestPopup.showPopup('Para publicar necesitas una cuenta');
    }
  }

  onFavoritosClick() {
    if (this.isLoggedIn()) {
      this.router.navigate(['/perfil'], { queryParams: { tab: 'favoritos' } });
    } else {
      this.guestPopup.showPopup('Para guardar favoritos');
    }
  }

  logout() {
    this.logoutModal.open();
  }

  confirmLogout() {
    this.authService.logout();
  }

  getIniciales(nombre?: string, apellidos?: string): string {
    let i = '';
    if (nombre) i += nombre.charAt(0).toUpperCase();
    if (apellidos) i += apellidos.charAt(0).toUpperCase();
    return i || 'U';
  }

  /** Indica si un navLink está activo (incluyendo queryParams para Vehículos). */
  isNavActive(link: NavLink): boolean {
    const url = this.router.url;
    if (link.queryParams) {
      // Para Vehículos: activo si estamos en /search?tipo=VEHICULO
      const tree = this.router.parseUrl(url);
      return (
        url.startsWith(link.route) &&
        Object.entries(link.queryParams).every(([k, v]) => tree.queryParams[k] === v)
      );
    }
    return url.startsWith(link.route);
  }
}
