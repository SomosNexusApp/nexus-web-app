import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../hero/hero'; 
import { ProductCardComponent } from '../product-card/product-card';
import { FeedService } from '../../services/feed-service';
import { NexusItem } from '../../models/nexus-item';
import { Oferta } from '../../guard/oferta';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeroComponent, ProductCardComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  activeFilter: 'all' | 'deals' | 'secondhand' = 'all';
  allItems: NexusItem[] = [];
  isLoading = true;

  constructor(private feedService: FeedService) {}

  ngOnInit() {
    this.cargarFeed();
  }

  cargarFeed() {
    this.isLoading = true;
    this.feedService.getUnifiedFeed().subscribe({
      next: (data) => {
        this.allItems = data;
        this.isLoading = false;
        console.log('Feed cargado:', data); // Para depurar
      },
      error: (err) => {
        console.error('Error cargando feed:', err);
        this.isLoading = false;
      }
    });
  }

  get filteredProducts() {
    if (this.activeFilter === 'all') return this.allItems;
    
    return this.allItems.filter(item => {
      // Chequeo seguro si es oferta
      const esOferta = (item as Oferta).precioOferta !== undefined;
      
      if (this.activeFilter === 'deals') return esOferta;
      if (this.activeFilter === 'secondhand') return !esOferta;
      return true;
    });
  }

  setFilter(filter: 'all' | 'deals' | 'secondhand') {
    this.activeFilter = filter;
  }
}