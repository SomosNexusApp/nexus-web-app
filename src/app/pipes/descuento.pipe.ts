import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'descuento',
  standalone: true
})
export class DescuentoPipe implements PipeTransform {
  transform(precioOriginal: number, precioOferta: number): number {
    if (!precioOriginal || !precioOferta || precioOferta >= precioOriginal) {
      return 0;
    }
    return Math.round(((precioOriginal - precioOferta) / precioOriginal) * 100);
  }
}