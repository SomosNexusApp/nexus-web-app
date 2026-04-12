import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  count?: string;
  color: string;
}

@Component({
  selector: 'app-mejores-categorias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mejores-categorias.component.html',
  styleUrls: ['./mejores-categorias.component.css'],
})
export class MejoresCategoriasComponent {
  private router = inject(Router);

  categories: CategoryItem[] = [
    {
      id: '1',
      name: 'Videojuegos',
      slug: 'videojuegos',
      image: 'https://historia.nationalgeographic.com.es/medio/2024/01/05/videojuegos_86dcb1e9.jpg',
      count: '',
      color: '#6366f1',
    },
    {
      id: '2',
      name: 'Viajes',
      slug: 'viajes',
      image:
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000&auto=format&fit=crop',
      count: '',
      color: '#06b6d4',
    },
    {
      id: '3',
      name: 'Moda',
      slug: 'moda',
      image:
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop',
      count: '',
      color: '#ec4899',
    },
    {
      id: '4',
      name: 'Juguetes',
      slug: 'juguetes',
      image:
        'https://cdn.grupoelcorteingles.es/statics/manager/contents/images/uploads/2026/03/rJON4jC5We.jpeg?impolicy=Resize&width=2400&height=750',
      count: '',
      color: '#f59e0b',
    },
  ];

  navigateToCategory(slug: string) {
    this.router.navigate(['/search'], { queryParams: { categoria: slug } });
  }
}
