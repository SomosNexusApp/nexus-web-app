import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'coverImage',
  standalone: true
})
export class CoverImagePipe implements PipeTransform {
  // Imagen de placeholder profesional de Nexus
  private readonly FALLBACK = 'https://images.unsplash.com/photo-1555421689-491a97ff2040?q=80&w=1000&auto=format&fit=crop';

  transform(item: any, fallback?: string): string {
    if (!item) return fallback || this.FALLBACK;
    
    // Prioridad: Imagen Principal > Primera de Galería > Fallback
    if (item.imagenPrincipal && item.imagenPrincipal.length > 5) {
      return item.imagenPrincipal;
    }
    
    if (item.galeriaImagenes && item.galeriaImagenes.length > 0) {
      return item.galeriaImagenes[0];
    }
    
    return fallback || this.FALLBACK;
  }
}
