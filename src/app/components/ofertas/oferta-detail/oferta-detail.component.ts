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

export interface PollOption { text: string; votes: number; }
export interface PollData { question: string; options: PollOption[]; totalVotes: number; votedUsers: number[]; }

@Component({
  selector: 'app-oferta-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyEsPipe, TimeAgoPipe, FormsModule, ReporteModalComponent],
  templateUrl: './oferta-detail.component.html',
  styleUrls: ['./oferta-detail.component.css']
})
export class OfertaDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  authStore = inject(AuthStore);

  @ViewChild(ReporteModalComponent) reporteModal!: ReporteModalComponent;

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
    if (!this.authStore.isLoggedIn()) { alert('Inicia sesión para votar'); return; }
    if (this.votando()) return;

    this.votando.set(true);
    
    // Guardar estado original por si falla y actualización optimista
    const previousState = { ...this.oferta() };
    const voteType = esSpark ? 'SPARK' : 'DRIP';
    
    this.oferta.update(o => {
      let newScore = o.sparkScore || 0;
      let newVoto = o.miVoto;
      
      // Deshacer voto anterior simulado
      if (o.miVoto === 'SPARK') newScore -= 1;
      else if (o.miVoto === 'DRIP') newScore -= -1;

      if (o.miVoto === voteType) {
        newVoto = 'NONE'; // Toggle off
      } else {
        newVoto = voteType; // Toggle on o Switch
        if (newVoto === 'SPARK') newScore += 1;
        else if (newVoto === 'DRIP') newScore += -1;
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
        this.votando.set(false);
      },
      error: () => {
        this.oferta.set(previousState);
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
    if (!confirm('¿Borrar comentario?')) return;
    this.http.delete(`${environment.apiUrl}/comentario/${id}`).subscribe({
      next: () => this.comentarios.update(list => list.filter(c => c.id !== id))
    });
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
    if (!userId || comentario.poll.votedUsers.includes(userId)) return;

    comentario.poll.options[index].votes++;
    comentario.poll.totalVotes++;
    comentario.poll.votedUsers.push(userId);

    this.http.put(`${environment.apiUrl}/comentario/${comentario.id}`, { 
      pollJson: JSON.stringify(comentario.poll) 
    }).subscribe();
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
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n- (.*?)/g, '<li>$1</li>')
      .replace(/### (.*?)\n/g, '<h4>$1</h4>');
  }
}
