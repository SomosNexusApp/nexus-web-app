import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, of, startWith, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { environment } from '../../../../environments/enviroment';
import { AuthStore } from '../../../core/auth/auth-store';
import { SearchService } from '../../../core/services/search.service';
import { ToastService } from '../../../core/services/toast.service';
import { TipoVehiculo } from '../../../models/vehiculo.model';

export type PublishStep = 1 | 2 | 3 | 4 | 5;

@Component({
  selector: 'app-publish-vehiculo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './publish-vehiculo.component.html',
  styleUrls: ['./publish-vehiculo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishVehiculoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private authStore = inject(AuthStore);
  private searchService = inject(SearchService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  currentStep = signal<PublishStep>(1);
  uploading = signal(false);
  images = signal<{ url: string; file?: File; isPrincipal: boolean }[]>([]);
  
  isEditMode = signal(false);
  vehiculoId = signal<number | null>(null);

  @ViewChild('descInput') descInput!: ElementRef<HTMLTextAreaElement>;

  // --- FORMULARIOS ---
  step1Form = this.fb.group({
    tipoVehiculo: this.fb.control<TipoVehiculo>('COCHE', Validators.required)
  });

  step2Form = this.fb.group({
    marca: this.fb.control<string>('', [Validators.required, Validators.minLength(2)]),
    modelo: this.fb.control<string>('', [Validators.required, Validators.minLength(1)]),
    anio: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(1900),
      Validators.max(new Date().getFullYear() + 1)
    ]),
    kilometros: this.fb.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(2000000)]),
    combustible: this.fb.control<string>('GASOLINA', Validators.required),
    cambio: this.fb.control<string>('MANUAL', Validators.required),
    potencia: this.fb.control<number | null>(null, [Validators.min(1), Validators.max(2000)]),
    cilindrada: this.fb.control<number | null>(null, [Validators.min(49), Validators.max(10000)]),
    color: this.fb.control<string>('', [Validators.required, Validators.minLength(3)]),
    numeroPuertas: this.fb.control<number | null>(null),
    plazas: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), Validators.max(100)]),
    itv: this.fb.control<boolean>(false),
    garantia: this.fb.control<boolean>(false),
  });

  step3Form = this.fb.group({
    condicion: this.fb.control<string>('MUY_BUEN_ESTADO', Validators.required),
    precio: this.fb.control<number | null>(null, [Validators.required, Validators.min(100), Validators.max(10000000)]),
    tipoOferta: this.fb.control<string>('VENTA', Validators.required),
    matricula: this.fb.control<string>('', [
      Validators.pattern(/^[0-9]{4}[A-Z]{3}$|^[A-Z]{1,2}[0-9]{4}[A-Z]{1,2}$/)
    ]),
    ubicacion: this.fb.control<string>('', Validators.required),
    ciudad: this.fb.control<string>(''),
    provincia: this.fb.control<string>(''),
    cp: this.fb.control<string>('')
  });

  step4Form = this.fb.group({
    titulo: this.fb.control<string>('', [Validators.required, Validators.minLength(10), Validators.maxLength(80)]),
    descripcion: this.fb.control<string>('', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]),
  });

  // --- AUTOCOMPLETE SIGNALS ---
  marcasRaw = toSignal(this.searchService.getMarcasVehiculos(), { initialValue: [] });
  filteredMarcas = signal<string[]>([]);
  showMarcas = signal(false);

  modelosRaw = signal<string[]>([]);
  filteredModelos = signal<string[]>([]);
  showModelos = signal(false);

  sugerenciasUbi = signal<any[]>([]);
  showUbi = signal(false);

  constructor() {
    // Filtrado de Marcas (Solo lógica de filtrado, NO abre el panel)
    this.step2Form.get('marca')?.valueChanges.pipe(
      debounceTime(150),
      distinctUntilChanged()
    ).subscribe(val => {
      if (!val || val.length < 1) {
        this.filteredMarcas.set([]);
        this.showMarcas.set(false);
        return;
      }
      const all = this.marcasRaw();
      this.filteredMarcas.set(all.filter(m => m.toLowerCase().includes(val.toLowerCase())).slice(0, 10));
    });

    // Carga de Modelos al cambiar Marca
    this.step2Form.get('marca')?.valueChanges.pipe(
      distinctUntilChanged(),
      switchMap(marca => {
        if (marca && this.marcasRaw().includes(marca)) {
          return this.searchService.getModelosPorMarca(marca);
        }
        return of([]);
      })
    ).subscribe(mods => {
      // Limpiar modelos de cosas raras (códigos, paréntesis)
      const cleanMods = mods.map(m => m.split('(')[0].trim()).filter(m => m.length > 0);
      this.modelosRaw.set([...new Set(cleanMods)]);
    });

    // Filtrado de Modelos (Solo lógica, NO abre el panel)
    this.step2Form.get('modelo')?.valueChanges.pipe(
      debounceTime(150),
      distinctUntilChanged()
    ).subscribe(val => {
      if (!val || val.length < 1) {
        this.filteredModelos.set([]);
        this.showModelos.set(false);
        return;
      }
      const all = this.modelosRaw();
      this.filteredModelos.set(all.filter(m => m.toLowerCase().includes(val.toLowerCase())).slice(0, 15));
    });

    // Ubicación OSM
    this.step3Form.get('ubicacion')?.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(q => q && q.length > 1 ? this.searchService.buscarUbicacionEstructurada(q) : of([]))
    ).subscribe(res => {
      this.sugerenciasUbi.set(res);
      this.showUbi.set(res.length > 0);
    });
  }

  ngOnInit(): void {
    if (!this.authStore.isLoggedIn()) {
      this.router.navigate(['/login']);
    }

    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.isEditMode.set(true);
        this.vehiculoId.set(Number(idStr));
        this.cargarVehiculoParaEdicion(Number(idStr));
      }
    });
  }

  private cargarVehiculoParaEdicion(id: number): void {
    this.http.get<any>(`${environment.apiUrl}/vehiculo/${id}`).subscribe({
      next: (v) => {
        // Mapear datos a los formularios
        this.step1Form.patchValue({ tipoVehiculo: v.tipoVehiculo });
        this.step2Form.patchValue({
          marca: v.marca,
          modelo: v.modelo,
          anio: v.anio,
          kilometros: v.kilometros,
          combustible: v.combustible,
          cambio: v.cambio,
          potencia: v.potencia,
          cilindrada: v.cilindrada,
          color: v.color,
          numeroPuertas: v.numeroPuertas,
          plazas: v.plazas,
          itv: v.itv,
          garantia: v.garantia
        });
        this.step3Form.patchValue({
          condicion: v.condicion,
          precio: v.precio,
          tipoOferta: v.tipoOferta,
          matricula: v.matricula,
          ubicacion: v.ubicacion
        });
        this.step4Form.patchValue({
          titulo: v.titulo,
          descripcion: v.descripcion
        });

        // Imágenes
        if (v.imagenPrincipal) {
          this.images.update(imgs => [...imgs, { url: v.imagenPrincipal, isPrincipal: true }]);
        }
        if (v.galeriaImagenes && v.galeriaImagenes.length > 0) {
          v.galeriaImagenes.forEach((url: string) => {
            this.images.update(imgs => [...imgs, { url, isPrincipal: false }]);
          });
        }
      },
      error: () => this.toast.error('Error al cargar el vehículo')
    });
  }

  // Métodos para abrir paneles SOLO al escribir
  onInputMarca() { this.showMarcas.set(this.step2Form.get('marca')?.value ? true : false); }
  onInputModelo() { this.showModelos.set(this.step2Form.get('modelo')?.value ? true : false); }
  onInputUbi() { this.showUbi.set(this.step3Form.get('ubicacion')?.value ? true : false); }

  selectTipo(tipo: TipoVehiculo) {
    this.step1Form.patchValue({ tipoVehiculo: tipo });
    this.nextStep();
  }

  selectMarca(m: string) {
    // Usamos emitEvent: false para que no se disparen suscripciones innecesarias al seleccionar
    this.step2Form.get('marca')?.setValue(m, { emitEvent: true });
    this.showMarcas.set(false);
    this.step2Form.get('modelo')?.setValue(''); // Reset modelo al cambiar marca
  }

  selectModelo(m: string) {
    this.step2Form.get('modelo')?.setValue(m, { emitEvent: true });
    this.showModelos.set(false);
  }

  selectUbi(ubi: any) {
    this.step3Form.patchValue({
      ubicacion: ubi.display,
      ciudad: ubi.ciudad,
      provincia: ubi.provincia,
      cp: ubi.cp
    });
    this.showUbi.set(false);
  }

  cerrarPaneles() {
    setTimeout(() => {
      this.showMarcas.set(false);
      this.showModelos.set(false);
      this.showUbi.set(false);
    }, 250);
  }

  getErrorMessage(form: any, controlName: string): string {
    const control = form.get(controlName);
    // SOLO mostrar si ha sido interactuado
    if (!control || !control.invalid || (!control.dirty && !control.touched)) return '';
    
    if (control.hasError('required')) return 'Obligatorio';
    if (control.hasError('min')) return `Mín: ${control.errors?.['min'].min}`;
    if (control.hasError('max')) return `Máx: ${control.errors?.['max'].max}`;
    if (control.hasError('minlength')) return `Mín ${control.errors?.['minlength'].requiredLength} carac.`;
    if (control.hasError('pattern')) return 'Formato incorrecto';
    return 'Inválido';
  }

  private scrollToFirstError() {
    setTimeout(() => {
      const firstError = document.querySelector('.ng-invalid.ng-touched');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Si es un input, darle foco
        (firstError as HTMLElement).focus();
      }
    }, 100);
  }

  nextStep() {
    const s = this.currentStep();
    if (!this.canAdvance()) {
      this.handleValidationErrors(s);
      return;
    }

    if (s === 4) {
      this.validarModeracionYContinuar();
    } else {
      this.advance();
    }
  }

  private advance(): void {
    this.currentStep.update(s => (s + 1) as PublishStep);
    window.scrollTo(0, 0);
  }

  private validarModeracionYContinuar(): void {
    const s4 = this.step4Form.getRawValue();
    const texto = `${s4.titulo} ${s4.descripcion}`;
    
    this.uploading.set(true);
    this.http.post<any>(`${environment.apiUrl}/api/moderation/check-text`, { texto }).subscribe({
      next: (res) => {
        this.uploading.set(false);
        if (res.apropiado) {
          this.advance();
        } else {
          this.toast.error('No podemos incluir este tipo de palabras en el título o descripción al publicar un vehículo');
        }
      },
      error: (err) => {
        this.uploading.set(false);
        if (err.status === 403 || err.status === 401) {
          this.toast.error('Error de permisos en la moderación. Contacta con soporte.');
        } else {
          this.advance();
        }
      }
    });
  }

  private handleValidationErrors(s: number): void {
    // Feedback específico según el paso
    const currentForm = this.getCurrentForm();
    if (currentForm) {
      currentForm.markAllAsTouched();
      this.toast.warning('Revisa los campos marcados en rojo');
      this.scrollToFirstError();
    } else if (s === 1 && this.step1Form.invalid) {
      this.step1Form.markAllAsTouched();
      this.toast.warning('Selecciona el tipo de vehículo para continuar');
      document.querySelector('.step-0-grid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (s === 4 && this.images().length === 0) {
      this.toast.warning('Sube al menos una imagen del vehículo');
      // Scroll al área de imágenes
      document.querySelector('.upload-zone')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private getCurrentForm() {
    if (this.currentStep() === 2) return this.step2Form;
    if (this.currentStep() === 3) return this.step3Form;
    if (this.currentStep() === 4) return this.step4Form;
    return null;
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => (s - 1) as PublishStep);
      window.scrollTo(0, 0);
    }
  }

  canAdvance(): boolean {
    const s = this.currentStep();
    if (s === 1) return this.step1Form.valid;
    if (s === 2) return this.step2Form.valid;
    if (s === 3) return this.step3Form.valid;
    if (s === 4) return this.step4Form.valid && this.images().length > 0;
    return true;
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
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

  removeImage(i: number): void {
    this.images.update((imgs) => {
      const filtered = imgs.filter((_, idx) => idx !== i);
      filtered.forEach((img, idx) => (img.isPrincipal = idx === 0));
      return filtered;
    });
  }

  // ── DESCRIPCIÓN Y PEGADO DE IMÁGENES ───────────────────────────────
  formatText(type: string): void {
    const el = this.descInput?.nativeElement;
    if (!el) return;
    
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);
    
    let result = '';
    let newCursorPos = end;

    switch (type) {
        case 'bold':
            result = before + `**${selected || 'texto'}**` + after;
            newCursorPos = selected ? end + 4 : start + 2;
            break;
        case 'italic':
            result = before + `*${selected || 'texto'}*` + after;
            newCursorPos = selected ? end + 2 : start + 1;
            break;
        case 'list':
            result = before + `\n- ${selected || 'elemento'}` + after;
            newCursorPos = selected ? end + 3 : start + 3;
            break;
        case 'header':
            result = before + `\n### ${selected || 'Título'}` + after;
            newCursorPos = selected ? end + 5 : start + 5;
            break;
    }

    if (result) {
        this.step4Form.patchValue({ descripcion: result });
        setTimeout(() => {
            el.focus();
            el.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    }
  }

  @HostListener('window:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    if (this.currentStep() !== 4) return;
    const items = event.clipboardData?.items;
    if (!items) return;
    
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) files.push(file);
        }
    }
    
    if (files.length > 0) {
        if (this.images().length + files.length > 10) {
            this.toast.warning('Máximo 10 fotos por vehículo');
            return;
        }
        files.forEach((file) => {
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
  }

  async onSubmit() {
    if (this.uploading()) return;

    if (!this.canAdvance()) {
      const currentForm = this.getCurrentForm();
      currentForm?.markAllAsTouched();
      this.toast.warning('Por favor, completa todos los campos requeridos');
      this.scrollToFirstError();
      return;
    }

    const uid = this.authStore.user()?.id;
    if (!uid) return;

    this.uploading.set(true);
    const formData = new FormData();
    const s1 = this.step1Form.value;
    const s2 = this.step2Form.value;
    const s3 = this.step3Form.value;
    const s4 = this.step4Form.value;

    const vehiculoData = {
      titulo: s4.titulo,
      descripcion: s4.descripcion,
      precio: s3.precio,
      tipoOferta: s3.tipoOferta,
      tipoVehiculo: s1.tipoVehiculo,
      condicion: s3.condicion,
      marca: s2.marca,
      modelo: s2.modelo,
      anio: s2.anio,
      kilometros: s2.kilometros,
      combustible: s2.combustible,
      cambio: s2.cambio,
      potencia: s2.potencia,
      cilindrada: s2.cilindrada,
      color: s2.color,
      numeroPuertas: s2.numeroPuertas || (s1.tipoVehiculo === 'COCHE' ? 5 : 0),
      plazas: s2.plazas,
      matricula: s3.matricula,
      itv: s2.itv,
      garantia: s2.garantia,
      ubicacion: s3.ubicacion,
      estadoVehiculo: 'DISPONIBLE'
    };

    formData.append('vehiculo', new Blob([JSON.stringify(vehiculoData)], { type: 'application/json' }));
    const principal = this.images().find(img => img.isPrincipal) || this.images()[0];
    if (principal?.file) formData.append('imagenPrincipal', principal.file);
    this.images().filter(img => !img.isPrincipal && img.file).forEach(img => {
      formData.append('galeria', img.file!);
    });

    const obs$ = this.isEditMode()
      ? this.http.put(`${environment.apiUrl}/vehiculo/${this.vehiculoId()}`, formData)
      : this.http.post(`${environment.apiUrl}/vehiculo/publicar/${uid}`, formData);

    obs$.subscribe({
      next: (res: any) => this.router.navigate(['/vehiculos', res.id]),
      error: () => {
        this.uploading.set(false);
        this.toast.error('Error al publicar. Revisa los datos.');
      }
    });
  }
}
