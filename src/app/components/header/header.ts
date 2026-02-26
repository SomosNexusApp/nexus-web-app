// src/app/components/header/header.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class HeaderComponent {
  isLoggedIn = false;

  navLinks = [
    { label: 'Categorías', route: '/categorias' },
    { label: 'Ofertas Flash', route: '/ofertas' },
    { label: 'Vehículos', route: '/vehiculos' }, // Reemplazado Cupones por Vehículos
    { label: 'Cerca de ti', route: '/cerca' },
  ];
}
