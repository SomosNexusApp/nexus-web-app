import { Component, inject, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

// Servicios reales
import { AuthStore } from '../../core/auth/auth-store';
import { AuthService } from '../../core/auth/auth.service';
import { GuestPopupService } from '../../core/services/guest-popup.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  // Inyecciones de servicios
  private authStore = inject(AuthStore);
  private authService = inject(AuthService);
  private guestPopup = inject(GuestPopupService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signals del Store (Reactividad pura)
  readonly isLoggedIn = this.authStore.isLoggedIn;
  readonly usuario = this.authStore.user;

  // Mock de notificaciones (se conectará a NotificationService más adelante)
  readonly notifCount = signal(3);

  // Estados de la interfaz
  isUserDropdownOpen = signal(false);
  isCategoriasPanelOpen = signal(false);

  // Control del buscador
  searchControl = new FormControl('');

  navLinks = [
    { label: 'Categorías', route: '/categorias' },
    { label: 'Ofertas Flash', route: '/ofertas' },
    { label: 'Vehículos', route: '/vehiculos' },
    { label: 'Cerca de ti', route: '/cerca' },
  ];

  ngOnInit() {
    // Sincronizar buscador con la URL si ya hay una búsqueda activa
    this.route.queryParams.subscribe((params) => {
      if (params['q']) {
        this.searchControl.setValue(params['q'], { emitEvent: false });
      }
    });

    // Lógica de búsqueda con debounce (300ms)
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.ejecutarBusqueda(value || '');
      });
  }

  ejecutarBusqueda(query: string) {
    const q = query.trim();
    if (q) {
      this.router.navigate(['/search'], { queryParams: { q }, queryParamsHandling: 'merge' });
    } else if (this.router.url.includes('/search')) {
      this.router.navigate(['/search'], { queryParams: { q: null }, queryParamsHandling: 'merge' });
    }
  }

  limpiarBuscador() {
    this.searchControl.setValue('');
  }

  // --- Acciones de Usuario ---

  toggleUserDropdown(event: Event) {
    event.stopPropagation();
    this.isUserDropdownOpen.update((v) => !v);
  }

  @HostListener('document:click')
  closeDropdown() {
    this.isUserDropdownOpen.set(false);
  }

  onPublicarClick() {
    if (this.isLoggedIn()) {
      // Aquí abrirías el PublicarSelectorModal
      console.log('Abriendo selector de publicación...');
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
    if (confirm('¿Cerrar sesión en Nexus?')) {
      this.authService.logout();
    }
  }

  getIniciales(nombre?: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : 'U';
  }
}
