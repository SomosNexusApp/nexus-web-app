import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, of, startWith, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { environment } from '../../../../environments/enviroment';
import { AuthStore } from '../../../core/auth/auth-store';
import { SearchService } from '../../../core/services/search.service';
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

  currentStep = signal<PublishStep>(1);
  uploading = signal(false);
  images = signal<{ url: string; file?: File; isPrincipal: boolean }[]>([]);

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

  nextStep() {
    if (this.canAdvance()) {
      this.currentStep.update(s => (s + 1) as PublishStep);
      window.scrollTo(0, 0);
    } else {
      // Marcar todo como touched para mostrar errores al intentar avanzar
      const currentForm = this.getCurrentForm();
      currentForm?.markAllAsTouched();
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

  async onSubmit() {
    if (this.uploading()) return;
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

    this.http.post(`${environment.apiUrl}/vehiculo/publicar/${uid}`, formData).subscribe({
      next: (res: any) => this.router.navigate(['/vehiculos', res.id]),
      error: () => {
        this.uploading.set(false);
        alert('Error al publicar. Revisa los datos.');
      }
    });
  }
}
