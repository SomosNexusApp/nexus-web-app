import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Para búsquedas si las añadimos
import { Router } from '@angular/router';

// Servicios
import { UsuarioService } from '../../services/usuario-service';
import { OfertaService } from '../../services/oferta-service';
import { ProductoService } from '../../services/producto-service';
import { NexusItem } from '../../models/nexus-item';

// Componentes
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private ofertaService = inject(OfertaService);
  private productoService = inject(ProductoService);
  private router = inject(Router);

  // Estado de la vista
  activeTab: 'usuarios' | 'ofertas' | 'productos' = 'usuarios';
  loading: boolean = false;
  
  // Datos
  usuarios: any[] = []; // Usamos any por flexibilidad, idealmente Usuario[]
  ofertas: any[] = [];
  productos: any[] = [];

  ngOnInit(): void {
    this.cargarDatosTabActual();
  }

  cambiarTab(tab: 'usuarios' | 'ofertas' | 'productos'): void {
    this.activeTab = tab;
    this.cargarDatosTabActual();
  }

  cargarDatosTabActual(): void {
    this.loading = true;
    switch (this.activeTab) {
      case 'usuarios':
        this.usuarioService.getAll().subscribe({
          next: (data) => { this.usuarios = data; this.loading = false; },
          error: () => this.loading = false
        });
        break;
      case 'ofertas':
        this.ofertaService.getAll().subscribe({
          next: (data) => { this.ofertas = data; this.loading = false; },
          error: () => this.loading = false
        });
        break;
      case 'productos':
        this.productoService.getAll().subscribe({
          next: (data) => { this.productos = data; this.loading = false; },
          error: () => this.loading = false
        });
        break;
    }
  }

  // --- Acciones de Usuarios ---
  verificarUsuario(id: number): void {
    if(!confirm('¿Verificar usuario?')) return;
    this.usuarioService.verificar(id).subscribe(() => this.cargarDatosTabActual());
  }

  eliminarUsuario(id: number): void {
    if(!confirm('¿Eliminar usuario permanentemente?')) return;
    this.usuarioService.delete(id).subscribe(() => this.cargarDatosTabActual());
  }

  // --- Acciones de Ofertas ---
  eliminarOferta(id: number): void {
    if(!confirm('¿Borrar oferta?')) return;
    this.ofertaService.delete(id).subscribe(() => this.cargarDatosTabActual());
  }
  
  verOferta(id: number): void {
    this.router.navigate(['/oferta', id]);
  }

  // --- Acciones de Productos ---
  eliminarProducto(id: number): void {
    if(!confirm('¿Borrar producto?')) return;
    this.productoService.delete(id).subscribe(() => this.cargarDatosTabActual());
  }

  verProducto(id: number): void {
    this.router.navigate(['/producto', id]);
  }
}