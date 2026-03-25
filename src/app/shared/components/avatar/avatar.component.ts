import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImgFallbackDirective } from '../../directives/img-fallback.directive';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule, ImgFallbackDirective],
  template: `
    <div 
      class="avatar-container" 
      [class.has-border]="border"
      [class.has-shadow]="shadow"
      [ngClass]="customClass"
      [style.width]="size + 'px'" 
      [style.height]="size + 'px'"
    >
      @if (avatarUrl && !isBroken()) {
        <img
          [src]="avatarUrl"
          [alt]="altText"
          class="avatar-img"
          appImgFallback
          [skipDefaultFallback]="true"
          (fallbackTriggered)="onFallback()"
        />
      } @else {
        <div class="avatar-initials" [style.font-size]="fontSize() + 'px'">
          {{ iniciales() }}
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
      line-height: 0;
    }
    .avatar-container {
      position: relative;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: rgba(255, 255, 255, 0.05);
    }
    .avatar-container.has-border {
      border: 2px solid #fff;
    }
    .avatar-container.has-shadow {
      box-shadow: 0 2px 15px rgba(0,0,0,0.3);
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .avatar-initials {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--gradient-primary);
      color: #000;
      font-weight: 800;
      text-transform: uppercase;
      user-select: none;
      font-family: var(--font-display);
      letter-spacing: -0.5px;
    }
  `]
})
export class AvatarComponent {
  @Input() avatarUrl: string | null | undefined = null;
  @Input() nombre: string | null | undefined = null;
  @Input() username: string | null | undefined = null;
  @Input() size = 40;
  @Input() altText = 'Avatar';
  @Input() border = false;
  @Input() shadow = false;
  @Input() customClass = '';

  isBroken = signal<boolean>(false);

  fontSize = computed(() => this.size * 0.45);

  iniciales = computed(() => {
    const name = this.nombre?.trim();
    if (name) {
      const parts = name.split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    
    const user = this.username?.trim();
    if (user) {
      return user.slice(0, 2).toUpperCase();
    }
    
    return '?';
  });

  onFallback() {
    this.isBroken.set(true);
  }
}
