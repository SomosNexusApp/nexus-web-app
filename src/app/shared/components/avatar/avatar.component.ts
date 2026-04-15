import { Component, input, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImgFallbackDirective } from '../../directives/img-fallback.directive';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule, ImgFallbackDirective],
  template: `
    <div 
      class="avatar-container" 
      [class.has-border]="border()"
      [class.has-shadow]="shadow()"
      [ngClass]="customClass()"
      [style.width]="size() + 'px'" 
      [style.height]="size() + 'px'"
    >
      @if (effectiveAvatarUrl() && !isBroken()) {
        <img
          [src]="effectiveAvatarUrl()"
          [alt]="altText()"
          class="avatar-img"
          appImgFallback
          [skipDefaultFallback]="true"
          referrerpolicy="no-referrer"
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
  avatarUrl = input<string | null | undefined>(null);
  googleAvatarUrl = input<string | null | undefined>(null);
  avatarSource = input<'GOOGLE' | 'INITIALS' | 'CUSTOM' | string | null | undefined>('CUSTOM');
  nombre = input<string | null | undefined>(null);
  username = input<string | null | undefined>(null);
  size = input<number>(40);
  altText = input<string>('Avatar');
  border = input<boolean>(false);
  shadow = input<boolean>(false);
  customClass = input<string>('');

  isBroken = signal<boolean>(false);

  constructor() {
    // Reset broken state when any relevant input changes
    effect(() => {
      this.avatarUrl();
      this.googleAvatarUrl();
      this.avatarSource();
      this.isBroken.set(false);
    });
  }

  effectiveAvatarUrl = computed(() => {
    const source = this.avatarSource();
    const gUrl = this.googleAvatarUrl();
    const aUrl = this.avatarUrl();

    // Si la fuente es iniciales, no hay imagen
    if (source === 'INITIALS') return null;

    // Si la fuente es Google, priorizar googleAvatarUrl
    if (source === 'GOOGLE' && gUrl && gUrl.trim() !== '') {
      return gUrl;
    }

    // Por defecto (CUSTOM o AUTO), priorizar avatarUrl si existe y no es de ui-avatars
    if (aUrl && aUrl.trim() !== '' && !aUrl.includes('ui-avatars.com')) {
      return aUrl;
    }

    // Fallback a google si CUSTOM no tiene imagen o es ui-avatars pero Google sí tiene algo
    if (source !== 'INITIALS' && gUrl && gUrl.trim() !== '' && !gUrl.includes('ui-avatars.com')) {
      return gUrl;
    }

    return null;
  });

  fontSize = computed(() => this.size() * 0.45);

  iniciales = computed(() => {
    const name = this.nombre()?.trim();
    if (name) {
      const parts = name.split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    
    const user = this.username()?.trim();
    if (user) {
      return user.slice(0, 2).toUpperCase();
    }
    
    return '?';
  });

  onFallback() {
    this.isBroken.set(true);
  }
}
