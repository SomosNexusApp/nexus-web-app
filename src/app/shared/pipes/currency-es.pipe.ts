import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyEs',
  standalone: true,
})
export class CurrencyEsPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value == null || value === '') return '';

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';

    // Usamos el API nativa de internacionalización del navegador
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }
}
