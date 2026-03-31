import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService, NotificacionInAppDto } from '../../core/services/notification.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="notif-page-nexus custom-scrollbar">
      <div class="container-elite">
        <header class="page-header">
          <div class="header-content">
            <h1 class="page-title">Centro de Notificaciones</h1>
            <p class="page-subtitle">Gestiona tus avisos, ventas y actividad en Nexus</p>
          </div>
          <button 
            *ngIf="unreadCount() > 0"
            (click)="markAllAsRead()" 
            class="btn-mark-all"
          >
            <i class="fas fa-check-double"></i>
            Marcar todo como leído
          </button>
        </header>

        <main class="notif-container">
          <div class="notif-sidebar">
            <div class="filter-card">
              <h3 class="filter-title">Filtrar por</h3>
              <div class="filter-options">
                <button [class.active]="filter() === 'todas'" (click)="setFilter('todas')" class="filter-btn">
                  <i class="fas fa-list"></i> Todas
                </button>
                <button [class.active]="filter() === 'no-leidas'" (click)="setFilter('no-leidas')" class="filter-btn">
                  <i class="fas fa-envelope"></i> No leídas
                </button>
                <button [class.active]="filter() === 'destacadas'" (click)="setFilter('destacadas')" class="filter-btn">
                  <i class="fas fa-star"></i> Destacadas
                </button>
              </div>
            </div>

            <div class="stats-card">
              <div class="stat-item">
                <span class="stat-value">{{ unreadCount() }}</span>
                <span class="stat-label">Pendientes</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-value">{{ totalItems() }}</span>
                <span class="stat-label">Total historial</span>
              </div>
            </div>
          </div>

          <div class="notif-main-list">
            @if (loading()) {
              <div class="loading-state">
                <div class="spinner"></div>
                <span>Cargando tu historial...</span>
              </div>
            } @else if (notifications().length === 0) {
              <div class="empty-state-elite">
                <div class="empty-icon-glow">
                  <i class="fas fa-bell-slash"></i>
                </div>
                <h2>Nada por aquí todavía</h2>
                <p>No tienes notificaciones que coincidan con el filtro <strong>"{{ filterLabel() }}"</strong>.</p>
                <div class="empty-actions">
                  <button (click)="setFilter('todas')" class="btn-reset-elite">
                    <i class="fas fa-sync"></i> Ver todo el historial
                  </button>
                </div>
              </div>
            } @else {
              <div class="notif-grid">
                @for (n of notifications(); track n.id; let i = $index) {
                  <div 
                    class="notif-card-elite" 
                    [class.unread]="!n.leida"
                    [class.featured]="n.destacada"
                    [style.animation-delay]="(i * 40) + 'ms'"
                  >
                    <div class="card-left">
                      <div class="icon-wrapper" [style.background-color]="service.getNotifColor(n.tipo) + '15'">
                        <i [class]="service.getNotifIcon(n.tipo)" [style.color]="service.getNotifColor(n.tipo)"></i>
                      </div>
                    </div>

                    <div class="card-body">
                      <div class="card-meta">
                        <span class="card-type" [style.color]="service.getNotifColor(n.tipo)">
                          {{ service.getNotifTypeLabel(n.tipo) }}
                        </span>
                        <div class="meta-right">
                          <span class="card-date">{{ n.fecha | date: 'medium' }}</span>
                          <button 
                            (click)="toggleDestacada(n)" 
                            class="btn-star" 
                            [class.active]="n.destacada"
                            title="Destacar notificación"
                          >
                            <i class="fa-star" [class.fas]="n.destacada" [class.far]="!n.destacada"></i>
                          </button>
                        </div>
                      </div>
                      <h3 class="card-title">{{ n.titulo }}</h3>
                      <p class="card-msg">{{ n.mensaje }}</p>
                      
                      <div class="card-actions">
                        <button *ngIf="n.url" (click)="navigateTo(n.url)" class="btn-action-elite">Ver detalles</button>
                        <button *ngIf="!n.leida" (click)="markAsRead(n)" class="btn-mark-single">Marcar leído</button>
                      </div>
                    </div>

                    <div class="unread-glow" *ngIf="!n.leida"></div>
                  </div>
                }
              </div>

              <div class="pagination-elite" *ngIf="totalPages() > 1">
                <button [disabled]="page() === 0" (click)="prevPage()" class="btn-page"><i class="fas fa-chevron-left"></i></button>
                <span class="page-info">Página {{ page() + 1 }} de {{ totalPages() }}</span>
                <button [disabled]="page() >= totalPages() - 1" (click)="nextPage()" class="btn-page"><i class="fas fa-chevron-right"></i></button>
              </div>
            }
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
    .notif-page-nexus {
      min-height: 100vh;
      background: #080808;
      color: #fff;
      padding: 40px 20px;
    }

    .container-elite {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 48px;
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 900;
      letter-spacing: -0.04em;
      margin-bottom: 8px;
      background: linear-gradient(90deg, #fff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .page-subtitle {
      color: #94a3b8;
      font-size: 1.1rem;
    }

    .btn-mark-all {
       background: rgba(255,255,255,0.05);
       border: 1px solid rgba(255,255,255,0.1);
       color: #fff;
       padding: 12px 24px;
       border-radius: 16px;
       font-weight: 700;
       cursor: pointer;
       display: flex;
       align-items: center;
       gap: 12px;
       transition: all 0.3s;
    }

    .btn-mark-all:hover {
      background: #fff;
      color: #000;
      transform: translateY(-2px);
    }

    .notif-container {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 32px;
    }

    .notif-sidebar {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .filter-card, .stats-card {
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 24px;
      padding: 24px;
    }

    .filter-title {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-bottom: 20px;
    }

    .filter-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      text-align: left;
      padding: 12px 16px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.2s;
    }

    .filter-btn:hover {
      background: rgba(255,255,255,0.03);
      color: #fff;
    }

    .filter-btn.active {
      background: var(--nexus-blue, #6366f1);
      color: #fff;
      box-shadow: 0 10px 20px rgba(99,102,241,0.2);
    }

    .stats-card {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 900;
    }

    .stat-label {
      color: #64748b;
      font-size: 0.85rem;
    }

    .stat-divider {
      height: 1px;
      background: rgba(255,255,255,0.05);
    }

    .notif-main-list {
      min-height: 500px;
    }

    .notif-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .notif-card-elite {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 24px;
      padding: 24px;
      display: flex;
      gap: 24px;
      position: relative;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
      animation: fadeInUp 0.5s ease forwards;
    }

    .notif-card-elite:hover {
      background: rgba(255,255,255,0.05);
      border-color: rgba(255,255,255,0.1);
      transform: translateX(8px);
    }

    .notif-card-elite.unread {
      background: linear-gradient(90deg, rgba(99,102,241,0.05), transparent);
      border-left: 4px solid #6366f1;
    }

    .icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
    }

    .card-body {
      flex: 1;
    }

    .card-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .card-type {
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .card-date {
      font-size: 0.75rem;
      color: #64748b;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 8px;
    }

    .card-msg {
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .card-actions {
      display: flex;
      gap: 16px;
    }

    .btn-action-elite {
      background: #fff;
      color: #000;
      text-decoration: none;
      padding: 8px 24px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .btn-action-elite:hover {
      transform: scale(1.05);
      box-shadow: 0 10px 20px rgba(255,255,255,0.1);
    }

    .btn-mark-single {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.1);
      color: #fff;
      padding: 8px 20px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-mark-single:hover {
      background: rgba(255,255,255,0.05);
    }

    .pagination-elite {
      margin-top: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 24px;
    }

    .btn-page {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: #fff;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
    }

    .btn-page:hover:not(:disabled) {
      background: #fff;
      color: #000;
    }

    .btn-page:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding-top: 100px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeInUp { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }

    @media (max-width: 992px) {
      .notif-container { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; align-items: flex-start; gap: 20px; }
    }

    /* EMPTY STATE ELITE */
    .empty-state-elite {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 80px 40px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 40px;
      backdrop-filter: blur(20px);
      animation: fadeIn 0.8s ease-out;
    }

    .empty-icon-glow {
      font-size: 4rem;
      color: #334155;
      margin-bottom: 24px;
      position: relative;
      filter: drop-shadow(0 0 20px rgba(255,255,255,0.1));
    }

    .empty-state-elite h2 {
      font-size: 2rem;
      font-weight: 800;
      margin-bottom: 12px;
      background: linear-gradient(180deg, #fff, #64748b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .empty-state-elite p {
      color: #94a3b8;
      font-size: 1.1rem;
      max-width: 400px;
      margin-bottom: 32px;
    }

    .btn-reset-elite {
      background: #6366f1;
      color: #fff;
      border: none;
      padding: 14px 32px;
      border-radius: 20px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 10px 30px rgba(99,102,241,0.3);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .btn-reset-elite:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 15px 40px rgba(99,102,241,0.4);
    }

    /* CARD IMPROVEMENTS */
    .meta-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .btn-star {
      background: transparent;
      border: none;
      color: #475569;
      font-size: 1.1rem;
      cursor: pointer;
      transition: all 0.3s;
      padding: 4px;
    }

    .btn-star:hover {
      color: #f59e0b;
      transform: scale(1.2);
    }

    .btn-star.active {
      color: #f59e0b;
      filter: drop-shadow(0 0 8px rgba(245,158,11,0.5));
    }

    .notif-card-elite.featured {
      background: linear-gradient(90deg, rgba(245,158,11,0.05), transparent);
      border-left: 4px solid #f59e0b;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `
  ]
})
export class NotificacionesComponent implements OnInit {
  service = inject(NotificationService);
  private router = inject(Router);

  notifications = signal<NotificacionInAppDto[]>([]);
  unreadCount = this.service.unreadCount;
  totalItems = signal(0);
  loading = signal(false);
  page = signal(0);
  totalPages = signal(0);
  filter = signal<'todas'|'no-leidas'|'destacadas'>('todas');

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.loading.set(true);
    this.service.getAll(this.page()).subscribe({
      next: (res: any) => {
        let items = res.content || [];
        
        // Manual local filtering for demo/speed if backend doesn't support query params yet
        if (this.filter() === 'no-leidas') items = items.filter((n: any) => !n.leida);
        if (this.filter() === 'destacadas') items = items.filter((n: any) => n.destacada);

        this.notifications.set(items);
        this.totalItems.set(res.totalElements || items.length);
        this.totalPages.set(Math.ceil((res.totalElements || items.length) / 20));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setFilter(f: 'todas'|'no-leidas'|'destacadas') {
    this.filter.set(f);
    this.page.set(0);
    this.loadNotifications();
  }

  markAsRead(n: NotificacionInAppDto) {
    this.service.markAsRead(n.id).subscribe(() => {
      this.notifications.update(list => list.map(x => x.id === n.id ? {...x, leida: true} : x));
    });
  }

  markAllAsRead() {
    this.service.markAllAsRead().subscribe(() => {
      this.notifications.update(list => list.map(x => ({...x, leida: true})));
    });
  }

  toggleDestacada(n: NotificacionInAppDto) {
    this.service.toggleDestacada(n.id).subscribe(() => {
      this.notifications.update(list => 
        list.map(x => x.id === n.id ? {...x, destacada: !x.destacada} : x)
      );
    });
  }

  filterLabel() {
    switch(this.filter()) {
      case 'no-leidas': return 'No leídas';
      case 'destacadas': return 'Destacadas';
      default: return 'Todas';
    }
  }

  navigateTo(url: string) {
    if (!url) return;
    this.router.navigateByUrl(url);
  }

  nextPage() {
    if (this.page() < this.totalPages() - 1) {
      this.page.update(p => p + 1);
      this.loadNotifications();
    }
  }

  prevPage() {
    if (this.page() > 0) {
      this.page.update(p => p - 1);
      this.loadNotifications();
    }
  }
}
