import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScrollService } from '../../../core/services/scroll.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="error-page ink-bg">
      <div class="error-container">
        <div class="glow-orb blue"></div>
        <div class="glow-orb purple"></div>
        
        <div class="error-content glassmorphism">
          <h1 class="error-code">404</h1>
          <div class="error-icon">
            <i class="fas fa-ghost fa-bounce"></i>
          </div>
          <h2 class="error-title">Página no encontrada</h2>
          <p class="error-text">
            Lo sentimos, la página que buscas parece haberse esfumado en el vacío digital. 
            Verifica la URL o vuelve al inicio para seguir explorando.
          </p>
          <a routerLink="/" class="btn-home-glow">
            <i class="fas fa-home"></i> Volver al inicio
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-page {
      height: calc(100vh - 130px);
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #09090b;
      overflow: hidden;
      position: relative;
      font-family: 'Inter', sans-serif;
    }

    .error-container {
      position: relative;
      width: 100%;
      max-width: 600px;
      padding: 2rem;
      z-index: 10;
    }

    .glow-orb {
      position: absolute;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.2;
      z-index: -1;
    }

    .blue { background: #3b82f6; top: -50px; left: -50px; }
    .purple { background: #6366f1; bottom: -50px; right: -50px; }

    .error-content {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 2rem;
      padding: 4rem 2rem;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .error-code {
      font-family: 'Outfit', sans-serif;
      font-size: 8rem;
      font-weight: 900;
      margin: 0;
      line-height: 1;
      background: linear-gradient(135deg, #fff 0%, #6366f1 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      opacity: 0.9;
    }

    .error-icon {
      font-size: 4rem;
      color: #fff;
      margin: 1.5rem 0;
      filter: drop-shadow(0 0 15px rgba(99, 102, 241, 0.6));
    }

    .error-title {
      font-family: 'Outfit', sans-serif;
      font-size: 2rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 1rem;
    }

    .error-text {
      color: #94a3b8;
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 2.5rem;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }

    .btn-home-glow {
      background: linear-gradient(135deg, #6366f1, #c084fc);
      color: white !important;
      border: none;
      padding: 1rem 2.5rem;
      border-radius: 3rem;
      font-weight: 700;
      font-size: 1rem;
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
    }

    .btn-home-glow:hover {
      transform: translateY(-4px) scale(1.05);
      box-shadow: 0 15px 30px rgba(99, 102, 241, 0.5);
      color: #fff !important;
    }
  `]
})
export class NotFoundComponent implements OnInit, OnDestroy {
  private scrollService = inject(ScrollService);

  ngOnInit(): void {
    this.scrollService.lock();
  }

  ngOnDestroy(): void {
    this.scrollService.unlock();
  }
}
