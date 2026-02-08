import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Servicios y Modelos
import { FavoritoService } from '../../services/favorito-service';
import { AuthService } from '../../services/auth-service'; // Asumo que existe y tiene el estado del usuario
import { Favorito } from '../../models/favorito';
import { NexusItem } from '../../models/nexus-item';

// Componentes UI
import { ProductCardComponent } from '../../components/product-card/product-card';
import { EmptyState } from '../../components/empty-state/empty-state';
import { LoadingSpinner } from '../../components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink,
    ProductCardComponent, // Reutilizamos la tarjeta para productos
    // VehiculoCardComponent, // Si tienes una para vehículos, impórtala aquí
    EmptyState,
    LoadingSpinner
  ],
  templateUrl: './favoritos.html',
  styleUrls: ['./favoritos.css']
})
export class FavoritosComponent implements OnInit {
  private favoritoService = inject(FavoritoService);
  private authService = inject(AuthService);

  favoritos: Favorito[] = [];
  loading: boolean = true;
  error: string | null = null;
  userId: number | null = null;

  ngOnInit(): void {
    // Obtenemos el ID del usuario actual (Lógica simulada, ajusta según tu AuthService real)
    const currentUser = this.authService.currentUserValue; 
    
    if (currentUser && currentUser.id) {
      this.userId = currentUser.id;
      this.cargarFavoritos();
    } else {
      this.loading = false;
      this.error = 'Debes iniciar sesión para ver tus favoritos.';
    }
  }

  cargarFavoritos(): void {
    this.loading = true;
    if (!this.userId) return;

    this.favoritoService.getByUsuario(this.userId).subscribe({
      next: (data) => {
        this.favoritos = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando favoritos', err);
        this.error = 'Ocurrió un error al cargar tus favoritos.';
        this.loading = false;
      }
    });
  }

  /**
   * Elimina un favorito de la lista y del backend
   */
  eliminarFavorito(idFavorito: number, event: Event): void {
    event.stopPropagation(); // Evitar navegar al detalle
    event.preventDefault();

    if (!confirm('¿Estás seguro de que deseas eliminar este favorito?')) return;

    this.favoritoService.eliminar(idFavorito).subscribe({
      next: () => {
        this.favoritos = this.favoritos.filter(f => f.id !== idFavorito);
      },
      error: (err) => {
        console.error('Error eliminando favorito', err);
        // Aquí podrías mostrar un toast/notificación
      }
    });
  }

  // Helper para extraer el item real (Producto u Oferta) del wrapper Favorito
  getNexusItem(fav: Favorito): any {
    if (fav.producto) return fav.producto;
    if (fav.oferta) return fav.oferta;
    return null;
  }
}