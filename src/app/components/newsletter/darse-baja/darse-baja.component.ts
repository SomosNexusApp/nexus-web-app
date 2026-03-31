import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-darse-baja',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="unsub-page">
      <div class="unsub-card">
        <h1>{{ titulo() }}</h1>
        <p>{{ mensaje() }}</p>
        <a routerLink="/" class="btn-home">Volver a Nexus</a>
      </div>
    </div>
  `,
  styles: [`
    .unsub-page { min-height: 70vh; display:flex; align-items:center; justify-content:center; padding:24px; }
    .unsub-card { max-width: 640px; width:100%; border:1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px; background: var(--bg-glass, #111827); text-align:center; }
    h1 { margin:0 0 12px; font-size: 2rem; }
    p { margin:0 0 24px; color: var(--text-muted, #9ca3af); line-height:1.6; }
    .btn-home { display:inline-block; padding:12px 20px; border-radius: 999px; background: var(--gradient-primary); color: #000; text-decoration: none; font-weight: 700; }
  `],
})
export class DarseBajaComponent {
  private route = inject(ActivatedRoute);
  estado = computed(() => this.route.snapshot.queryParamMap.get('estado') ?? 'ok');

  titulo = computed(() =>
    this.estado() === 'ok'
      ? 'Te has dado de baja correctamente'
      : 'No se pudo completar la baja'
  );

  mensaje = computed(() =>
    this.estado() === 'ok'
      ? 'Ya no recibirás correos publicitarios de la newsletter.'
      : 'El enlace de baja no es válido o ha caducado. Si quieres, puedes repetir el proceso desde un correo reciente.'
  );
}
