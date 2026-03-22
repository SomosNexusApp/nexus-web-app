import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CompraService } from '../../../core/services/compra.service';
import { DevolucionService } from '../../../core/services/devolucion.service';
import { ToastService } from '../../../core/services/toast.service';
import { Compra } from '../../../models/compra.model';

@Component({
  selector: 'app-nueva-devolucion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './nueva-devolucion.component.html',
  styleUrl: './nueva-devolucion.component.css',
})
export class NuevaDevolucionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private compraSrv = inject(CompraService);
  private devSrv = inject(DevolucionService);
  private toast = inject(ToastService);

  compraId = this.route.snapshot.paramMap.get('compraId');
  compra = signal<Compra | null>(null);

  loading = signal(true);
  errorMsg = signal<string | null>(null);
  plazoExpirado = signal(false);

  // Formulario y Paginación UI (paso 1 al 3)
  pasoActual = signal<1 | 2 | 3>(1);
  devForm: FormGroup;
  fotosFiles: File[] = [];
  fotosPreviews: string[] = [];

  readonly MOTIVOS = [
    { value: 'PRODUCTO_DEFECTUOSO', label: 'Producto defectuoso o no funciona' },
    { value: 'PRODUCTO_NO_CORRESPONDE', label: 'Producto no corresponde a la descripción' },
    { value: 'DANO_EN_TRANSPORTE', label: 'Daño en el transporte' },
    { value: 'CAMBIO_DE_OPINION', label: 'Cambio de opinión' },
    { value: 'TALLA_INCORRECTA', label: 'Talla o dimension incorrecta' },
    { value: 'OTRO', label: 'Otro / Problema distinto' },
  ];

  constructor() {
    this.devForm = this.fb.group({
      motivo: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(50)]],
      direccionEnvio: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    if (!this.compraId) {
      this.errorMsg.set('ID de compra no especificado');
      this.loading.set(false);
      return;
    }

    this.compraSrv.getCompra(Number(this.compraId)).subscribe({
      next: (c) => {
        this.compra.set(c);
        this.validar15Dias(c);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se ha podido cargar la información de la compra.');
        this.loading.set(false);
      },
    });
  }

  // Verifica si han pasado menos de 7 días
  private validar15Dias(c: Compra) {
    if (c.estado !== 'ENTREGADO' && c.estado !== 'COMPLETADA') {
      this.plazoExpirado.set(true);
      this.errorMsg.set('Solo se puede solicitar devolución de artículos entregados.');
      return;
    }

    const msDiff = Date.now() - new Date(c.fechaCompra as string).getTime();
    const diasDiff = msDiff / (1000 * 3600 * 24);

    if (diasDiff > 7) {
      this.plazoExpirado.set(true);
      this.errorMsg.set('Han pasado más de 7 días desde la entrega. Plazo de devolución expirado.');
    }
  }

  // UI Navegación
  avanzar() {
    if (this.pasoActual() === 1 && this.devForm.valid) this.pasoActual.set(2);
    else if (this.pasoActual() === 2 && this.evidenciasValidas()) this.pasoActual.set(3);
  }

  retroceder() {
    if (this.pasoActual() > 1) this.pasoActual.update((p) => (p - 1) as 1 | 2 | 3);
  }

  // UI Evidencias
  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach((f) => {
        if (this.fotosFiles.length < 4) {
          this.fotosFiles.push(f);
          const reader = new FileReader();
          reader.onload = (re) => this.fotosPreviews.push(re.target?.result as string);
          reader.readAsDataURL(f);
        }
      });
    }
  }

  removeFoto(index: number) {
    this.fotosFiles.splice(index, 1);
    this.fotosPreviews.splice(index, 1);
  }

  evidenciasValidas(): boolean {
    const isOpinion = this.devForm.get('motivo')?.value === 'CAMBIO_DE_OPINION';
    if (!isOpinion && this.fotosFiles.length === 0) return false;
    return true;
  }

  // Submit
  enviarSolicitud() {
    if (this.plazoExpirado()) return;

    const fd = new FormData();
    fd.append('compraId', this.compraId!);
    fd.append('motivo', this.devForm.get('motivo')?.value);
    fd.append('descripcion', this.devForm.get('descripcion')?.value);
    fd.append('direccionEnvio', this.devForm.get('direccionEnvio')?.value);

    this.fotosFiles.forEach((f) => fd.append('fotos', f));

    this.loading.set(true);
    this.devSrv.solicitar(fd).subscribe({
      next: (d) => {
        this.toast.success('Solicitud procesada con éxito');
        this.router.navigate(['/devoluciones', d.id]);
      },
      error: (e) => {
        this.toast.error(e.error?.error || 'Error al procesar la devolución');
        this.loading.set(false);
        this.pasoActual.set(1);
      },
    });
  }
}
