import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth-store';
import { GuestPopupService } from '../../../core/services/guest-popup.service';

interface ProductSlide {
  user: string;
  avatar: string;
  price: string;
  image: string;
  badge: string;
  badgeIconColor: string;
  title: string;
  rating: string;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css'],
})
export class HeroComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authStore = inject(AuthStore);
  private guestPopupService = inject(GuestPopupService);

  slides: ProductSlide[] = [
    {
      user: '@Malegro32',
      // Foto de perfil real
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      price: '299€',
      image:
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1000&auto=format&fit=crop',
      badge: 'Venta Rápida',
      badgeIconColor: '#FFD700',
      title: 'Sony WH-1000XM5 Black',
      rating: '★★★★★',
    },
    {
      user: '@CarlosTech',
      // Foto de perfil real
      avatar:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80',
      price: '1.250€',
      image:
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop',
      badge: 'Premium',
      badgeIconColor: '#A8B4FF',
      title: 'Leica M11 Vintage Edition',
      rating: '★★★★★',
    },
    {
      user: '@LauraStyle',
      // Foto de perfil real
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
      price: '185€',
      image:
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop',
      badge: 'Exclusivo',
      badgeIconColor: '#FF69B4',
      title: 'Air Jordan 1 Retro High',
      rating: '★★★★☆',
    },
  ];

  currentIndex = 0;
  private autoPlayInterval: any;

  ngOnInit(): void {
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  startAutoPlay(): void {
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  nextSlide(): void {
    this.currentIndex = (this.currentIndex + 1) % this.slides.length;
  }

  prevSlide(): void {
    this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
  }

  goToSlide(index: number): void {
    this.currentIndex = index;
    this.stopAutoPlay();
    this.startAutoPlay();
  }

  onSellNowClick(): void {
    if (this.authStore.isLoggedIn()) {
      this.router.navigate(['/publicar']);
    } else {
      this.guestPopupService.showPopup('Regístrate para empezar a vender en Nexus');
    }
  }

  onExploreClick(): void {
    this.router.navigate(['/search']);
  }
}
