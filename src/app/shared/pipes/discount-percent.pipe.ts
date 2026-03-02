import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'discountPercent',
  standalone: true,
})
export class DiscountPercentPipe implements PipeTransform {
  transform(
    precioActual: number | null | undefined,
    precioOriginal: number | null | undefined,
  ): number {
    if (!precioOriginal || precioOriginal <= 0 || !precioActual) return 0;
    if (precioActual >= precioOriginal) return 0;

    const diff = precioOriginal - precioActual;
    const percent = (diff / precioOriginal) * 100;

    return Math.round(percent);
  }
}
