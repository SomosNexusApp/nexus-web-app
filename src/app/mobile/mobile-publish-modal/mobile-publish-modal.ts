import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UiService } from '../../core/services/ui.service';

@Component({
  selector: 'app-mobile-publish-modal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mobile-publish-modal.html',
  styleUrls: ['./mobile-publish-modal.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobilePublishModalComponent {
  public uiService = inject(UiService);
  private router = inject(Router);

  close(): void {
    this.uiService.closePublishModal();
  }

  navegar(ruta: string): void {
    this.close();
    this.router.navigate([ruta]);
  }
}
