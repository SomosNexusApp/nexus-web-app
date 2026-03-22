import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="star-rating" [class.interactive]="interactive">
      <svg width="0" height="0" class="defs-only">
        <defs>
          <linearGradient id="half-fill" x1="0" x2="1" y1="0" y2="0">
            <stop offset="50%" stop-color="currentColor" />
            <stop offset="50%" stop-color="transparent" />
          </linearGradient>
        </defs>
      </svg>
      @for (star of [1, 2, 3, 4, 5]; track $index; let i = $index) {
        <svg
          class="star-icon"
          [attr.fill]="getFill(i)"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          (click)="interactive ? setRating(i + 1) : null"
          (mouseenter)="interactive ? hoverRating = i + 1 : null"
          (mouseleave)="interactive ? hoverRating = 0 : null"
          viewBox="0 0 24 24"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      }
    </div>
  `,
  styles: [`
    .star-rating {
      display: inline-flex;
      gap: 4px;
      color: #9ca3af; /* Empty star color (gray-400) */
    }
    .star-icon {
      width: 24px;
      height: 24px;
      transition: all 0.2s ease;
    }
    .defs-only {
      position: absolute;
      width: 0;
      height: 0;
      opacity: 0;
    }
    /* When filled or half filled, we use a gold/yellow color */
    .star-icon[fill="currentColor"], 
    .star-icon[fill="url(#half-fill)"] {
      color: #fbbf24; /* yellow-400 */
    }
    .interactive .star-icon {
      cursor: pointer;
    }
    .interactive .star-icon:hover {
      transform: scale(1.1);
    }
  `]
})
export class StarRatingComponent {
  @Input() rating: number = 0;
  @Input() interactive: boolean = false;
  @Output() ratingChange = new EventEmitter<number>();
  
  hoverRating: number = 0;
  
  getFill(index: number): string {
    const r = this.hoverRating || this.rating;
    if (r >= index + 1) return 'currentColor'; // Full
    if (r >= index + 0.5) return 'url(#half-fill)'; // Half
    return 'none'; // Empty
  }
  
  setRating(val: number) {
    if (!this.interactive) return;
    this.rating = val;
    this.ratingChange.emit(this.rating);
  }
}
