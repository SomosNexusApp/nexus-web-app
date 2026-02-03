import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.html',
  styleUrls: ['./hero.css']
})
export class HeroComponent {
  stats = [
    { value: '25k+', label: 'Ofertas Activas' },
    { value: '10k+', label: 'Usuarios' },
    { value: '4.9', label: 'Valoración' }
  ];
}