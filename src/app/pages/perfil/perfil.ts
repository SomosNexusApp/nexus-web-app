import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { UsuarioService } from '../../services/usuario-service';
import { ProductoService } from '../../services/producto-service';
import { OfertaService } from '../../services/oferta-service';
import { Usuario } from '../../models/actor';
import { Producto } from '../../models/producto';
import { Oferta } from '../../models/oferta';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css']
})
export class PerfilComponent implements OnInit {
  usuario: Usuario | null = null;
  misProductos: Producto[] = [];
  misOfertas: Oferta[] = [];
  isLoading = true;
  editMode = false;
  
  stats = {
    productosPublicados: 0,
    ofertasPublicadas: 0,
    reputacion: 0,
    ventas: 0
  };

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private productoService: ProductoService,
    private ofertaService: OfertaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarPerfil();
  }

  cargarPerfil() {
    const userId = this.authService.getUserId();
    
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;

    this.usuarioService.getById(userId).subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.stats.reputacion = usuario.reputacion || 0;
        this.isLoading = false;
        
        // Cargar productos y ofertas del usuario
        this.cargarMisPublicaciones(userId);
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading = false;
      }
    });
  }

  cargarMisPublicaciones(userId: number) {
    // Cargar productos
    this.productoService.getByUsuario(userId).subscribe({
      next: (productos) => {
        this.misProductos = productos;
        this.stats.productosPublicados = productos.length;
      },
      error: (err) => console.error('Error productos:', err)
    });

    // Cargar ofertas (si el usuario es empresa o ha publicado ofertas)
    // Esto depende de tu lógica de backend
  }

  guardarCambios() {
    if (!this.usuario) return;

    this.usuarioService.update(this.usuario.id, {
      user: this.usuario.user,
      email: this.usuario.email,
      telefono: this.usuario.telefono,
      biografia: this.usuario.biografia,
      ubicacion: this.usuario.ubicacion
    }).subscribe({
      next: () => {
        alert('Perfil actualizado correctamente');
        this.editMode = false;
      },
      error: (err) => {
        console.error('Error:', err);
        alert('Error al actualizar perfil');
      }
    });
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  subirAvatar(event: any) {
    const file = event.target.files[0];
    if (!file || !this.usuario) return;

    this.usuarioService.uploadAvatar(this.usuario.id, file).subscribe({
      next: (response) => {
        if (this.usuario) {
          this.usuario.avatar = response.url;
          alert('Avatar actualizado');
        }
      },
      error: (err) => {
        console.error('Error:', err);
        alert('Error al subir avatar');
      }
    });
  }
}