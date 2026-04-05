import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SearchService } from '../../../core/services/search.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-moda-portal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="moda-container">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="mesh-gradient"></div>
        <div class="bg-text">FASHION</div>
        <div class="hero-content">
          <h1 class="hero-title">Nexus <span class="accent">Moda</span></h1>
          <p class="hero-subtitle">Define tu estilo con la mejor selección de moda y accesorios de nuestra comunidad.</p>
          
          <!-- Gender Filters -->
          <div class="gender-filters">
            <button 
              class="filter-btn" 
              [class.active]="activeGender() === 'todas'"
              (click)="setGender('todas')"
            >
              <i class="fas fa-th-large"></i>
              <span>Todo</span>
            </button>
            <button 
              class="filter-btn" 
              [class.active]="activeGender() === 'hombre'"
              (click)="setGender('hombre')"
            >
              <i class="fas fa-user-tie"></i>
              <span>Hombre</span>
            </button>
            <button 
              class="filter-btn" 
              [class.active]="activeGender() === 'mujer'"
              (click)="setGender('mujer')"
            >
              <i class="fas fa-bag-shopping"></i>
              <span>Mujer</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Content Grid -->
      <div class="content-wrapper">
        <div class="section-header">
          <div class="header-info">
            <i class="fas fa-gem header-icon-ref"></i>
            <h2>{{ sectionTitle() }}</h2>
          </div>
          <div class="filters-summary">
            <span class="badge">Mostrando {{ items.length }} artículos</span>
          </div>
        </div>

        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Buscando las mejores tendencias para ti...</p>
          </div>
        } @else if (items.length === 0) {
          <div class="empty-state glass">
             <i class="fas fa-gem empty-icon-ref"></i>
            <h3>No hay artículos en esta sección hoy</h3>
            <p>Prueba con otro filtro o vuelve pronto para ver las novedades.</p>
          </div>
        } @else {
          <div class="moda-grid" [@listAnimation]="items.length">
            @for (item of items; track item.id) {
              <div class="moda-card glass" [routerLink]="getItemLink(item)">
                <div class="card-image-wrapper">
                  <img [src]="item.imagenPrincipal || item.imagenes?.[0] || 'assets/images/placeholder-fashion.jpg'" [alt]="item.titulo">
                  
                  <div class="price-tag-holographic">
                    <span class="currency">€</span>
                    <span class="amount">{{ getPrice(item) | number:'1.0-2' }}</span>
                  </div>

                  @if (isOffer(item) && item.precioOriginal > (item.precioOferta || item.precio)) {
                    <div class="discount-pill">
                      <i class="fas fa-fire"></i>
                      <span>-{{ ((item.precioOriginal - (item.precioOferta || item.precio)) / item.precioOriginal * 100) | number:'1.0-0' }}%</span>
                    </div>
                  }

                  <div class="type-badge-refined" [class.is-offer]="isOffer(item)">
                    {{ isOffer(item) ? 'OFERTA' : 'PRODUCTO' }}
                  </div>
                </div>
                
                <div class="card-content">
                  <div class="category-pill-glass">{{ item.categoria?.nombre || 'Moda' }}</div>
                  <h3 class="card-title">{{ item.titulo }}</h3>
                  
                  <div class="card-meta">
                    <div class="meta-item">
                      <i class="fas fa-shield-check meta-icon-v"></i>
                      <span>Vendedor Verificado</span>
                    </div>
                    @if (item.ubicacion) {
                      <div class="meta-item">
                        <i class="fas fa-location-dot meta-icon-v"></i>
                        <span>{{ item.ubicacion }}</span>
                      </div>
                    }
                  </div>

                  <div class="card-footer">
                    @if (isOffer(item)) {
                       <div class="spark-rating-elite">
                        <i class="fas fa-star star-filled"></i>
                        <span>{{ item.sparkScore || 9.5 }}</span>
                      </div>
                    } @else {
                      <div class="condition-badge-elite" [class.new]="item.estado === 'NUEVO'">
                        {{ item.estado || 'Usado' }}
                      </div>
                    }
                    <button class="btn-view-premium">
                      <span>Ver detalle</span>
                      <i class="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #050505;
      color: #fff;
    }

    .moda-container {
      padding-bottom: 100px;
    }

    /* MESH GRADIENT & HERO ENHANCEMENTS */
    .hero-section {
      position: relative;
      height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      overflow: hidden;
      background: #000;
    }

    .mesh-gradient {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: 
        radial-gradient(at 0% 0%, rgba(236, 72, 153, 0.15) 0, transparent 50%),
        radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.15) 0, transparent 50%),
        radial-gradient(at 50% 100%, rgba(236, 72, 153, 0.1) 0, transparent 50%);
      filter: blur(60px);
      animation: mesh-flow 20s infinite alternate;
    }

    @keyframes mesh-flow {
      0% { transform: scale(1) translate(0,0); }
      50% { transform: scale(1.1) translate(2%, 2%); }
      100% { transform: scale(1) translate(0,0); }
    }

    .bg-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 25vw;
      font-weight: 900;
      color: rgba(255, 255, 255, 0.02);
      letter-spacing: -0.05em;
      pointer-events: none;
      z-index: 1;
      white-space: nowrap;
    }

    .hero-content {
      position: relative;
      z-index: 2;
      max-width: 900px;
      padding: 0 20px;
    }

    .hero-title {
      font-size: clamp(4rem, 12vw, 8rem);
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      margin-bottom: 0.5rem;
      letter-spacing: -0.04em;
      line-height: 0.9;
    }

    .accent {
      background: linear-gradient(135deg, #f472b6 0%, #ec4899 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 0 15px rgba(236, 72, 153, 0.3));
    }

    .hero-subtitle {
      font-size: 1.4rem;
      color: #9ca3af;
      font-weight: 300;
      max-width: 650px;
      margin: 1.5rem auto 3rem;
    }

    /* GENDER FILTERS ELITE */
    .gender-filters {
      display: flex;
      gap: 15px;
      justify-content: center;
    }

    .filter-btn {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      padding: 14px 28px;
      border-radius: 100px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(20px);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .filter-btn i {
      font-size: 1.1rem;
      opacity: 0.8;
    }

    .filter-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(236, 72, 153, 0.4);
      transform: translateY(-4px) scale(1.05);
    }

    .filter-btn.active {
      background: #ec4899;
      border-color: #f472b6;
      box-shadow: 0 10px 25px rgba(236, 72, 153, 0.4);
      transform: translateY(-2px);
    }

    .filter-btn.active i {
      opacity: 1;
    }

    .content-wrapper {
      max-width: 1400px;
      margin: -60px auto 0;
      padding: 0 30px;
      position: relative;
      z-index: 10;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding: 24px 32px;
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(40px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 30px;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .header-icon-ref {
      color: #ec4899;
      font-size: 2rem;
      filter: drop-shadow(0 0 10px rgba(236, 72, 153, 0.3));
    }

    .header-info h2 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .badge {
      background: rgba(236, 72, 153, 0.1);
      color: #f472b6;
      padding: 10px 20px;
      border-radius: 100px;
      font-size: 0.9rem;
      font-weight: 700;
      border: 1px solid rgba(236, 72, 153, 0.2);
    }

    .moda-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 35px;
    }

    .glass {
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(50px);
      border: 1px solid rgba(255, 255, 255, 0.06);
      box-shadow: 0 15px 45px rgba(0, 0, 0, 0.5);
    }

    /* PREMIUM CARDS */
    .moda-card {
      border-radius: 35px;
      overflow: hidden;
      transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
      cursor: pointer;
      display: flex;
      flex-direction: column;
    }

    .moda-card:hover {
      transform: translateY(-15px) scale(1.02);
      border-color: rgba(236, 72, 153, 0.4);
      background: rgba(255, 255, 255, 0.05);
    }

    .card-image-wrapper {
      position: relative;
      height: 420px;
      overflow: hidden;
    }

    .card-image-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 1s cubic-bezier(0.19, 1, 0.22, 1);
    }

    .moda-card:hover .card-image-wrapper img {
      transform: scale(1.1);
    }

    .price-tag-holographic {
      position: absolute;
      bottom: 25px;
      left: 20px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(15px);
      padding: 12px 24px;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: baseline;
      gap: 4px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }

    .price-tag-holographic .currency {
      font-size: 1rem;
      font-weight: 500;
      color: #f472b6;
    }

    .price-tag-holographic .amount {
      font-size: 1.6rem;
      font-weight: 900;
      color: #fff;
    }

    .discount-pill {
      position: absolute;
      top: 25px;
      right: 20px;
      background: linear-gradient(135deg, #ef4444, #ec4899);
      color: white;
      padding: 8px 16px;
      border-radius: 14px;
      font-weight: 800;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 5px 15px rgba(236, 72, 153, 0.4);
    }

    .type-badge-refined {
      position: absolute;
      top: 25px;
      left: 20px;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      color: rgba(255, 255, 255, 0.6);
      padding: 6px 14px;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .type-badge-refined.is-offer {
      color: #fbbf24;
      border-color: rgba(251, 191, 36, 0.3);
    }

    .card-content {
      padding: 28px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }

    .category-pill-glass {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #ec4899;
      font-weight: 800;
      margin-bottom: 14px;
    }

    .card-title {
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 24px;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      color: #f3f4f6;
    }

    .card-meta {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 28px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #9ca3af;
      font-size: 0.9rem;
    }

    .meta-icon-v {
      font-size: 1rem;
      color: #4b5563;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      margin-top: auto;
    }

    .spark-rating-elite {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 900;
      color: #fbbf24;
      font-size: 1.1rem;
    }

    .star-filled {
      filter: drop-shadow(0 0 5px rgba(251, 191, 36, 0.4));
    }

    .condition-badge-elite {
      font-size: 0.8rem;
      font-weight: 700;
      color: #9ca3af;
      padding: 6px 12px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .condition-badge-elite.new {
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
    }

    .btn-view-premium {
      background: #fff;
      color: #000;
      border: none;
      padding: 12px 24px;
      border-radius: 16px;
      font-weight: 800;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.4s ease;
    }

    .btn-view-premium:hover {
      background: #ec4899;
      color: white;
      transform: translateX(5px);
    }

    .loading-state {
      padding: 120px 0;
      text-align: center;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255, 255, 255, 0.05);
      border-top-color: #ec4899;
      border-radius: 50%;
      animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      margin: 0 auto 24px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      padding: 100px;
      text-align: center;
      border-radius: 40px;
    }

    .empty-icon-ref {
      font-size: 4rem;
      color: #1f2937;
      margin-bottom: 24px;
    }

    @media (max-width: 768px) {
      .hero-section { height: 450px; }
      .hero-title { font-size: 3rem; }
      .gender-filters { flex-wrap: wrap; }
      .content-wrapper { margin-top: -30px; padding: 0 20px; }
    }
  `],
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('80ms', [
            animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class ModaPortalComponent implements OnInit {
  private searchService = inject(SearchService);

  items: any[] = [];
  loading = signal(true);
  activeGender = signal<'todas' | 'hombre' | 'mujer'>('todas');

  sectionTitle = computed(() => {
    switch (this.activeGender()) {
      case 'hombre': return 'Moda Hombre';
      case 'mujer': return 'Moda Mujer';
      default: return 'Tendencias Destacadas';
    }
  });

  ngOnInit() {
    this.loadModa();
  }

  setGender(gender: 'todas' | 'hombre' | 'mujer') {
    this.activeGender.set(gender);
    this.loadModa();
  }

  loadModa() {
    this.loading.set(true);
    
    // Slugs dinámicos según el filtro
    let catSlug = 'moda';
    if (this.activeGender() === 'hombre') catSlug = 'moda-hombre';
    if (this.activeGender() === 'mujer') catSlug = 'moda-mujer';

    this.searchService.buscar({ 
      categoria: catSlug, 
      tipo: 'TODOS', 
      size: 40 
    }).subscribe({
      next: (res) => {
        this.items = res.items;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  isOffer(item: any): boolean {
    return item.searchType === 'OFERTA';
  }

  getItemLink(item: any): any[] {
    return this.isOffer(item) ? ['/ofertas', item.id] : ['/productos', item.id];
  }

  getPrice(item: any): number {
    if (this.isOffer(item)) return item.precioOferta || item.precio;
    return item.precio;
  }
}
