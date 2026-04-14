import { Component, AfterViewInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';

/**
 * Banner inferior AdSense.
 * Configura en `src/environments/environment.ts`:
 * - adsenseClient: ca-pub-XXXXXXXX (ID de editor de Google AdSense)
 * - adsenseSlotFooter: ID del bloque de anuncios (data-ad-slot)
 * Añade en index.html la etiqueta script de página de AdSense (ver comentario en index.html).
 */
@Component({
  selector: 'app-adsense-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adsense-footer.component.html',
  styleUrl: './adsense-footer.component.css',
})
export class AdsenseFooterComponent implements AfterViewInit {
  private platformId = inject(PLATFORM_ID);

  readonly client = environment.adsenseClient || '';
  readonly slot = environment.adsenseSlotFooter || '';
  readonly enabled = !!this.client && !!this.slot;

  get isLocal(): boolean {
    return isPlatformBrowser(this.platformId) && 
           (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  }

  ngAfterViewInit(): void {
    if (!this.enabled || !isPlatformBrowser(this.platformId)) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {
      /* ignore */
    }
  }
}
