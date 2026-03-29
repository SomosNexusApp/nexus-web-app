import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';

export interface BannerPublic {
  contratoId: number;
  tipoContrato: string;
  textoBanner: string;
  urlClick?: string;
  productoId?: number;
  empresaNombre?: string;
}

@Component({
  selector: 'app-patrocinios-strip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patrocinios-strip.component.html',
  styleUrl: './patrocinios-strip.component.css',
})
export class PatrociniosStripComponent implements OnInit {
  private http = inject(HttpClient);
  banners = signal<BannerPublic[]>([]);

  ngOnInit(): void {
    this.http.get<BannerPublic[]>(`${environment.apiUrl}/api/public/publicidad/banners`).subscribe({
      next: (list) => this.banners.set(list || []),
      error: () => this.banners.set([]),
    });
  }
}
