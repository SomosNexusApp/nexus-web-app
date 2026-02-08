import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

// Servicios
import { UsuarioService } from '../../services/usuario-service';
import { Usuario } from '../../models/actor';

// Componentes UI
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../components/empty-state/empty-state';

@Component({
  selector: 'app-cerca',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './cerca.html',
  styleUrls: ['./cerca.css']
})
export class CercaComponent {
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  busqueda: string = '';
  usuariosEncontrados: Usuario[] = [];
  loading: boolean = false;
  busquedaRealizada: boolean = false;

  /**
   * Intenta obtener la ciudad aproximada (Simulado)
   * En una app real, usarías Google Maps API o OpenStreetMap para hacer Reverse Geocoding
   */
  usarMiUbicacion(): void {
    if (!navigator.geolocation) {
      alert('La geolocalización no es soportada por tu navegador');
      return;
    }

    this.loading = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // AQUÍ SIMULAMOS el Reverse Geocoding ya que no tenemos API Key externa
        // En producción: llamar a un servicio que convierta coords -> ciudad
        console.log('Coords:', position.coords);
        
        // Simulamos que estamos en "Madrid" o "Barcelona" aleatoriamente para la demo
        const ciudadesDemo = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'];
        this.busqueda = ciudadesDemo[Math.floor(Math.random() * ciudadesDemo.length)];
        
        this.buscar();
      },
      (error) => {
        this.loading = false;
        console.error(error);
        alert('No pudimos obtener tu ubicación. Por favor ingrésala manualmente.');
      }
    );
  }

  buscar(): void {
    if (!this.busqueda.trim()) return;

    this.loading = true;
    this.busquedaRealizada = true;
    this.usuariosEncontrados = [];

    this.usuarioService.getByUbicacion(this.busqueda).subscribe({
      next: (data) => {
        this.usuariosEncontrados = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error buscando por ubicación', err);
        this.loading = false;
      }
    });
  }

  verPerfil(usuarioId: number): void {
    // Asumimos que existe una ruta para ver el perfil público de otro usuario
    // Si no tienes esa ruta, podrías redirigir a una página de productos filtrados por usuario
    // this.router.navigate(['/perfil-publico', usuarioId]); 
    console.log('Navegar a perfil de:', usuarioId);
  }
}