import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-publicar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publicar.html',
  styleUrls: ['./publicar.css']
})
export class PublicarComponent {
  paso: number = 1;
  
  producto = {
    titulo: '',
    descripcion: '',
    precio: null as number | null,
    categoria: '',
    tipoOferta: 'VENTA',
    imagenPrincipal: null as File | null,
    galeria: [] as File[]
  };

  imagenPrincipalPreview: string | null = null;
  galeriaPreview: string[] = [];

  categorias = ['Electrónica', 'Moda', 'Hogar', 'Deportes', 'Juguetes', 'Libros', 'Vehículos', 'Otros'];
  
  constructor(private router: Router) {}

  onImagenPrincipalChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.producto.imagenPrincipal = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPrincipalPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onGaleriaChange(event: any) {
    const files = Array.from(event.target.files) as File[];
    
    if (this.producto.galeria.length + files.length > 5) {
      alert('Máximo 5 imágenes en la galería');
      return;
    }

    this.producto.galeria.push(...files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.galeriaPreview.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  eliminarImagenGaleria(index: number) {
    this.producto.galeria.splice(index, 1);
    this.galeriaPreview.splice(index, 1);
  }

  siguiente() {
    if (this.paso === 1) {
      if (!this.producto.titulo || !this.producto.descripcion || !this.producto.precio) {
        alert('Completa todos los campos básicos');
        return;
      }
    }
    
    if (this.paso === 2) {
      if (!this.producto.imagenPrincipal) {
        alert('Debes subir al menos una imagen principal');
        return;
      }
    }
    
    this.paso++;
  }

  anterior() {
    this.paso--;
  }

  publicar() {
    // Aquí conectar con ProductoService
    console.log('Publicando producto:', this.producto);
    alert('¡Producto publicado exitosamente!');
    this.router.navigate(['/productos']);
  }
}