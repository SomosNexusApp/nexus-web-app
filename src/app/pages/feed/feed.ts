// src/app/pages/feed/feed.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../components/hero/hero';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { FeedService } from '../../services/feed-service';
import { Oferta } from '../../models/oferta';
import { Producto } from '../../models/producto';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, HeroComponent, ProductCardComponent],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css']
})
export class FeedComponent implements OnInit {
  activeFilter: 'all' | 'deals' | 'secondhand' = 'all';
  ofertas: Oferta[] = [];
  productos: Producto[] = [];
  isLoading = true;

  constructor(private feedService: FeedService) {}

  ngOnInit() {
    this.cargarFeed();
  }

  cargarFeed() {
    this.isLoading = true;
    this.feedService.getFeedPrincipal().subscribe({
      next: (data) => {
        this.ofertas = data.filter(item => item.tipo === 'oferta').map(item => item.data) as Oferta[];
        this.productos = data.filter(item => item.tipo === 'producto').map(item => item.data) as Producto[];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando feed:', err);
        this.isLoading = false;
      }
    });
  }

  get filteredItems() {
    if (this.activeFilter === 'all') {
      return [...this.ofertas, ...this.productos];
    } else if (this.activeFilter === 'deals') {
      return this.ofertas;
    } else {
      return this.productos;
    }
  }

  setFilter(filter: 'all' | 'deals' | 'secondhand') {
    this.activeFilter = filter;
  }
}