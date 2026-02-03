import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../hero/hero';
import { ProductCardComponent } from '../product-card/product-card';
import { NexusService } from '../../services/nexus.service';
import { NexusItem, Oferta } from '../../models/nexus.types';

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

  constructor(private nexusService: NexusService) { }

  ngOnInit() {
    this.cargarFeed();
  }

  cargarFeed() {
    this.isLoading = true;
    this.nexusService.getFeedUnificado().subscribe({
      next: (data) => {
        this.allItems = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando feed:', err);
        this.isLoading = false;
        // Aquí podrías poner datos falsos de respaldo si falla el backend
      }
    });
  }

  get filteredProducts() {
    if (this.activeFilter === 'all') return this.allItems;

    return this.allItems.filter(item => {
      // Detectamos si es oferta comprobando una propiedad exclusiva
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