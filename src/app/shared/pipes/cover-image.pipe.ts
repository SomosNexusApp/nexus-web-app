import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'coverImage',
  standalone: true
})
export class CoverImagePipe implements PipeTransform {
  transform(item: any, fallback: string = '/assets/placeholder-image.webp'): string {
    if (!item) return fallback;
    if (item.imagenPrincipal) return item.imagenPrincipal;
    if (item.galeriaImagenes && item.galeriaImagenes.length > 0) return item.galeriaImagenes[0];
    return fallback;
  }
}
