import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';
import { AuthStore } from '../../../core/auth/auth-store';
import { CurrencyEsPipe } from '../../../shared/pipes/currency-es.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { FormsModule } from '@angular/forms';
import { ReporteModalComponent } from '../../../shared/components/reporte-modal/reporte-modal.component';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-vehiculo-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyEsPipe, FormsModule, ReporteModalComponent],
  templateUrl: './vehiculo-detail.component.html',
  styleUrls: ['./vehiculo-detail.component.css'],
})
export class VehiculoDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  authStore = inject(AuthStore);

  @ViewChild(ReporteModalComponent) reporteModal!: ReporteModalComponent;

  vehiculo = signal<any>(null);
  similares = signal<any[]>([]);
  comentarios = signal<any[]>([]);
  nuevoComentario = '';
  cargando = signal(true);
  enviandoComentario = signal(false);
  imgPrincipal = signal<string>('');

  // Gestión de Comentarios
  editandoId = signal<number | null>(null);
  textoEditando = '';

  // Gestión de Encuestas
  mostrandoCreadorEncuesta = signal(false);
  preguntaEncuesta = '';
  opcionesEncuesta: string[] = ['', ''];

  ngOnInit() {
    window.scrollTo(0, 0);
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.cargando.set(true);
        this.vehiculo.set(null);

        this.cargarVehiculo(id);
      }
    });
  }

  private cargarVehiculo(id: string) {
    this.http.get<any>(`${environment.apiUrl}/vehiculo/${id}`).subscribe({
      next: (res) => {
        this.vehiculo.set(res);
        this.imgPrincipal.set(res.imagenPrincipal);
        this.cargando.set(false);
        this.cargarSimilares(res.publicador?.id);
        this.cargarComentarios(id);
      },
      error: () => this.cargando.set(false),
    });
  }

  private cargarSimilares(actorId?: number) {
    if (!actorId) return;
    this.http.get<any[]>(`${environment.apiUrl}/vehiculo`).subscribe((res) => {
      this.similares.set(
        res.filter((v) => v.id !== this.vehiculo().id && v.publicador?.id === actorId).slice(0, 4),
      );
    });
  }

  private cargarComentarios(id: string) {
    // Los vehículos usan el mismo sistema de comentarios pero con vehiculoId
    this.http.get<any[]>(`${environment.apiUrl}/comentario/vehiculo/${id}`).subscribe(
      (res) => {
        const parsed = res.map((c) => ({
          ...c,
          poll: c.pollJson ? JSON.parse(c.pollJson) : null,
        }));
        this.comentarios.set(parsed);
      },
      () => {
        // Fallback si el endpoint no existe aún
        this.comentarios.set([]);
      },
    );
  }

  contactar() {
    if (!this.authStore.isLoggedIn()) {
      alert('Inicia sesión para contactar');
      return;
    }
    // Vehículos también pueden contactarse directamente a través del su `id` si se tratan como Productos en el backend.
    this.router.navigate(['/mensajes'], { queryParams: { productoId: this.vehiculo()?.id } });
  }

  abrirReporte() {
    if (!this.authStore.isLoggedIn()) {
      alert('Inicia sesión para reportar.');
      return;
    }
    this.reporteModal.abrir('VEHICULO', this.vehiculo().id);
  }

  // --- COMENTARIOS ---

  formatText(tag: string) {
    const area = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!area) return;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const text = area.value;
    const selected = text.substring(start, end);
    let formatted = '';

    if (tag === 'bold') formatted = `**${selected}**`;
    if (tag === 'italic') formatted = `*${selected}*`;
    if (tag === 'list') formatted = `\n- ${selected}`;
    if (tag === 'header') formatted = `\n### ${selected}`;

    this.nuevoComentario = text.substring(0, start) + formatted + text.substring(end);
    area.focus();
  }

  addPollOption() {
    if (this.opcionesEncuesta.length < 5) this.opcionesEncuesta.push('');
  }

  publicarComentario() {
    if (!this.nuevoComentario.trim() || this.enviandoComentario()) return;
    this.enviandoComentario.set(true);

    let pollJson = null;
    if (this.mostrandoCreadorEncuesta() && this.preguntaEncuesta.trim()) {
      const poll = {
        question: this.preguntaEncuesta,
        options: this.opcionesEncuesta.filter((o) => o.trim()).map((o) => ({ text: o, votes: 0 })),
        totalVotes: 0,
        votedUsers: [],
      };
      pollJson = JSON.stringify(poll);
    }

    const body = { texto: this.nuevoComentario, pollJson };
    const params = { vehiculoId: this.vehiculo().id, actorId: this.authStore.user()!.id };

    this.http.post(`${environment.apiUrl}/comentario`, body, { params }).subscribe({
      next: (res: any) => {
        const fullComment = { ...res, poll: res.pollJson ? JSON.parse(res.pollJson) : null };
        this.comentarios.update((list) => [fullComment, ...list]);
        this.nuevoComentario = '';
        this.preguntaEncuesta = '';
        this.opcionesEncuesta = ['', ''];
        this.mostrandoCreadorEncuesta.set(false);
        this.enviandoComentario.set(false);
      },
      error: () => this.enviandoComentario.set(false),
    });
  }

  eliminarComentario(id: number) {
    if (!confirm('¿Seguro que quieres borrar este comentario?')) return;
    this.http.delete(`${environment.apiUrl}/comentario/${id}`).subscribe(() => {
      this.comentarios.update((list) => list.filter((c) => c.id !== id));
    });
  }

  iniciarEdicion(c: any) {
    this.editandoId.set(c.id);
    this.textoEditando = c.texto;
  }

  guardarEdicion() {
    const id = this.editandoId();
    if (!id || !this.textoEditando.trim()) return;

    this.http
      .put(`${environment.apiUrl}/comentario/${id}`, { texto: this.textoEditando })
      .subscribe({
        next: (res: any) => {
          this.comentarios.update((list) =>
            list.map((c) => (c.id === id ? { ...c, texto: res.texto } : c)),
          );
          this.editandoId.set(null);
        },
      });
  }

  votarEncuesta(comentario: any, index: number) {
    if (!this.authStore.isLoggedIn()) return;
    const userId = this.authStore.user()?.id;
    if (!userId || comentario.poll.votedUsers.includes(userId)) return;

    comentario.poll.options[index].votes++;
    comentario.poll.totalVotes++;
    comentario.poll.votedUsers.push(userId);

    this.http
      .put(`${environment.apiUrl}/comentario/${comentario.id}`, {
        pollJson: JSON.stringify(comentario.poll),
      })
      .subscribe();
  }

  parseMarkdown(text: string): string {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n- (.*?)/g, '<li>$1</li>')
      .replace(/### (.*?)\n/g, '<h4>$1</h4>');
  }
}
