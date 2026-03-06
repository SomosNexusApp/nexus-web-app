import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, of, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { environment } from '../../../../environments/enviroment';
import { GuestPopupService } from '../../../core/services/guest-popup.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthStore } from '../../../core/auth/auth-store';
import { SearchService } from '../../../core/services/search.service';
import { Categoria } from '../../../models/categoria.model';
import { CondicionProducto } from '../../../models/producto.model';
import { ProductoCardComponent } from '../../../shared/components/marketplace/product-card/producto-card.component';

export type PublishStep = 0 | 1 | 2 | 3 | 4;

@Component({
  selector: 'app-publish-producto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ProductoCardComponent],
  templateUrl: './publish-producto.component.html',
  styleUrls: ['./publish-producto.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishProductoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private authStore = inject(AuthStore);
  private authService = inject(AuthService);
  private guestPopupService = inject(GuestPopupService);
  private searchService = inject(SearchService);

  // ── ESTADO ────────────────────────────────────────────────────────
  currentStep = signal<PublishStep>(0);
  categorias = signal<Categoria[]>([]);
  selectedCategory = signal<Categoria | null>(null);

  images = signal<{ url: string; file?: File; isPrincipal: boolean }[]>([]);
  uploading = signal(false);

  // Formularios con tipado explícito para evitar inferencia restrictiva de 'null'
  step1Form = this.fb.group({
    categoriaId: this.fb.control<number | null>(null, Validators.required),
    condicion: this.fb.control<string | null>(null, Validators.required),
  });
  step2Form = this.fb.group({
    titulo: this.fb.control<string>('', {
      validators: [Validators.required, Validators.maxLength(80)],
      nonNullable: true,
    }),
    descripcion: this.fb.control<string>('', {
      validators: [Validators.required, Validators.maxLength(1000)],
      nonNullable: true,
    }),
    marca: this.fb.control<string>(''),
    modelo: this.fb.control<string>(''),
  });
  step3Form = this.fb.group({
    precio: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    precioNegociable: this.fb.control<boolean>(false, { nonNullable: true }),
    tipoOferta: this.fb.control<string>('VENTA', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    envio: this.fb.control<string>('NO', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    precioEnvio: this.fb.control<number>(0, { nonNullable: true }),
    peso: this.fb.control<number | null>(null),
    ubicacion: this.fb.control<string>('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  // Signals para reactividad de los formularios
  step1Value = toSignal(
    this.step1Form.valueChanges.pipe(startWith(this.step1Form.value)),
  );
  step2Value = toSignal(
    this.step2Form.valueChanges.pipe(startWith(this.step2Form.value)),
  );
  step3Value = toSignal(
    this.step3Form.valueChanges.pipe(startWith(this.step3Form.value)),
  );

  // Autocompletado Ubicación
  sugerenciasUbi = signal<string[]>([]);
  buscandoUbi = signal(false);

  previewProduct = computed(() => {
    const s1 = this.step1Value();
    const s2 = this.step2Value();
    const s3 = this.step3Value();
    const imgs = this.images();

    return {
      titulo: s2?.titulo || 'Título del anuncio',
      precio: s3?.precio || 0,
      imagenPrincipal:
        imgs.length > 0 ? imgs[0].url : '/assets/placeholder-image.webp',
      ubicacion: s3?.ubicacion || 'Ubicación',
      condicion: s1?.condicion,
      fechaPublicacion: new Date().toISOString(),
      tipoOferta: s3?.tipoOferta || 'VENTA',
      searchType: 'PRODUCTO' as const,
    };
  });

  CONDICIONES: { val: CondicionProducto; label: string; desc: string }[] = [
    { val: 'NUEVO', label: 'Nuevo', desc: 'Precintado o con etiquetas.' },
    { val: 'COMO_NUEVO', label: 'Como nuevo', desc: 'Sin marcas de uso.' },
    { val: 'MUY_BUEN_ESTADO', label: 'Muy buen estado', desc: 'Poco uso, marcas mínimas.' },
    { val: 'BUEN_ESTADO', label: 'Buen estado', desc: 'Uso normal, funciona bien.' },
    { val: 'ACEPTABLE', label: 'Aceptable', desc: 'Se nota el uso, marcas visibles.' },
  ];

  constructor() {}

  ngOnInit(): void {
    if (!this.authStore.isLoggedIn()) {
      this.guestPopupService.showPopup('Para publicar');
      this.router.navigate(['/']);
      return;
    }
    this.cargarCategorias();
    this.setupLocationSearch();
  }

  // ── FORMULARIOS ────────────────────────────────────────────────────
  private initForms(): void {
    // Ya inicializados arriba
  }

  private cargarCategorias(): void {
    this.http.get<Categoria[]>(`${environment.apiUrl}/categorias/raiz`).subscribe((res) => {
      this.categorias.set(res);
    });
  }

  private setupLocationSearch(): void {
    this.step3Form
      .get('ubicacion')
      ?.valueChanges.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((q) =>
          q && q.length > 2 ? this.searchService.buscarUbicacionExterna(q) : of([]),
        ),
      )
      .subscribe((res) => this.sugerenciasUbi.set(res));
  }

  // ── NAVEGACIÓN ─────────────────────────────────────────────────────
  setStep0(type: string): void {
    if (type === 'VEHICULO') this.router.navigate(['/publicar/vehiculo']);
    else if (type === 'OFERTA') this.router.navigate(['/publicar/oferta']);
    else this.currentStep.set(1);
  }

  nextStep(): void {
    if (this.canAdvance()) this.currentStep.update((s) => (s + 1) as PublishStep);
  }

  prevStep(): void {
    this.currentStep.update((s) => (s - 1) as PublishStep);
  }

  canAdvance(): boolean {
    const s = this.currentStep();
    if (s === 1) return this.step1Form.valid;
    if (s === 2) return this.step2Form.valid && this.images().length > 0;
    if (s === 3) return this.step3Form.valid;
    return true;
  }

  // ── CATEGORÍA ──────────────────────────────────────────────────────
  selectCategory(cat: Categoria): void {
    this.selectedCategory.set(cat);
    this.step1Form.patchValue({ categoriaId: cat.id });
  }

  // ── IMÁGENES ───────────────────────────────────────────────────────
  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (this.images().length + files.length > 8) {
      alert('Máximo 8 fotos');
      return;
    }
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.images.update((imgs) => [
          ...imgs,
          { url: e.target.result, file, isPrincipal: imgs.length === 0 },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }

  moveImage(idx: number, direction: -1 | 1): void {
    const newImgs = [...this.images()];
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= newImgs.length) return;
    [newImgs[idx], newImgs[newIdx]] = [newImgs[newIdx], newImgs[idx]];
    newImgs.forEach((img, i) => (img.isPrincipal = i === 0));
    this.images.set(newImgs);
  }

  removeImage(i: number): void {
    this.images.update((imgs) => {
      const filtered = imgs.filter((_, idx) => idx !== i);
      filtered.forEach((img, idx) => (img.isPrincipal = idx === 0));
      return filtered;
    });
  }

  // ── GEOLOCALIZACIÓN ────────────────────────────────────────────────
  useLocation(): void {
    if (!navigator.geolocation) return;
    this.buscandoUbi.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Use the search service's external location lookup via reverse geocode
        this.http
          .get<any>(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
          )
          .subscribe({
            next: (res) => {
              const ciudad =
                res?.address?.city ||
                res?.address?.town ||
                res?.address?.village ||
                res?.address?.municipality ||
                '';
              if (ciudad) this.step3Form.patchValue({ ubicacion: ciudad });
              this.buscandoUbi.set(false);
            },
            error: () => this.buscandoUbi.set(false),
          });
      },
      () => this.buscandoUbi.set(false),
    );
  }

  selectUbi(u: string): void {
    this.step3Form.patchValue({ ubicacion: u }, { emitEvent: false });
    this.sugerenciasUbi.set([]);
  }

  // ── PUBLICAR ───────────────────────────────────────────────────────
  async onSubmit(): Promise<void> {
    if (!this.canAdvance() || this.uploading()) return;
    
    const uid = this.authStore.user()?.id;
    if (!uid) {
      alert('Debes estar identificado para publicar.');
      return;
    }

    this.uploading.set(true);

    const formData = new FormData();
    
    // Extraemos los valores de los formularios de forma limpia
    const s1 = this.step1Form.value;
    const s2 = this.step2Form.value;
    const s3 = this.step3Form.value;

    const productData = {
      titulo: s2.titulo,
      descripcion: s2.descripcion,
      marca: s2.marca,
      modelo: s2.modelo,
      precio: s3.precio,
      precioNegociable: s3.precioNegociable,
      tipoOferta: s3.tipoOferta,
      admiteEnvio: s3.envio !== 'NO',
      peso: s3.peso,
      ubicacion: s3.ubicacion,
      condicion: s1.condicion,
      estado: 'DISPONIBLE',
      categoria: { id: s1.categoriaId }
    };

    formData.append(
      'producto',
      new Blob([JSON.stringify(productData)], { type: 'application/json' }),
    );

    const principal = this.images().find((img) => img.isPrincipal);
    if (principal?.file) {
      formData.append('imagenPrincipal', principal.file);
    } else if (this.images().length > 0 && this.images()[0].file) {
      // Si no hay marcada como principal por algún motivo, cogemos la primera
      formData.append('imagenPrincipal', this.images()[0].file!);
    }

    this.images()
      .filter((img) => !img.isPrincipal && img.file)
      .forEach((img) => {
        formData.append('galeria', img.file!);
      });

    this.http.post(`${environment.apiUrl}/producto/publicar/${uid}`, formData).subscribe({
      next: (res: any) => {
        this.router.navigate(['/productos', res.id]);
      },
      error: (err) => {
        console.error('Error al publicar:', err);
        const msg = err.error?.error || 'Error inesperado al publicar el producto';
        alert(msg);
        this.uploading.set(false);
      },
    });
  }
}
