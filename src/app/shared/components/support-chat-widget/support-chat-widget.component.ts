import {
  Component,
  inject,
  signal,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter, interval, Subscription } from 'rxjs';
import { SupportChatService, SoporteMsg } from '../../../core/services/support-chat.service';
import { AuthStore } from '../../../core/auth/auth-store';

@Component({
  selector: 'app-support-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support-chat-widget.component.html',
  styleUrls: ['./support-chat-widget.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportChatWidgetComponent implements OnDestroy {
  private support = inject(SupportChatService);
  private router = inject(Router);
  private auth = inject(AuthStore);
  private cdr = inject(ChangeDetectorRef);

  open = signal(false);
  loading = signal(false);
  mensajes = signal<SoporteMsg[]>([]);
  input = '';
  sessionToken = signal<string | null>(localStorage.getItem('nexus_soporte_token'));
  humanTakeover = signal(false);
  escalationEmail = signal<string | null>(null);
  hideOnAdmin = signal(false);

  private pollSub: Subscription | null = null;
  private navSub: Subscription;

  constructor() {
    this.navSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        const hide = this.router.url.includes('/admin');
        this.hideOnAdmin.set(hide);
        this.cdr.markForCheck();
      });
    this.hideOnAdmin.set(this.router.url.includes('/admin'));
  }

  ngOnDestroy(): void {
    this.navSub.unsubscribe();
    this.stopPoll();
  }

  toggle(): void {
    this.open.update((v) => !v);
    if (this.open() && !this.sessionToken()) {
      this.iniciarSesion();
    } else if (this.open() && this.sessionToken()) {
      this.refrescarMensajes();
      this.startPoll();
    } else {
      this.stopPoll();
    }
  }

  private iniciarSesion(): void {
    this.loading.set(true);
    const uid = this.auth.user()?.id;
    this.support.crearSesion(uid).subscribe({
      next: (r) => {
        localStorage.setItem('nexus_soporte_token', r.sessionToken);
        this.sessionToken.set(r.sessionToken);
        this.mensajes.set(r.mensajes || []);
        this.loading.set(false);
        this.startPoll();
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  enviar(): void {
    const t = this.input.trim();
    const tok = this.sessionToken();
    if (!t || !tok) return;
    this.input = '';
    this.support.enviar(tok, t).subscribe({
      next: (r) => {
        this.mensajes.set(r.mensajes || []);
        if (r.humanTakeover) this.humanTakeover.set(true);
        if (r.escalationEmail) this.escalationEmail.set(r.escalationEmail);
        this.cdr.markForCheck();
      },
    });
  }

  private refrescarMensajes(): void {
    const tok = this.sessionToken();
    if (!tok) return;
    this.support.poll(tok).subscribe((m) => {
      this.mensajes.set(m);
      this.cdr.markForCheck();
    });
  }

  private startPoll(): void {
    this.stopPoll();
    this.pollSub = interval(4000).subscribe(() => {
      if (this.open() && this.sessionToken()) this.refrescarMensajes();
    });
  }

  private stopPoll(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }
}
