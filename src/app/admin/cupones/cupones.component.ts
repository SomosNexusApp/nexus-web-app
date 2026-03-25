import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cupones',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1 class="page-title"><i class="fa-solid fa-ticket"></i> Cupones</h1>
        <p class="page-subtitle">Módulo en desarrollo</p>
      </div>
      <div class="coming-soon">
        <i class="fa-solid fa-ticket"></i>
        <h2>Próximamente</h2>
        <p>Este módulo estará disponible en la próxima versión.</p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 32px; font-family: 'Outfit', sans-serif; color: #f0f0fa; }
    .page-title { font-size: 1.6rem; font-weight: 900; margin: 0 0 24px; display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #fff, rgba(255,255,255,.5)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
    .page-title i { -webkit-text-fill-color: #7c3aed; }
    .page-subtitle { color: #6b6b8a; font-size: .85rem; margin: 6px 0 0; }
    .coming-soon { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 16px; color: rgba(255,255,255,.2); }
    .coming-soon i { font-size: 4rem; }
    .coming-soon h2 { font-size: 1.5rem; font-weight: 800; color: rgba(255,255,255,.3); }
    .coming-soon p { color: #6b6b8a; }
  `]
})
export class CuponesComponent {}
