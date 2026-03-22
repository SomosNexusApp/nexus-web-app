import { Component, OnInit, inject, signal, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';
import { AuthStore } from '../../../core/auth/auth-store';
import { CurrencyEsPipe } from '../../../shared/pipes/currency-es.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { FormsModule } from '@angular/forms';
import { ReporteModalComponent } from '../../../shared/components/reporte-modal/reporte-modal.component';
import { ConfirmacionModalComponent } from '../../../shared/components/confirmacion-modal/confirmacion-modal.component';

export interface PollOption { text: string; votes: number; }
export interface PollData { question: string; options: PollOption[]; totalVotes: number; votedUsers: number[]; }

@Component({
  selector: 'app-oferta-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyEsPipe, TimeAgoPipe, FormsModule, ReporteModalComponent, ConfirmacionModalComponent],
  templateUrl: './oferta-detail.component.html',
  styleUrls: ['./oferta-detail.component.css']
})
export class OfertaDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  authStore = inject(AuthStore);

  @ViewChild(ReporteModalComponent) reporteModal!: ReporteModalComponent;
  @ViewChild(ConfirmacionModalComponent) confirmModal!: ConfirmacionModalComponent;

  oferta = signal<any>(null);
  comentarios = signal<any[]>([]);
  nuevoComentario = '';
  cargando = signal(true);
  enviandoComentario = signal(false);
  favicon = signal<string>('');
  countdown = signal<string>('');
  copiado = signal(false);
  votando = signal(false);
  
  // Gestión de Comentarios y Formato
  editandoId = signal<number | null>(null);
  textoEditando = '';
  mostrandoCreadorEncuesta = signal(false);
  preguntaEncuesta = '';
  opcionesEncuesta: string[] = ['', ''];

  private timer?: any;

  ngOnInit() {
    window.scrollTo(0, 0);
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) this.cargarOferta(id);
    });
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private cargarOferta(id: string) {
    const usuarioId = this.authStore.user()?.id;
    const url = `${environment.apiUrl}/oferta/${id}${usuarioId ? '?usuarioId='+usuarioId : ''}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.oferta.set(res);
        this.cargando.set(false);
        this.extraerFavicon(res.urlOferta);
        this.cargarComentarios(id);
        if (res.fechaExpiracion) this.startTimer();
      },
      error: () => this.cargando.set(false)
    });
  }

  private cargarComentarios(id: string) {
    this.http.get<any[]>(`${environment.apiUrl}/comentario/oferta/${id}`).subscribe(res => {
      const parsed = res.map(c => ({
        ...c,
        poll: c.pollJson ? JSON.parse(c.pollJson) : null
      }));
      this.comentarios.set(parsed);
    });
  }

  private extraerFavicon(url: string) {
    try {
      const domain = new URL(url).hostname;
      this.favicon.set(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
    } catch (e) {
      this.favicon.set('assets/icons/store-fallback.svg');
    }
  }

  private startTimer() {
    const update = () => {
      if (!this.oferta()?.fechaExpiracion) return;
      const diff = new Date(this.oferta().fechaExpiracion).getTime() - Date.now();
      if (diff <= 0) { this.countdown.set('EXPIRADA'); clearInterval(this.timer); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      this.countdown.set(`${h}h ${m}m ${s}s`);
    };
    update();
    this.timer = setInterval(update, 1000);
  }

  votar(esSpark: boolean) {
    if (!this.authStore.isLoggedIn()) { 
      this.confirmModal.abrir('Inicio de sesión', 'Debes iniciar sesión para calificar este chollo.', 'INFO');
      return; 
    }
    if (this.votando()) return;

    const voteType = esSpark ? 'SPARK' : 'DRIP';

    // Si hace click en el voto que ya tiene, se retira el voto (Toggle off)
    if (this.oferta().miVoto === voteType) {
      this.procesarVoto(esSpark);
      return;
    }

    // Si ya ha votado otra cosa, pedir confirmación para cambiar
    if (this.oferta().miVoto && this.oferta().miVoto !== 'NONE') {
      this.confirmModal.abrir(
        'Cambiar voto',
        `Ya has calificado como ${this.oferta().miVoto}. ¿Deseas cambiarlo a ${voteType}?`,
        'WARNING',
        () => this.procesarVoto(esSpark)
      );
      return;
    }

    this.procesarVoto(esSpark);
  }

  private procesarVoto(esSpark: boolean) {
    this.votando.set(true);
    const previousState = { ...this.oferta() };
    const voteType = esSpark ? 'SPARK' : 'DRIP';
    
    this.oferta.update(o => {
      let newScore = o.sparkScore || 0;
      let newVoto = o.miVoto;
      
      if (o.miVoto === 'SPARK') newScore -= 1;
      else if (o.miVoto === 'DRIP') newScore += 1;

      if (o.miVoto === voteType) {
        newVoto = 'NONE';
      } else {
        newVoto = voteType;
        if (newVoto === 'SPARK') newScore += 1;
        else if (newVoto === 'DRIP') newScore -= 1;
      }
      return { ...o, sparkScore: newScore, miVoto: newVoto };
    });

    const params = new HttpParams()
      .set('usuarioId', this.authStore.user()!.id.toString())
      .set('esSpark', esSpark.toString());

    this.http.post(`${environment.apiUrl}/oferta/${previousState.id}/votar`, {}, { params }).subscribe({
      next: (res: any) => {
        this.oferta.update(o => ({ 
          ...o, 
          sparkScore: res.sparkScore, 
          badge: res.badge,
          miVoto: res.miVoto 
        }));
      },
      error: (err) => {
        console.error('Error voting:', err);
        this.oferta.set(previousState);
        this.confirmModal.abrir('Error', 'No se pudo procesar tu voto. Intenta de nuevo más tarde.', 'WARNING');
      },
      complete: () => {
        this.votando.set(false);
      }
    });
  }

  abrirReporte() {
    if (!this.authStore.isLoggedIn()) {
      alert('Inicia sesión para reportar.');
      return;
    }
    this.reporteModal.abrir('OFERTA', this.oferta().id);
  }

  // --- COMENTARIOS: FORMATO Y ACCIONES ---

  formatText(tag: string) {
    const area = document.querySelector('.comment-textarea') as HTMLTextAreaElement;
    if (!area) return;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const text = area.value;
    const selected = text.substring(start, end);
    let formatted = '';

    if (tag === 'bold') formatted = `**${selected}**`;
    else if (tag === 'italic') formatted = `*${selected}*`;
    else if (tag === 'list') formatted = `\n- ${selected}`;
    else if (tag === 'header') formatted = `\n### ${selected}`;

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
      const poll: PollData = {
        question: this.preguntaEncuesta,
        options: this.opcionesEncuesta.filter(o => o.trim()).map(o => ({ text: o, votes: 0 })),
        totalVotes: 0,
        votedUsers: []
      };
      pollJson = JSON.stringify(poll);
    }

    const body = { texto: this.nuevoComentario, pollJson };
    const params = { ofertaId: this.oferta().id, actorId: this.authStore.user()!.id };

    this.http.post(`${environment.apiUrl}/comentario`, body, { params }).subscribe({
      next: (res: any) => {
        const fullComment = { ...res, poll: res.pollJson ? JSON.parse(res.pollJson) : null };
        this.comentarios.update(list => [fullComment, ...list]);
        this.nuevoComentario = '';
        this.preguntaEncuesta = '';
        this.opcionesEncuesta = ['', ''];
        this.mostrandoCreadorEncuesta.set(false);
        this.enviandoComentario.set(false);
      },
      error: () => this.enviandoComentario.set(false)
    });
  }

  borrarComentario(id: number) {
    this.confirmModal.abrir(
      '¿Eliminar comentario?',
      'Esta acción borrará permanentemente tu comentario. ¿Deseas continuar?',
      'DANGER',
      () => {
        this.http.delete(`${environment.apiUrl}/comentario/${id}`).subscribe({
          next: () => this.comentarios.update(list => list.filter(c => c.id !== id))
        });
      }
    );
  }

  iniciarEdicion(c: any) {
    this.editandoId.set(c.id);
    this.textoEditando = c.texto;
  }

  guardarEdicion() {
    const id = this.editandoId();
    if (!id || !this.textoEditando.trim()) return;
    this.http.put(`${environment.apiUrl}/comentario/${id}`, { texto: this.textoEditando }).subscribe({
      next: (res: any) => {
        this.comentarios.update(list => list.map(c => c.id === id ? { ...c, texto: res.texto } : c));
        this.editandoId.set(null);
      }
    });
  }

  votarEncuesta(comentario: any, index: number) {
    const userId = this.authStore.user()?.id;
    if (!userId) { 
      this.confirmModal.abrir('Inicio de sesión', 'Inicia sesión para participar en encuestas.', 'INFO');
      return; 
    }
    if (comentario.poll.votedUsers?.includes(userId)) { 
      this.confirmModal.abrir('Ya has votado', 'Ya has participado en esta encuesta.', 'INFO');
      return; 
    }

    // Clonar poll para evitar mutaciones directas y actualizar UI
    const updatedPoll = JSON.parse(JSON.stringify(comentario.poll));
    updatedPoll.options[index].votes++;
    updatedPoll.totalVotes++;
    updatedPoll.votedUsers = updatedPoll.votedUsers || [];
    updatedPoll.votedUsers.push(userId);

    const oldPoll = comentario.poll;
    comentario.poll = updatedPoll;

    this.http.put(`${environment.apiUrl}/comentario/${comentario.id}`, { 
      pollJson: JSON.stringify(updatedPoll) 
    }).subscribe({
      error: () => {
        comentario.poll = oldPoll;
        alert('Error al guardar tu voto.');
      }
    });
  }

  compartir(plataforma: string) {
    const url = window.location.href;
    const text = `¡Vaya chollo en Nexus! ${this.oferta().titulo}`;
    if (plataforma === 'copy') {
      navigator.clipboard.writeText(url);
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    }
    if (plataforma === 'wa') window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    if (plataforma === 'tg') window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  }

  get discountPercent(): number {
    const o = this.oferta();
    if (!o || !o.precioOriginal || o.precioOriginal <= o.precioOferta) return 0;
    return Math.round(((o.precioOriginal - o.precioOferta) / o.precioOriginal) * 100);
  }

  get sparkTempWidth(): number {
    const s = this.oferta()?.sparkScore || 0;
    return s <= 0 ? 0 : (s >= 100 ? 100 : s);
  }

  parseMarkdown(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n- (.*?)/g, '<li>$1</li>')
      .replace(/### (.*?)\n/g, '<h4>$1</h4>')
      .replace(/\n/g, '<br>');
  }
}
