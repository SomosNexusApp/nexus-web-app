import { Directive, Input, HostListener, ElementRef, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: 'img[appImgFallback]',
  standalone: true
})
export class ImgFallbackDirective {
  @Input('appImgFallback') fallbackUrl: string = '';
  @Input() skipDefaultFallback: boolean = false;
  @Output() fallbackTriggered = new EventEmitter<void>();

  constructor(private el: ElementRef) {}

  @HostListener('error')
  onError() {
    this.fallbackTriggered.emit();
    
    if (this.skipDefaultFallback) return;

    const img = this.el.nativeElement as HTMLImageElement;
    let url = this.fallbackUrl;
    
    if (!url) {
      const name = img.alt || 'User';
      url = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    }

    if (img.src !== url) {
      img.src = url;
    }
  }
}
