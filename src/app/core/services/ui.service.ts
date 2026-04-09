import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  readonly isCategoriasPanelOpen = signal(false);
  readonly isPublishModalOpen = signal(false);
  readonly isAnyChatSelected = signal(false);
  readonly isDetailView = signal(false);

  toggleCategoriasPanel(): void {
    this.isCategoriasPanelOpen.update(v => !v);
  }

  togglePublishModal(): void {
    this.isPublishModalOpen.update(v => !v);
  }

  openCategoriasPanel(): void {
    this.isCategoriasPanelOpen.set(true);
  }

  closeCategoriasPanel(): void {
    this.isCategoriasPanelOpen.set(false);
  }

  closePublishModal(): void {
    this.isPublishModalOpen.set(false);
  }
}
