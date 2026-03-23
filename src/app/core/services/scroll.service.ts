import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {
  private originalOverflow: string = '';

  lock(): void {
    this.originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  unlock(): void {
    document.body.style.overflow = this.originalOverflow || 'auto';
  }
}
