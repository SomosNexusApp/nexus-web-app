import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Devolucion, DevolucionService } from '../../../core/services/devolucion.service';
import { AuthStore } from '../../../core/auth/auth-store';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { CurrencyEsPipe } from '../../../shared/pipes/currency-es.pipe';
import { CoverImagePipe } from '../../../shared/pipes/cover-image.pipe';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-devolucion-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CoverImagePipe],
  templateUrl: './devolucion-detail.component.html',
  styleUrl: './devolucion-detail.component.css',
})
export class DevolucionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private devSrv = inject(DevolucionService);
  private authStore = inject(AuthStore);
  private toast = inject(ToastService);

  devolucion = signal<Devolucion | null>(null);
  loading = signal(true);
  errorMsg = signal<string | null>(null);

  currentUser = this.authStore.user;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMsg.set('Devolución no encontrada');
      this.loading.set(false);
      return;
    }
    this.cargarDevolucion(Number(id));
  }

  cargarDevolucion(id: number) {
    this.loading.set(true);
    this.devSrv.getById(id).subscribe({
      next: (d) => {
        this.devolucion.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se ha podido cargar el detalle de la devolución');
        this.loading.set(false);
      },
    });
  }

  // Utilidades UI
  getBadgeColor(estado: string): string {
    switch (estado) {
      case 'SOLICITADA':
        return '#6c757d'; // gris
      case 'ACEPTADA':
        return '#17a2b8'; // cyan
      case 'RECHAZADA':
        return '#dc3545'; // rojo
      case 'DEVOLUCION_ENVIADA':
        return '#007bff'; // azul
      case 'COMPLETADA':
        return '#28a745'; // verde
      default:
        return '#6c757d';
    }
  }

  // Verifica el paso actual [1=Solicitada, 2=Rechazada o Aceptada, 3=Enviada, 4=Completada]
  getTimelineStep(d: Devolucion): number {
    switch (d.estado) {
      case 'SOLICITADA':
        return 1;
      case 'ACEPTADA':
        return 2;
      case 'RECHAZADA':
        return 2; // Pero terminada con error
      case 'DEVOLUCION_ENVIADA':
        return 3;
      case 'COMPLETADA':
        return 4;
      default:
        return 1;
    }
  }

  // Acciones (Simuladas en la plantilla, por ejemplo "Marcar como enviada")
  marcarComoEnviada(id: number) {
    // Si queremos meter el tracking de verdad:
    const transportista = prompt('Escribe el nombre del transportista (ej. Correos):', 'Correos');
    if (!transportista) return;
    const tracking = prompt('Escribe el número de seguimiento:', '');

    this.devSrv.marcarEnviada(id, transportista, tracking || '').subscribe({
      next: (d) => {
        this.toast.success('Envío registrado con éxito');
        this.devolucion.set(d);
      },
      error: (e) => this.toast.error(e.error?.error || 'No se pudo actualizar la devolución'),
    });
  }
}
