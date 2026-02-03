import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../hero/hero'; // Recuerda: sin .component
import { ProductCardComponent } from '../product-card/product-card';
import { NexusService } from '../../services/nexus.service';
import { NexusItem, Producto, Oferta } from '../../models/nexus.types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeroComponent, ProductCardComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  activeFilter: 'all' | 'deals' | 'secondhand' = 'all';
  
  // Arrays para almacenar los datos reales
  allItems: NexusItem[] = [];
  isLoading = true;

  constructor(private nexusService: NexusService) {}

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
        console.error('Error conectando con Spring Boot:', err);
        this.isLoading = false;
        // Aquí podrías mostrar un mensaje de error visual si quieres
      }
    });
  }

  get filteredProducts() {
    if (this.activeFilter === 'all') return this.allItems;
    
    return this.allItems.filter(item => {
      // Diferenciamos si es Oferta o Producto comprobando alguna propiedad única
      const esOferta = (item as Oferta).precioOferta !== undefined;
      
      if (this.activeFilter === 'deals') return esOferta;
      if (this.activeFilter === 'secondhand') return !esOferta;
      return true;
    });
  }

  setFilter(filter: 'all' | 'deals' | 'secondhand') {
    this.activeFilter = filter;
  }
  
  // Helper para el HTML: saber si es oferta o producto
  isOferta(item: NexusItem): boolean {
    return (item as Oferta).precioOferta !== undefined;
  }
}