import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SearchService, SearchParams } from '../../core/services/search.service';
import { ProductoCardComponent } from '../../shared/components/marketplace/product-card/producto-card.component';
import { OfertaCardComponent } from '../../shared/components/marketplace/oferta-card/oferta-card.component';
import { VehiculoCardComponent } from '../../shared/components/vehiculo-card/vehiculo-card.component';
import { MarketplaceItem } from '../../models/marketplace-item.model';
import { environment } from '../../../environments/enviroment';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

export type FeedTab = 'todos' | 'ofertas' | 'nuevo' | 'segunda_mano' | 'vehiculos';
export type SubTab = 'mas_votados' | 'recientes';

@Component({
  selector: 'app-mobile-feed',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ProductoCardComponent,
    OfertaCardComponent,
    VehiculoCardComponent
  ],
  templateUrl: './mobile-feed.html',
  styleUrls: ['./mobile-feed.css']
})
export class MobileFeedComponent implements OnInit {
  private searchService = inject(SearchService);
  private http = inject(HttpClient);

  // Estados
  selectedTab = signal<FeedTab>('todos');
  selectedSubTab = signal<SubTab>('mas_votados');
  items = signal<MarketplaceItem[]>([]);
  loading = signal(false);

  constructor() {
    // Al cambiar la pestaña, el sub-filtro o el texto de búsqueda, recargar
    effect(() => {
      this.selectedTab();
      this.selectedSubTab();
      this.searchService.searchTerm();
      this.fetchItems();
    }, { allowSignalWrites: true });
  }

  ngOnInit() {}

  fetchItems() {
    this.loading.set(true);
    
    const params: SearchParams = {
      q: this.searchService.searchTerm(),
      page: 0,
      size: 20,
      orden: this.selectedSubTab() === 'recientes' ? 'novedades' : 'relevancia'
    };

    // Ajustar parámetros según la pestaña
    switch (this.selectedTab()) {
      case 'ofertas':
        params.tipo = 'OFERTA';
        if (this.selectedSubTab() === 'mas_votados') {
          params.orden = 'relevancia'; // O algún filtro de votos si existe en el backend
        }
        break;
      case 'nuevo':
        params.condicion = 'NUEVO';
        break;
      case 'segunda_mano':
        params.condicion = 'BUEN_ESTADO'; // O similar para representar second hand
        break;
      case 'vehiculos':
        params.tipo = 'VEHICULO';
        break;
      default:
        params.tipo = 'TODOS';
    }

    this.searchService.buscar(params).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setTab(tab: FeedTab) {
    this.selectedTab.set(tab);
  }

  setSubTab(tab: SubTab) {
    this.selectedSubTab.set(tab);
  }
}
