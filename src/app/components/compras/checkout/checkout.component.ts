import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  loadStripe,
  Stripe,
  StripeCardNumberElement,
  StripeCardExpiryElement,
  StripeCardCvcElement,
} from '@stripe/stripe-js';

import { environment } from '../../../../environments/enviroment';
import { AuthStore } from '../../../core/auth/auth-store';
import { PagoService } from '../../../core/services/pago.service';
import { CompraService } from '../../../core/services/compra.service';
import { Producto } from '../../../models/producto.model';
import { TipoEnvio } from '../../../models/compra.model';
import { PuntoRecogidaSelector, PuntoRecogida } from '../../../shared/components/punto-recogida-selector/punto-recogida-selector';

const MAX_PRICE = 1000;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PuntoRecogidaSelector],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private authStore = inject(AuthStore);
  private compraSrv = inject(CompraService);
  private pagoService = inject(PagoService);
  private cdr = inject(ChangeDetectorRef);

  // ── Estado ────────────────────────────────────────────────────────────
  producto = signal<Producto | null>(null);
  cargando = signal(true);
  procesando = signal(false);
  errorGeneral = signal<string | null>(null);
  errorStripe = signal<string | null>(null);
  proteccionOpen = signal(false);

  tipoEnvio = signal<TipoEnvio>('DOMICILIO');
  esRecogida = signal<boolean>(false);
  
  mostrarSelectorPunto = signal<boolean>(false);
  puntoRecogidaSeleccionado = signal<PuntoRecogida | null>(null);

  /** Precio de envío recibido del backend (o calculado localmente como fallback) */
  costoEnvioBackend = signal<number>(0);
  precioVenta = signal<number>(0);
  ahorroRecogida = signal<number>(0);
  opcionesEnvio = signal<any[]>([]);
  transportistaSeleccionado = signal<string | null>(null);

  // ── Stripe (elementos individuales) ──────────────────────────────────
  private stripe: Stripe | null = null;
  private cardNumberEl: StripeCardNumberElement | null = null;
  private cardExpiryEl: StripeCardExpiryElement | null = null;
  private cardCvcEl: StripeCardCvcElement | null = null;
  private stripeReady = false;

  // ── Métodos Guardados ──────────────────────────────────────────────────
  metodosGuardados = signal<any[]>([]);
  metodoSeleccionado = signal<string | null>(null);
  cargandoMetodos = signal(true);
  usarNuevaTarjeta = signal(false);

  // ── Formularios ───────────────────────────────────────────────────────
  personalForm!: FormGroup; // nombre, apellidos, email, telefono
  addressForm!: FormGroup; // calle, ciudad, cp, pais

  // ── Auth ──────────────────────────────────────────────────────────────
  currentUser: any = this.authStore.user;

  // ── Computed ──────────────────────────────────────────────────────────
  /**
   * Precio de envío — viene del backend en la respuesta del PaymentIntent.
   * Se actualiza cuando el usuario cambia entre domicilio/recogida.
   */
  costoEnvio = computed(() => this.costoEnvioBackend());

  comisionNexus = computed(() => {
    const p = this.producto()?.precio ?? 0;
    if (p < 20) return 1.6;
    if (p < 100) return 3.6;
    return 5.6;
  });

  total = computed(() => {
    const base = this.precioVenta() > 0 ? this.precioVenta() : (this.producto()?.precio ?? 0);
    return base + this.costoEnvio() + this.comisionNexus();
  });

  puedeComprar = computed(() => {
    const p = this.producto();
    return !!p && p.estado === 'DISPONIBLE' && p.precio <= MAX_PRICE;
  });

  // ── Init ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildForms();
    const id = this.route.snapshot.paramMap.get('productoId');
    if (id) {
      this.cargarProducto(+id);
    } else {
      this.router.navigate(['/']);
    }
    this.cargarMetodosGuardados();
  }

  ngOnDestroy(): void {
    this.cardNumberEl?.unmount();
    this.cardExpiryEl?.unmount();
    this.cardCvcEl?.unmount();
  }

  // ── Formularios ───────────────────────────────────────────────────────
  private buildForms(): void {
    const user = this.currentUser();
    this.personalForm = this.fb.group({
      nombre: [user?.nombre ?? '', [Validators.required, Validators.minLength(2)]],
      apellidos: [user?.apellidos ?? '', [Validators.required, Validators.minLength(2)]],
      email: [user?.email ?? '', [Validators.required, Validators.email]],
      telefono: [user?.telefono ?? '', [Validators.pattern(/^[+\d\s\-]{7,20}$/)]],
    });

    this.addressForm = this.fb.group({
      calle: ['', [Validators.required]],
      ciudad: ['', [Validators.required]],
      cp: ['', [Validators.required, Validators.pattern(/^\d{4,10}$/)]],
      pais: ['España', [Validators.required]],
      puntoRecogidaId: ['']
    });
  }

  // ── Cargar Tarjetas ───────────────────────────────────────────────────
  private cargarMetodosGuardados(): void {
    const u = this.currentUser();
    if (!u) {
      this.cargandoMetodos.set(false);
      return;
    }
    this.pagoService.getMetodosGuardados(u.id).subscribe({
      next: (res: any) => {
        const metodos = res.data || [];
        this.metodosGuardados.set(metodos);
        // Si no hay tarjetas, forzar "nueva tarjeta" automáticamente
        if (metodos.length === 0) {
          this.usarNuevaTarjeta.set(true);
        } else {
          // Si hay, selecciona la primera por defecto y no muestra el form de tarjeta nueva
          this.metodoSeleccionado.set(metodos[0].id);
          this.usarNuevaTarjeta.set(false);
        }
        this.cargandoMetodos.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.usarNuevaTarjeta.set(true);
        this.cargandoMetodos.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  // ── Cargar producto ───────────────────────────────────────────────────
  cargarProducto(id: number): void {
    this.cargando.set(true);
    this.errorGeneral.set(null);

    this.http.get<Producto>(`${environment.apiUrl}/producto/${id}`).subscribe({
      next: (p) => {
        if (p.estado !== 'DISPONIBLE') {
          this.errorGeneral.set('Este producto ya no está disponible.');
          this.cargando.set(false);
          this.cdr.markForCheck();
          return;
        }
        if (p.precio > MAX_PRICE) {
          this.errorGeneral.set(`No se permiten compras superiores a ${MAX_PRICE} €.`);
          this.cargando.set(false);
          this.cdr.markForCheck();
          return;
        }
        // Si el producto no admite envío, redirigir (no hay checkout para recogida en persona)
        if (!p.admiteEnvio) {
          this.errorGeneral.set(
            'Este producto solo permite recogida en persona. Contacta al vendedor por el chat.',
          );
          this.cargando.set(false);
          this.cdr.markForCheck();
          return;
        }

        this.producto.set(p);
        this.cargando.set(false);
        this.cdr.markForCheck();

        // Pre-cargar precio inicial desde el backend (sin crear nada en BD)
        this.compraSrv.consultarPrecio(p.id, false).subscribe({
          next: (resp: any) => {
            this.costoEnvioBackend.set(resp.costoEnvio);
            this.ahorroRecogida.set(resp.ahorroRecogida);
            this.opcionesEnvio.set(resp.opcionesEnvio || []);
            // Seleccionar el primero por defecto
            if (resp.opcionesEnvio?.length > 0) {
              this.transportistaSeleccionado.set(resp.opcionesEnvio[0].id);
              this.costoEnvioBackend.set(resp.opcionesEnvio[0].precio);
            }
            if (resp.precioProducto) {
              this.precioVenta.set(resp.precioProducto);
            }
            this.cdr.markForCheck();
          },
        });

        // Montar Stripe después de que Angular renderice el DOM
        setTimeout(() => this.initStripe(), 50);
      },
      error: () => {
        this.errorGeneral.set('No se pudo cargar el producto. Inténtalo de nuevo.');
        this.cargando.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  // ── Stripe — tres elementos individuales ───────────────────────────────
  private async initStripe(): Promise<void> {
    if (this.stripeReady) return;

    // Verificar que los 3 divs existen
    if (
      !document.getElementById('card-number') ||
      !document.getElementById('card-expiry') ||
      !document.getElementById('card-cvc')
    ) {
      if (this.usarNuevaTarjeta() || this.metodosGuardados().length === 0) {
        setTimeout(() => this.initStripe(), 100);
      }
      return;
    }

    try {
      this.stripeReady = true;
      this.stripe = await loadStripe(environment.stripePublicKey);
      if (!this.stripe) {
        this.stripeReady = false;
        return;
      }

      const elements = this.stripe.elements();

      const style = {
        base: {
          fontFamily: '"Outfit", "Inter", sans-serif',
          fontSize: '16px',
          color: '#ffffff',
          '::placeholder': { color: 'rgba(255,255,255,0.4)' },
          iconColor: '#818cf8',
          fontSmoothing: 'antialiased',
          ':-webkit-autofill': { color: '#ffffff' },
        },
        invalid: { color: '#fb7185', iconColor: '#fb7185' },
      };

      this.cardNumberEl = elements.create('cardNumber', { style, showIcon: true });
      this.cardExpiryEl = elements.create('cardExpiry', { style });
      this.cardCvcEl = elements.create('cardCvc', { style });

      this.cardNumberEl.mount('#card-number');
      this.cardExpiryEl.mount('#card-expiry');
      this.cardCvcEl.mount('#card-cvc');

      const onChange = (event: any) => {
        this.errorStripe.set(event.error?.message ?? null);
        this.cdr.markForCheck();
      };

      this.cardNumberEl.on('change', onChange);
      this.cardExpiryEl.on('change', onChange);
      this.cardCvcEl.on('change', onChange);
    } catch {
      this.stripeReady = false;
      this.errorStripe.set('No se pudo cargar el sistema de pagos. Recarga la página.');
      this.cdr.markForCheck();
    }
  }

  // ── Cambio tipo envío / peso / transportista ───────────────────────────────
  onPuntoSeleccionado(punto: PuntoRecogida): void {
    this.puntoRecogidaSeleccionado.set(punto);
    this.mostrarSelectorPunto.set(false);
    
    // Rellenamos el addressForm silenciosamente para que el backend tenga los datos del punto si lo requiere
    this.addressForm.patchValue({
      calle: punto.direccion,
      cp: punto.cp,
      ciudad: punto.ciudad,
      puntoRecogidaId: punto.id
    });
  }

  onTipoEnvioChange(tipo: TipoEnvio): void {
    this.tipoEnvio.set(tipo);
    // La dirección siempre es visible, solo cambia si algunos campos son requeridos
    // Para PUNTO_RECOGIDA la dirección sirve de referencia (opcional)
    const required = tipo === 'DOMICILIO';
    const calle = this.addressForm.get('calle');
    const ciudad = this.addressForm.get('ciudad');
    const cp = this.addressForm.get('cp');

    if (required) {
      calle?.setValidators([Validators.required]);
      ciudad?.setValidators([Validators.required]);
      cp?.setValidators([Validators.required, Validators.pattern(/^\d{4,10}$/)]);
    } else {
      calle?.clearValidators();
      ciudad?.clearValidators();
      cp?.clearValidators();
    }
    [calle, ciudad, cp].forEach((c) => c?.updateValueAndValidity());
  }

  /** El usuario cambia entre domicilio y punto de recogida — se re-price desde el backend */
  onEntregaChange(recogida: boolean): void {
    this.esRecogida.set(recogida);
    this.tipoEnvio.set(recogida ? 'PUNTO_RECOGIDA' : 'DOMICILIO');
    // Actualizar validadores de formulario de dirección
    const required = !recogida;
    const calle = this.addressForm.get('calle');
    const ciudad = this.addressForm.get('ciudad');
    const cp = this.addressForm.get('cp');
    if (required) {
      calle?.setValidators([Validators.required]);
      ciudad?.setValidators([Validators.required]);
      cp?.setValidators([Validators.required, Validators.pattern(/^\d{4,10}$/)]);
    } else {
      calle?.clearValidators();
      ciudad?.clearValidators();
      cp?.clearValidators();
    }
    [calle, ciudad, cp].forEach((c) => c?.updateValueAndValidity());

    const prod = this.producto();
    if (prod) {
      this.compraSrv.consultarPrecio(prod.id, recogida).subscribe({
        next: (resp: any) => {
          this.ahorroRecogida.set(resp.ahorroRecogida);
          this.opcionesEnvio.set(resp.opcionesEnvio || []);

          // Mantener el mismo transportista si sigue disponible, o el primero
          const currentId = this.transportistaSeleccionado();
          const exists = resp.opcionesEnvio?.find((o: any) => o.id === currentId);
          if (exists) {
            this.costoEnvioBackend.set(exists.precio);
          } else if (resp.opcionesEnvio?.length > 0) {
            this.transportistaSeleccionado.set(resp.opcionesEnvio[0].id);
            this.costoEnvioBackend.set(resp.opcionesEnvio[0].precio);
          } else {
            this.costoEnvioBackend.set(resp.costoEnvio);
            this.transportistaSeleccionado.set(null);
          }

          if (resp.precioProducto) {
            this.precioVenta.set(resp.precioProducto);
          }
          this.cdr.markForCheck();
        },
      });
    }
  }

  seleccionarTransportista(id: string, precio: number): void {
    this.transportistaSeleccionado.set(id);
    this.costoEnvioBackend.set(precio);
    this.cdr.markForCheck();
  }

  // ── Pagar ─────────────────────────────────────────────────────────────
  async pagar(): Promise<void> {
    const user = this.currentUser();
    const prod = this.producto();

    if (!user || !prod) return;
    if (this.procesando()) return;

    // Si tiene "usar nueva tarjeta", requiere que Stripe Elements estén listos
    if (this.usarNuevaTarjeta()) {
      if (!this.stripe || !this.cardNumberEl) {
        this.errorStripe.set(
          'El sistema de pago todavía se está cargando. Espéra un momento e inténtalo de nuevo.',
        );
        this.cdr.markForCheck();
        this.initStripe();
        return;
      }
    } else {
      if (!this.metodoSeleccionado()) {
        this.errorGeneral.set('Debes seleccionar un método de pago.');
        return;
      }
      if (!this.stripe) {
        this.stripe = await loadStripe(environment.stripePublicKey);
      }
    }

    // Marcar campos como tocados para mostrar errores
    this.personalForm.markAllAsTouched();
    this.addressForm.markAllAsTouched();

    if (this.personalForm.invalid || (this.tipoEnvio() === 'DOMICILIO' && this.addressForm.invalid)) {
      this.errorGeneral.set('Por favor, completa correctamente todos los campos obligatorios.');
      // Scroll al primer error
      document.querySelector('.invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!this.transportistaSeleccionado()) {
      this.errorGeneral.set('Por favor, selecciona una compañía de transporte.');
      return;
    }

    if (this.esRecogida() && !this.puntoRecogidaSeleccionado()) {
      this.errorGeneral.set('Por favor, selecciona un punto de Correos para recoger tu pedido.');
      return;
    }

    if (this.total() > MAX_PRICE + 10) {
      this.errorGeneral.set(`El total no puede superar los ${MAX_PRICE} €.`);
      return;
    }

    this.procesando.set(true);
    this.errorGeneral.set(null);
    this.errorStripe.set(null);
    this.cdr.markForCheck();

    try {
      const personal = this.personalForm.value;
      const addr = this.addressForm.value;
      const tipoEnv = this.tipoEnvio();

      const dirCompleta = `${addr.calle}, ${addr.cp} ${addr.ciudad}, ${addr.pais}`.trim();

      // PASO 1 — PaymentIntent en backend
      const intentResp = await this.compraSrv
        .iniciarPago(
          prod.id,
          user.id,
          tipoEnv,
          tipoEnv === 'DOMICILIO' ? dirCompleta : undefined,
          tipoEnv === 'PUNTO_RECOGIDA' ? addr.puntoRecogidaId : undefined,
          this.transportistaSeleccionado() || undefined,
          this.esRecogida(),
        )
        .toPromise();

      if (!intentResp) throw new Error('Respuesta vacía del servidor.');
      const { clientSecret, compraId } = intentResp;
      // Almacenar precios del backend
      this.costoEnvioBackend.set((intentResp as any).costoEnvio ?? 0);
      this.ahorroRecogida.set((intentResp as any).ahorroRecogida ?? 0);

      // PASO 2 — confirmar pago
      let confirmResult: any;

      if (this.usarNuevaTarjeta()) {
        confirmResult = await this.stripe!.confirmCardPayment(clientSecret, {
          payment_method: {
            card: this.cardNumberEl!,
            billing_details: {
              name: `${personal.nombre} ${personal.apellidos}`.trim(),
              email: personal.email,
              phone: personal.telefono || undefined,
              address:
                tipoEnv === 'DOMICILIO'
                  ? {
                      line1: addr.calle,
                      city: addr.ciudad,
                      postal_code: addr.cp,
                      country: 'ES',
                    }
                  : undefined,
            },
          },
        });
      } else {
        confirmResult = await this.stripe!.confirmCardPayment(clientSecret, {
          payment_method: this.metodoSeleccionado()!,
        });
      }

      const { paymentIntent, error } = confirmResult;

      if (error) {
        this.errorStripe.set(error.message ?? 'El pago fue rechazado.');
        this.procesando.set(false);
        this.cdr.markForCheck();
        return;
      }

      const confirmBody: any = {
        paymentIntentId: paymentIntent?.id,
        metodoEntrega: 'ENVIO_PAQUETERIA',
        nombreDestinatario: `${personal.nombre} ${personal.apellidos}`.trim(),
        precioEnvio: this.costoEnvio(),
        telefono: personal.telefono,
        pesoKg: (intentResp as any).pesoKg,
        transportista: this.transportistaSeleccionado() || 'ESTANDAR',
      };

      if (tipoEnv === 'DOMICILIO') {
        confirmBody.direccion = addr.calle;
        confirmBody.ciudad = addr.ciudad;
        confirmBody.codigoPostal = addr.cp;
        confirmBody.pais = addr.pais;
      }

      await this.compraSrv.confirmarPago(compraId, confirmBody).toPromise();

      // PASO 4 — navegar a confirmación
      this.router.navigate(['/compras', compraId], {
        queryParams: { pago: 'ok' },
        replaceUrl: true,
      });
    } catch (err: any) {
      const msg = err?.error?.error ?? err?.message ?? 'Error al procesar el pago.';
      this.errorGeneral.set(msg);
      this.procesando.set(false);
      this.cdr.markForCheck();
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  getAvatarFallback(nombre?: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : 'V';
  }

  formatPrice(val: number): string {
    return (
      val.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + ' €'
    );
  }

  volver(): void {
    const id = this.producto()?.id;
    this.router.navigate(id ? ['/productos', id] : ['/']);
  }

  hasError(form: FormGroup, field: string): boolean {
    const c = form.get(field);
    return !!c && c.invalid && c.touched;
  }

  getBrandIcon(brand: string): string {
    const b = brand.toLowerCase();
    if (b === 'visa') return 'fa-brands fa-cc-visa';
    if (b === 'mastercard') return 'fa-brands fa-cc-mastercard';
    if (b === 'amex') return 'fa-brands fa-cc-amex';
    if (b === 'discover') return 'fa-brands fa-cc-discover';
    return 'fa-solid fa-credit-card';
  }

  toggleNuevaTarjeta(usarNueva: boolean) {
    this.usarNuevaTarjeta.set(usarNueva);
    if (!usarNueva) {
      if (this.metodosGuardados().length > 0) {
        this.metodoSeleccionado.set(this.metodosGuardados()[0].id);
      }
    } else {
      this.metodoSeleccionado.set(null);
      this.stripeReady = false; // Reset to force elements recreation
      setTimeout(() => this.initStripe(), 50);
    }
  }

  seleccionarMetodo(id: string) {
    this.metodoSeleccionado.set(id);
    this.usarNuevaTarjeta.set(false);
  }
}
