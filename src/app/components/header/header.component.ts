// src/app/components/header/header.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  isLoggedIn = false;

  navLinks = [
    { label: 'Categorías', route: '/categorias' },
    { label: 'Ofertas Flash', route: '/ofertas' },
    { label: 'Vehículos', route: '/vehiculos' },
    { label: 'Cerca de ti', route: '/cerca' },
  ];
}
