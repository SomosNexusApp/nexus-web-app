import {
  Component, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { AdminService } from '../admin.service';
import { AdminUsuario, PagedResult } from '../admin.models';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { environment } from '../../../environments/enviroment';

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AvatarComponent],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
})
export class UsuariosAdminComponent implements OnInit {
  private svc = inject(AdminService);

  result = signal<PagedResult<AdminUsuario> | null>(null);
  loading = signal(true);
  selectedUser = signal<AdminUsuario | null>(null);
  panelOpen = signal(false);

  // Filters
  q = '';
  tipo = '';
  verificado = '';
  estado = '';
  page = 0;

  // Modals
  showSuspenderModal = signal(false);
  showBanModal = signal(false);
  showDesbanModal = signal(false);
  showAvisoModal = signal(false);
  showImpersonarModal = signal(false);

  // Modal form fields
  motivoSuspension = '';
  duracionHoras = 24;
  motivoBan = '';
  motivoDesban = '';
  mensajeAviso = '';
  confirmarImpersonar = false;

  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.loadUsuarios();
    this.search$.pipe(debounceTime(400)).subscribe(() => {
      this.page = 0;
      this.loadUsuarios();
    });
  }

  onSearch(): void { this.search$.next(this.q); }

  loadUsuarios(): void {
    this.loading.set(true);
    const params: any = { page: this.page, size: 20 };
    if (this.q) params.q = this.q;
    if (this.tipo) params.tipo = this.tipo;
    if (this.verificado) params.verificado = this.verificado;
    if (this.estado) params.estado = this.estado;

    this.svc.getUsuarios(params).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openPanel(u: AdminUsuario): void {
    this.selectedUser.set(u);
    this.panelOpen.set(true);
  }

  closePanel(): void { this.panelOpen.set(false); }

  openApp(username: string): void {
    window.open(`${environment.appUrl}/perfil/${username}`, '_blank');
  }

  verificar(): void {
    const u = this.selectedUser();
    if (!u) return;
    this.svc.verificarUsuario(u.id).subscribe(() => this.loadUsuarios());
  }

  doSuspender(): void {
    const u = this.selectedUser();
    if (!u || !this.motivoSuspension) return;
    this.svc.suspenderUsuario(u.id, this.motivoSuspension, this.duracionHoras).subscribe(() => {
      this.showSuspenderModal.set(false);
      this.motivoSuspension = '';
      this.loadUsuarios();
    });
  }

  doBanear(): void {
    const u = this.selectedUser();
    if (!u || !this.motivoBan) return;
    this.svc.banearUsuario(u.id, this.motivoBan).subscribe(() => {
      this.showBanModal.set(false);
      this.motivoBan = '';
      this.loadUsuarios();
    });
  }

  doDesbanear(): void {
    const u = this.selectedUser();
    if (!u || !this.motivoDesban) return;
    this.svc.desbanearUsuario(u.id, this.motivoDesban).subscribe(() => {
      this.showDesbanModal.set(false);
      this.motivoDesban = '';
      this.loadUsuarios();
    });
  }

  doEnviarAviso(): void {
    const u = this.selectedUser();
    if (!u || this.mensajeAviso.length < 20) return;
    this.svc.enviarAviso(u.id, this.mensajeAviso).subscribe(() => {
      this.showAvisoModal.set(false);
      this.mensajeAviso = '';
    });
  }

  doImpersonar(): void {
    const u = this.selectedUser();
    if (!u || !this.confirmarImpersonar) return;
    this.svc.impersonarUsuario(u.id).subscribe(res => {
      this.showImpersonarModal.set(false);
      this.confirmarImpersonar = false;
      window.open(`${environment.appUrl}?impToken=${res.token}`, '_blank');
    });
  }

  prevPage(): void { if (this.page > 0) { this.page--; this.loadUsuarios(); } }
  nextPage(): void {
    const r = this.result();
    if (r && this.page < r.totalPages - 1) { this.page++; this.loadUsuarios(); }
  }

  estadoLabel(u: AdminUsuario): string {
    if (u.baneado) return 'BANEADO';
    if (u.suspendidoHasta) return 'SUSPENDIDO';
    return 'ACTIVO';
  }

  estadoClass(u: AdminUsuario): string {
    if (u.baneado) return 'badge-red';
    if (u.suspendidoHasta) return 'badge-orange';
    return 'badge-green';
  }
}
