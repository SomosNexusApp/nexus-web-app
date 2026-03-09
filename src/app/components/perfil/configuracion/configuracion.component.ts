import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth-store';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastContainerComponent } from '../../../shared/components/toast-container/toast-container.component';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/enviroment';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastContainerComponent],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css'],
})
export class ConfiguracionComponent implements OnInit {
  activeSection = signal<string>('perfil');
  private backendUrl = environment.apiUrl;

  // Secciones del scrollspy
  sections = [
    { id: 'perfil', icon: 'fas fa-user', title: 'Datos del Perfil' },
    { id: 'privacidad', icon: 'fas fa-shield-alt', title: 'Privacidad' },
    { id: 'cuenta', icon: 'fas fa-building', title: 'Tipo de Cuenta' },
    { id: 'seguridad', icon: 'fas fa-lock', title: 'Seguridad' },
    { id: 'notificaciones', icon: 'fas fa-bell', title: 'Notificaciones' },
    { id: 'gdpr', icon: 'fas fa-database', title: 'Datos y Privacidad' },
  ];

  // Modelos de datos
  user: any; // Signal se inicializa en el constructor

  // Perfil
  editPerfil = signal({
    nombre: '',
    apellidos: '',
    biografia: '',
    ubicacion: '',
    telefono: '',
  });

  // Privacidad
  privacidad = signal({
    perfilPublico: true,
    mostrarUbicacion: true,
    mostrarTelefono: false,
    permitirMensajesDesconocidos: true,
    cuentaPrivada: false,
  });

  // Notificaciones
  notificaciones = signal({
    notifNuevosMensajes: true,
    notifNuevaCompra: true,
    notifValoracion: true,
    notifOfertas: true,
    notifEnvios: true,
    notifNovedades: true,
    newsletterSuscrito: false,
  });

  // Seguridad
  security = signal({
    emailActual: '',
    emailNuevo: '',
    passwordToEmail: '',
    passwordActual: '',
    passwordNueva: '',
    passwordConfirm: '',
  });

  // Modal Eliminar
  showDeleteModal = signal(false);
  deleteAccount = signal({ confirmText: '', password: '' });

  sesionesActivas = signal<any[]>([]);

  constructor(
    private authStore: AuthStore,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private toast: ToastService,
  ) {
    this.user = this.authStore.user;
  }

  ngOnInit(): void {
    if (!this.user()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.cargarDatosActuales();
    this.cargarSesiones();
  }

  scrollToSection(id: string) {
    this.activeSection.set(id);
    const element = document.getElementById(id);
    if (element) {
      // Ajuste para scroll con navbar sticky
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  cargarDatosActuales() {
    const u = this.user();
    if (!u) return;

    // Perfil
    this.editPerfil.set({
      nombre: u.nombre || '',
      apellidos: u.apellidos || '',
      biografia: u.biografia || '',
      ubicacion: u.ubicacion || '',
      telefono: u.telefono || '', // asumiendo que el modelo tiene teléfono, si no se envía vacío
    });

    // Privacidad
    this.privacidad.set({
      perfilPublico: u.perfilPublico ?? true,
      mostrarUbicacion: u.mostrarUbicacion ?? true,
      mostrarTelefono: u.mostrarTelefono ?? false,
      permitirMensajesDesconocidos:
        typeof (u as any).permitirMensajesDesconocidos === 'boolean'
          ? (u as any).permitirMensajesDesconocidos
          : true,
      cuentaPrivada: u.cuentaPrivada ?? false,
    });

    // Notificaciones
    this.notificaciones.set({
      notifNuevosMensajes:
        typeof (u as any).notifNuevosMensajes === 'boolean' ? (u as any).notifNuevosMensajes : true,
      notifNuevaCompra:
        typeof (u as any).notifNuevaCompra === 'boolean' ? (u as any).notifNuevaCompra : true,
      notifValoracion:
        typeof (u as any).notifValoracion === 'boolean' ? (u as any).notifValoracion : true,
      notifOfertas: typeof (u as any).notifOfertas === 'boolean' ? (u as any).notifOfertas : true,
      notifEnvios: typeof (u as any).notifEnvios === 'boolean' ? (u as any).notifEnvios : true,
      notifNovedades:
        typeof (u as any).notifNovedades === 'boolean' ? (u as any).notifNovedades : true,
      newsletterSuscrito:
        typeof (u as any).newsletterSuscrito === 'boolean' ? (u as any).newsletterSuscrito : false,
    });
  }

  cargarSesiones() {
    this.http.get<any[]>(`${this.backendUrl}/auth/sessions`).subscribe({
      next: (res) => this.sesionesActivas.set(res),
      error: () => console.log('Error cargando sesiones'),
    });
  }

  // ---- Funciones Perfil ----

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const u = this.user();
      if (!u) return;
      const formData = new FormData();
      formData.append('file', file);

      this.http.post<any>(`${this.backendUrl}/usuario/${u.id}/avatar`, formData).subscribe({
        next: (res) => {
          this.toast.success('Avatar actualizado correctamente');
          this.authService.loadCurrentUser().subscribe(); // Recargar datos
        },
        error: () => this.toast.error('Error al subir el avatar'),
      });
    }
  }

  guardarPerfil() {
    const u = this.user();
    if (!u) return;
    this.http.patch(`${this.backendUrl}/usuario/${u.id}`, this.editPerfil()).subscribe({
      next: () => {
        this.toast.success('Perfil actualizado');
        this.authService.loadCurrentUser().subscribe();
      },
      error: () => this.toast.error('Error guardando perfil'),
    });
  }

  usarMiUbicacion() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // En un caso real haríamos reverse geocoding.
          // Por mock usamos lat/lng string
          const coords = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
          this.editPerfil.update((f) => ({ ...f, ubicacion: coords }));
          this.toast.success('Ubicación obtenida');
        },
        () => this.toast.error('Permiso de ubicación denegado'),
      );
    }
  }

  // ---- MÉTODOS AUXILIARES TEMPLATE ----
  updatePrivacidadField(field: string, value: boolean) {
    this.privacidad.update((p: any) => ({ ...p, [field]: value }));
  }

  updateNotificacionesField(field: string, value: boolean) {
    this.notificaciones.update((n: any) => ({ ...n, [field]: value }));
  }

  updateEditPerfilField(field: string, value: string) {
    this.editPerfil.update((p: any) => ({ ...p, [field]: value }));
  }

  updateSecurityField(field: string, value: string) {
    this.security.update((s: any) => ({ ...s, [field]: value }));
  }

  updateDeleteAccountField(field: string, value: string) {
    this.deleteAccount.update((d: any) => ({ ...d, [field]: value }));
  }

  // ---- Funciones Privacidad ----

  guardarPrivacidad() {
    this.http.patch(`${this.backendUrl}/usuario/me/privacidad`, this.privacidad()).subscribe({
      next: () => this.toast.success('Ajustes de privacidad guardados'),
      error: () => this.toast.error('Error guardando privacidad'),
    });
  }

  // ---- Funciones Tipo de Cuenta ----
  setTipoCuenta(tipo: string) {
    if (tipo === 'EMPRESA') {
      this.toast.info('Migración a cuenta empresa disponible próximamente.');
      // Lógica de migración (requiere confirmación y llenado de datos extra, mock por ahora)
    }
  }

  // ---- Funciones Seguridad ----

  cambiarEmail() {
    const s = this.security();
    if (!s.emailNuevo || !s.passwordToEmail) {
      this.toast.warning('Rellena todos los campos');
      return;
    }
    this.http
      .post(`${this.backendUrl}/usuario/me/cambiar-email`, {
        emailNuevo: s.emailNuevo,
        password: s.passwordToEmail,
      })
      .subscribe({
        next: () => {
          this.toast.success('Email actualizado correctamente');
          this.updateSecurityField('emailNuevo', '');
          this.updateSecurityField('passwordToEmail', '');
        },
        error: (err) => this.toast.error(err.error?.error || 'Error al cambiar email'),
      });
  }

  cambiarPassword() {
    const s = this.security();
    if (!s.passwordActual || !s.passwordNueva || s.passwordNueva !== s.passwordConfirm) {
      this.toast.warning('Verifica los campos de contraseña');
      return;
    }
    this.http
      .post(`${this.backendUrl}/usuario/me/cambiar-password`, {
        passwordActual: s.passwordActual,
        passwordNueva: s.passwordNueva,
        confirmar: s.passwordConfirm,
      })
      .subscribe({
        next: () => {
          this.toast.success('Contraseña modificada con éxito');
          this.updateSecurityField('passwordActual', '');
          this.updateSecurityField('passwordNueva', '');
          this.updateSecurityField('passwordConfirm', '');
        },
        error: (err) => this.toast.error(err.error?.error || 'Error al modificar contraseña'),
      });
  }

  cerrarOtrasSesiones() {
    this.toast.success('Se han cerrado las demás sesiones activas');
    // Implementación real llamaría a un DELETE /sessions
  }

  // ---- Funciones Notificaciones ----

  guardarNotificaciones() {
    this.http
      .patch(`${this.backendUrl}/usuario/me/notificaciones-config`, this.notificaciones())
      .subscribe({
        next: () => this.toast.success('Preferencias de notificaciones guardadas'),
        error: () => this.toast.error('Error guardando preferencias'),
      });
  }

  // ---- Funciones GDPR ----

  descargarDatos() {
    this.http.get(`${this.backendUrl}/usuario/me/datos-personales`).subscribe({
      next: (data) => {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mis_datos_nexus_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('Descarga iniciada');
      },
      error: () => this.toast.error('Error al recuperar datos'),
    });
  }

  confirmarEliminacion() {
    if (this.deleteAccount().confirmText !== 'ELIMINAR') {
      this.toast.warning("Debes escribir 'ELIMINAR' para confirmar.");
      return;
    }
    if (!this.deleteAccount().password) {
      this.toast.warning('La contraseña es obligatoria.');
      return;
    }

    this.http
      .delete(`${this.backendUrl}/usuario/me/cuenta`, {
        body: { password: this.deleteAccount().password },
      })
      .subscribe({
        next: () => {
          this.toast.success('Cuenta eliminada permanentemente');
          this.authService.logout();
          this.router.navigate(['/']);
        },
        error: (err) =>
          this.toast.error(err.error?.error || 'Contraseña incorrecta o error al eliminar'),
      });
  }
}
