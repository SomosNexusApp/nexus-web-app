// src/app/pages/categorias/categorias.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Categoria {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  count: number;
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categorias.html',
  styleUrls: ['./categorias.css']
})
export class CategoriasComponent implements OnInit {
  categorias: Categoria[] = [
    { id: 'tecnologia', nombre: 'Tecnología', icono: '💻', color: '#A8B4FF', count: 1247 },
    { id: 'moda', nombre: 'Moda', icono: '👔', color: '#CDB0E8', count: 892 },
    { id: 'hogar', nombre: 'Hogar', icono: '🏠', color: '#FF91D5', count: 634 },
    { id: 'deportes', nombre: 'Deportes', icono: '⚽', color: '#4ECDC4', count: 521 },
    { id: 'vehiculos', nombre: 'Vehículos', icono: '🚗', color: '#FFD700', count: 389 },
    { id: 'electronica', nombre: 'Electrónica', icono: '📱', color: '#FF6B6B', count: 1056 },
    { id: 'libros', nombre: 'Libros', icono: '📚', color: '#95E1D3', count: 478 },
    { id: 'juguetes', nombre: 'Juguetes', icono: '🧸', color: '#F38181', count: 312 }
  ];

  constructor(private router: Router) {}

  ngOnInit() {}

  verCategoria(categoriaId: string) {
    this.router.navigate(['/productos'], { queryParams: { categoria: categoriaId } });
  }
}