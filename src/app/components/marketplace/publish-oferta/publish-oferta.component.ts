import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith, delay, of, debounceTime } from 'rxjs';

import { environment } from '../../../../environments/enviroment';
import { AuthStore } from '../../../core/auth/auth-store';
import { Categoria } from '../../../models/categoria.model';
import { OfertaCardComponent } from '../../../shared/components/marketplace/oferta-card/oferta-card.component';

@Component({
  selector: 'app-publish-oferta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, OfertaCardComponent],
  templateUrl: './publish-oferta.component.html',
  styleUrls: ['./publish-oferta.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishOfertaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private authStore = inject(AuthStore);

  categorias = signal<Categoria[]>([]);
  selectedCategory = signal<Categoria | null>(null);
  images = signal<{ url: string; file?: File; isPrincipal: boolean }[]>([]);
  uploading = signal(false);
  verificandoLink = signal(false);
  linkVerificado = signal(false);
  favicon = signal<string | null>(null);

  // Mapa de iconos SVG basado en el campo 'icono' del backend
  iconPaths: Record<string, string> = {
    'cpu': 'M4 4h16v16H4V4zm0 5h16M4 15h16M9 4v16M15 4v16',
    'shirt': 'M6.5 2h11l1 4-5 3v11H9.5V9l-5-3z',
    'home': 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    'car': 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12.4V16c0 .6.4 1 1 1h2',
    'laptop': 'M2 16h20M2 16v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2M2 16V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10',
    'gamepad': 'M6 12h4M12 12h.01M15 10v4M18 12h.01M3 7h18a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z',
    'bicycle': 'M12 12a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 0l-3-9h6l-3 9z',
    'book': 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V4.5A2.5 2.5 0 0 1 6.5 2H20v15H6.5a2.5 2.5 0 0 0-2.5 2.5z',
    'toy-brick': 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
    'building': 'M3 21h18M3 7v14M21 21V7M9 21V3h6v18'
  };

  ofertaForm = this.fb.group({
    urlOferta: ['', [Validators.required, Validators.pattern(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/)]],
    titulo: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(100)]],
    descripcion: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
    precioOferta: [null as number | null, [Validators.required, Validators.min(0)]],
    precioOriginal: [null as number | null, [Validators.min(0)]],
    tienda: ['', [Validators.required]],
    codigoDescuento: [''],
    esOnline: [true],
    ciudadOferta: [''],
    gastosEnvio: [null as number | null],
    fechaExpiracion: [''],
  });

  formValue = toSignal(this.ofertaForm.valueChanges.pipe(startWith(this.ofertaForm.value), debounceTime(50)));

  previewOferta = computed(() => {
    const val = this.formValue();
    const imgs = this.images();
    
    return {
      id: 9999,
      titulo: val?.titulo || 'Título de tu oferta',
      precio: val?.precioOferta ?? 0,
      precioOferta: val?.precioOferta ?? undefined,
      precioOriginal: val?.precioOriginal ?? undefined,
      // Si no hay imágenes, usamos un placeholder profesional de Nexus
      imagenPrincipal: imgs.length > 0 ? imgs[0].url : 'https://images.unsplash.com/photo-1555421689-491a97ff2040?q=80&w=1000&auto=format&fit=crop', 
      tienda: val?.tienda || 'Tienda',
      fechaPublicacion: new Date(),
      fechaExpiracion: val?.fechaExpiracion ? new Date(val.fechaExpiracion) : undefined,
      badge: this.calculateBadge(val?.precioOferta, val?.precioOriginal),
      sparkCount: 42,
      dripCount: 5,
      miVoto: null,
      searchType: 'OFERTA' as const
    } as any;
  });

  discountPercent = computed(() => {
    const val = this.formValue();
    const off = val?.precioOferta;
    const orig = val?.precioOriginal;
    if (!off || !orig || orig <= off) return 0;
    return Math.round(((orig - off) / orig) * 100);
  });

  ngOnInit(): void {
    if (!this.authStore.isLoggedIn()) { this.router.navigate(['/login']); return; }
    this.cargarCategorias();
  }

  private cargarCategorias(): void {
    this.http.get<Categoria[]>(`${environment.apiUrl}/categorias/raiz`).subscribe({
      next: (res) => this.categorias.set(res),
      error: (err) => console.error(err)
    });
  }

  getIconPath(cat: Categoria): string {
    return this.iconPaths[cat.icono || ''] || 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01';
  }

  private calculateBadge(off?: number | null, orig?: number | null): string {
    if (off !== undefined && off !== null && off <= 0) return 'GRATUITA';
    if (!off || !orig || orig <= 0) return 'NUEVA';
    const pct = Math.round(((orig - off) / orig) * 100);
    return pct >= 50 ? 'CHOLLAZO' : 'PORCENTAJE';
  }

  verifyLink(): void {
    const url = this.ofertaForm.get('urlOferta')?.value;
    if (!url || this.ofertaForm.get('urlOferta')?.invalid) return;
    this.verificandoLink.set(true);
    of(true).pipe(delay(800)).subscribe(() => {
      this.verificandoLink.set(false);
      this.linkVerificado.set(true);
      try {
        const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
        const hostname = urlObj.hostname.replace('www.', '');
        const domain = hostname.split('.')[0];
        if (!this.ofertaForm.get('tienda')?.value) {
          this.ofertaForm.patchValue({ tienda: domain.charAt(0).toUpperCase() + domain.slice(1) });
        }
        this.favicon.set(`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`);
      } catch(e) {}
    });
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.images.update((imgs) => [...imgs, { url: e.target.result, file, isPrincipal: imgs.length === 0 }]);
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

  selectCategory(cat: Categoria): void { this.selectedCategory.set(cat); }

  getErrorMessage(controlName: string): string {
    const control = this.ofertaForm.get(controlName);
    if (!control || !control.invalid || !control.touched) return '';
    if (control.hasError('required')) return 'Obligatorio';
    if (control.hasError('minlength')) return `Mín ${control.errors?.['minlength'].requiredLength} carac.`;
    if (control.hasError('pattern')) return 'URL no válida';
    return 'Inválido';
  }

  async onSubmit(): Promise<void> {
    if (this.ofertaForm.invalid || !this.selectedCategory()) { this.ofertaForm.markAllAsTouched(); return; }
    this.uploading.set(true);
    const formData = new FormData();
    const val = this.ofertaForm.value;
    const ofertaData = { ...val, categoria: { id: this.selectedCategory()?.id } };
    formData.append('oferta', new Blob([JSON.stringify(ofertaData)], { type: 'application/json' }));
    const principal = this.images().find(img => img.isPrincipal) || this.images()[0];
    if (principal?.file) formData.append('imagenPrincipal', principal.file);
    this.images().filter(img => img !== principal && img.file).forEach(img => formData.append('galeria', img.file!));
    const uid = this.authStore.user()?.id;
    this.http.post(`${environment.apiUrl}/oferta/${uid}`, formData).subscribe({
      next: (res: any) => this.router.navigate(['/search'], { queryParams: { q: res.titulo, tipo: 'OFERTA' } }),
      error: () => this.uploading.set(false)
    });
  }
}
