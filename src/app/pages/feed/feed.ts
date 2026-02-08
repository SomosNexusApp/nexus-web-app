import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Importa los componentes STANDALONE correctamente
import { ProductCardComponent } from '../../components/product-card/product-card';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../components/empty-state/empty-state';
import { HeroComponent } from '../../components/hero/hero'; // Si usas app-hero

import { FeedService } from '../../services/feed-service';
import { NexusItem } from '../../models/nexus-item';

// Definimos el tipo de filtro
type FeedFilter = 'todos' | 'trending' | 'destacados';

@Component({
  selector: 'app-feed',
  standalone: true,
  // IMPORTANTE: Aquí importamos todo lo que usa el HTML
  imports: [
    CommonModule, 
    FormsModule,
    ProductCardComponent, 
    LoadingSpinnerComponent, 
    EmptyStateComponent,
    HeroComponent // Añadir si usas <app-hero>
  ],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css']
})
export class FeedComponent implements OnInit {
  private feedService = inject(FeedService);

  // Variables alineadas con lo que solemos usar
  items: NexusItem[] = [];
  loading: boolean = true;
  error: string | null = null;
  activeFilter: FeedFilter = 'todos';

  ngOnInit(): void {
    this.cargarFeed('todos');
  }

  // Método para cambiar filtro
  setFilter(filtro: FeedFilter): void {
    if (this.activeFilter === filtro) return;
    this.activeFilter = filtro;
    this.cargarFeed(filtro);
  }

  cargarFeed(filtro: FeedFilter): void {
    this.loading = true;
    this.items = []; // Limpiar
    
    let obs$;
    if (filtro === 'trending') obs$ = this.feedService.getFeedTrending();
    else if (filtro === 'destacados') obs$ = this.feedService.getFeedDestacados();
    else obs$ = this.feedService.getUnifiedFeed();

    obs$.subscribe({
      next: (data) => {
        this.items = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.error = 'Error cargando el feed';
      }
    });
  }
}