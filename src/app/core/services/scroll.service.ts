import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {
  private originalOverflow: string = '';
  private lockCount: number = 0;

  lock(): void {
    if (this.lockCount === 0) {
      this.originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    this.lockCount++;
  }

  unlock(): void {
    if (this.lockCount > 0) {
      this.lockCount--;
      if (this.lockCount === 0) {
        document.body.style.overflow = this.originalOverflow || '';
      }
    }
  }
}
