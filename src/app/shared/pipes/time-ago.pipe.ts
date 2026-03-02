import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true,
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date | undefined | null): string {
    if (!value) return '';

    const date = new Date(value);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 29) return 'Ahora mismo';

    const intervals: { [key: string]: number } = {
      año: 31536000,
      mes: 2592000,
      semana: 604800,
      día: 86400,
      hora: 3600,
      minuto: 60,
      segundo: 1,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);

      if (interval >= 1) {
        if (unit === 'día' && interval === 1) return 'Ayer';

        // Pluralización básica
        let pluralUnit = unit;
        if (interval > 1) {
          if (unit === 'mes') pluralUnit = 'meses';
          else if (unit !== 'mes') pluralUnit = unit + 's';
        }

        return `Hace ${interval} ${pluralUnit}`;
      }
    }

    return 'Hace un momento';
  }
}
