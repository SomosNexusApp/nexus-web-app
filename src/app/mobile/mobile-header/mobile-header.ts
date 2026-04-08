import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthStore } from '../../core/auth/auth-store';
import { NotificationService } from '../../core/services/notification.service';
import { SearchService } from '../../core/services/search.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-mobile-header',
  templateUrl: './mobile-header.html',
  styleUrls: ['./mobile-header.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileHeader {
  private router = inject(Router);
  public authStore = inject(AuthStore);
  public notificationService = inject(NotificationService);
  public searchService = inject(SearchService);

  searchControl = new FormControl('');

  constructor() {
    this.searchControl.valueChanges.subscribe(val => {
       this.searchService.searchTerm.set(val || '');
    });
  }

  ejecutarBusqueda() {
    const term = this.searchControl.value;
    if (term?.trim()) {
      if (this.router.url !== '/') {
        this.router.navigate(['/search'], { queryParams: { q: term } });
      }
    }
  }

  onProfileClick() {
    if (this.authStore.isLoggedIn()) {
      this.router.navigate(['/perfil']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  onNotifClick() {
    this.router.navigate(['/notificaciones']);
  }
}
