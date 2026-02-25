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
  // Cambia a 'true' para ver la versión con avatar
  isLoggedIn = false;

  navLinks = [
    { label: 'Categorías', route: '/categorias' },
    { label: 'Ofertas Flash', route: '/ofertas' },
    { label: 'Cupones', route: '/cupones' },
    { label: 'Cerca de ti', route: '/cerca' },
  ];
}
