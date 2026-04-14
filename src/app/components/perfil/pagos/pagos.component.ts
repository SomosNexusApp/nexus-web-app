import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagoService } from '../../../core/services/pago.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { AuthStore } from '../../../core/auth/auth-store';
import { environment } from '../../../../environments/environment';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, ConfirmModalComponent],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagosComponent implements OnInit, OnDestroy {
  private pagoService = inject(PagoService);
  private authStore = inject(AuthStore);
  private cdr = inject(ChangeDetectorRef);
  private toast = inject(ToastService);

  @ViewChild('confirmDeleteModal') confirmDeleteModal!: ConfirmModalComponent;
  private methodIdToDelete: string | null = null;

  user = this.authStore.user;

  metodos = signal<any[]>([]);
  cargando = signal(true);

  // Añadir nueva tarjeta
  mostrandoFormulario = signal(false);
  procesando = signal(false);
  errorStripe = signal<string | null>(null);
  nombreTitular = signal('');

  private stripe: Stripe | null = null;
  private cardEl: StripeCardElement | null = null;
  private clientSecret: string | null = null;

  ngOnInit() {
    this.cargarMetodos();
  }

  ngOnDestroy() {
    this.cardEl?.unmount();
  }

  cargarMetodos() {
    const u: any = this.user();
    if (!u) return;
    this.cargando.set(true);
    this.pagoService.getMetodosGuardados(u.id).subscribe({
      next: (res: any) => {
        this.metodos.set(res.data || []);
        this.cargando.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  eliminarMetodo(id: string) {
    this.methodIdToDelete = id;
    this.confirmDeleteModal.open();
  }

  confirmarEliminacion() {
    if (!this.methodIdToDelete) return;

    this.pagoService.eliminarMetodo(this.methodIdToDelete).subscribe({
      next: () => {
        this.metodos.update((ms) => ms.filter((m) => m.id !== this.methodIdToDelete));
        this.toast.success('Método de pago eliminado');
        this.methodIdToDelete = null;
      },
      error: () => this.toast.error('Error al eliminar el método de pago'),
    });
  }

  async iniciarAnadirTarjeta() {
    const u: any = this.user();
    if (!u) return;
    this.mostrandoFormulario.set(true);
    this.procesando.set(true);
    this.errorStripe.set(null);
    this.cdr.markForCheck();

    try {
      const { clientSecret } = (await this.pagoService.crearSetupIntent(u.id).toPromise()) as any;
      this.clientSecret = clientSecret;

      this.stripe = await loadStripe(environment.stripePublicKey);
      if (!this.stripe) throw new Error('Error al cargar Stripe');

      const elements = this.stripe.elements();

      const style = {
        base: {
          fontFamily: '"Inter", "Helvetica Neue", Helvetica, sans-serif',
          fontSize: '15px',
          color: '#ffffff',
          '::placeholder': { color: '#94a3b8' },
          iconColor: '#818cf8',
        },
        invalid: { color: '#fb7185', iconColor: '#fb7185' },
      };

      this.cardEl = elements.create('card', { style, hidePostalCode: true });

      // Esperar a que el contenedor renderice
      setTimeout(() => {
        this.cardEl?.mount('#card-element-setup');

        this.cardEl?.on('change', (event: any) => {
          this.errorStripe.set(event.error?.message ?? null);
          this.cdr.markForCheck();
        });

        this.procesando.set(false);
        this.cdr.markForCheck();
      }, 100);
    } catch (err: any) {
      this.errorStripe.set('No se pudo inicializar el formulario de pago.');
      this.procesando.set(false);
      this.cdr.markForCheck();
    }
  }

  cancelarAnadir() {
    this.mostrandoFormulario.set(false);
    this.cardEl?.unmount();
    this.clientSecret = null;
    this.nombreTitular.set('');
  }

  async confirmarTarjeta() {
    if (!this.stripe || !this.cardEl || !this.clientSecret) return;

    this.procesando.set(true);
    this.errorStripe.set(null);
    this.cdr.markForCheck();

    const { setupIntent, error } = await this.stripe.confirmCardSetup(this.clientSecret, {
      payment_method: {
        card: this.cardEl,
        billing_details: {
          name: this.nombreTitular() || this.user()?.nombre + ' ' + this.user()?.apellidos,
        },
      },
    });

    if (error) {
      this.errorStripe.set(error.message ?? 'No se pudo guardar la tarjeta.');
      this.procesando.set(false);
      this.cdr.markForCheck();
    } else if (setupIntent && setupIntent.status === 'succeeded') {
      this.cancelarAnadir();
      this.cargarMetodos(); // Recargar métodos
    }
  }

  getBrandIcon(brand: string): string {
    const b = brand.toLowerCase();
    if (b === 'visa') return 'fa-brands fa-cc-visa';
    if (b === 'mastercard') return 'fa-brands fa-cc-mastercard';
    if (b === 'amex') return 'fa-brands fa-cc-amex';
    if (b === 'discover') return 'fa-brands fa-cc-discover';
    return 'fa-solid fa-credit-card';
  }
}
