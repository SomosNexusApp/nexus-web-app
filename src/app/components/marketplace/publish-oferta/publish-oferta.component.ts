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
import { startWith, delay, of } from 'rxjs';

import { environment } from '../../../../environments/enviroment';
import { AuthStore } from '../../../core/auth/auth-store';
import { Categoria } from '../../../models/categoria.model';
import { OfertaCardComponent } from '../../../shared/components/marketplace/oferta-card/oferta-card.component';
import { MarketplaceItem } from '../../../models/marketplace-item.model';

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

  // --- ESTADO ---
  categorias = signal<Categoria[]>([]);
  selectedCategory = signal<Categoria | null>(null);
  images = signal<{ url: string; file?: File; isPrincipal: boolean }[]>([]);
  uploading = signal(false);
  verificandoLink = signal(false);
  linkVerificado = signal(false);
  favicon = signal<string | null>(null);

  private BANNED_WORDS = ['estafa', 'ilegal', 'casino', 'apuestas', 'viagra', 'droga'];

  ofertaForm = this.fb.group({
    urlOferta: ['', [Validators.required, Validators.pattern(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/)]],
    titulo: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', [Validators.maxLength(500)]],
    precioOferta: [null as number | null, [Validators.required, Validators.min(0)]],
    precioOriginal: [null as number | null, [Validators.min(0)]],
    tienda: ['', [Validators.required]],
    codigoDescuento: [''],
    esOnline: [true],
    ciudadOferta: [''],
    gastosEnvio: [null as number | null],
    fechaExpiracion: [''],
  });

  formValue = toSignal(
    this.ofertaForm.valueChanges.pipe(startWith(this.ofertaForm.value))
  );

  previewOferta = computed(() => {
    const val = this.formValue();
    const imgs = this.images();
    
    // Objeto seguro para que el card no se rompa
    return {
      id: 9999,
      titulo: val?.titulo || 'Título de tu gran oferta',
      precio: val?.precioOferta || 0,
      precioOferta: val?.precioOferta || undefined,
      precioOriginal: val?.precioOriginal || undefined,
      imagenPrincipal: imgs.length > 0 ? imgs[0].url : '/assets/placeholder-image.webp',
      tienda: val?.tienda || 'Tu Tienda Favorita',
      fechaPublicacion: new Date().toISOString(),
      fechaExpiracion: val?.fechaExpiracion ? new Date(val.fechaExpiracion).toISOString() : undefined,
      codigoDescuento: val?.codigoDescuento || undefined,
      badge: this.calculateBadge(val?.precioOferta, val?.precioOriginal),
      sparkCount: 15, // Valor demo para que se vea vivo
      dripCount: 2,
      miVoto: null,
      searchType: 'OFERTA' as const
    } as unknown as MarketplaceItem;
  });

  discountPercent = computed(() => {
    const val = this.formValue();
    const off = val?.precioOferta;
    const orig = val?.precioOriginal;
    if (!off || !orig || orig <= 0) return 0;
    return Math.round(((orig - off) / orig) * 100);
  });

  ngOnInit(): void {
    this.cargarCategorias();
  }

  private cargarCategorias(): void {
    this.http.get<Categoria[]>(`${environment.apiUrl}/categorias/raiz`).subscribe({
      next: (res) => this.categorias.set(res),
      error: (err) => console.error('Error cargando categorías', err)
    });
  }

  private calculateBadge(off?: number | null, orig?: number | null): string {
    if (off !== undefined && off !== null && off <= 0) return 'GRATUITA';
    if (!off || !orig || orig <= 0) return 'NUEVA';
    const pct = Math.round(((orig - off) / orig) * 100);
    if (pct >= 70) return 'CHOLLAZO';
    if (pct >= 40) return 'PORCENTAJE';
    return 'NUEVA';
  }

  verifyLink(): void {
    const url = this.ofertaForm.get('urlOferta')?.value;
    if (!url || this.ofertaForm.get('urlOferta')?.invalid) return;

    this.verificandoLink.set(true);
    of(true).pipe(delay(1200)).subscribe(() => {
      this.verificandoLink.set(false);
      this.linkVerificado.set(true);
      
      if (!this.ofertaForm.get('tienda')?.value) {
        try {
          const domain = new URL(url).hostname.replace('www.', '').split('.')[0];
          this.ofertaForm.patchValue({ tienda: domain.charAt(0).toUpperCase() + domain.slice(1) });
        } catch(e) {}
      }
      
      try {
        const domain = new URL(url).hostname;
        this.favicon.set(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
      } catch(e) {}
    });
  }

  onFileSelected(event: any): void {
    const files: FileList = (event.target as HTMLInputElement).files || (event.dataTransfer as DataTransfer).files;
    if (!files) return;

    if (this.images().length + files.length > 5) {
      alert('El límite máximo es de 5 fotos.');
      return;
    }

    // Usamos FileReader (Base64) para evitar fallos catastróficos con NgOptimizedImage en la vista previa
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

  selectCategory(cat: Categoria): void {
    this.selectedCategory.set(cat);
  }

  async onSubmit(): Promise<void> {
    if (this.ofertaForm.invalid || !this.selectedCategory() || this.uploading()) {
      this.ofertaForm.markAllAsTouched();
      if (!this.selectedCategory()) alert('Por favor, selecciona la categoría de la oferta.');
      else alert('Por favor, revisa los campos obligatorios.');
      return;
    }

    const val = this.ofertaForm.value;
    const textToCheck = `${val.titulo} ${val.descripcion}`.toLowerCase();
    
    if (this.BANNED_WORDS.some(word => textToCheck.includes(word))) {
      alert('Tu oferta contiene términos que violan nuestras normas de comunidad.');
      return;
    }

    const uid = this.authStore.user()?.id;
    if (!uid) {
      alert('Debes iniciar sesión para publicar una oferta.');
      return;
    }

    this.uploading.set(true);
    const formData = new FormData();

    const ofertaData = {
      titulo: val.titulo,
      descripcion: val.descripcion,
      precioOferta: val.precioOferta,
      precioOriginal: val.precioOriginal,
      tienda: val.tienda,
      urlOferta: val.urlOferta,
      codigoDescuento: val.codigoDescuento,
      esOnline: val.esOnline,
      ciudadOferta: val.esOnline ? null : val.ciudadOferta,
      gastosEnvio: val.gastosEnvio,
      fechaExpiracion: val.fechaExpiracion ? new Date(val.fechaExpiracion).toISOString() : null,
      categoria: { id: this.selectedCategory()?.id }
    };

    formData.append('oferta', new Blob([JSON.stringify(ofertaData)], { type: 'application/json' }));

    const principal = this.images().find((img) => img.isPrincipal) || this.images()[0];
    if (principal?.file) formData.append('imagenPrincipal', principal.file);

    this.images()
      .filter((img) => img !== principal && img.file)
      .forEach((img) => formData.append('galeria', img.file!));

    this.http.post(`${environment.apiUrl}/oferta/${uid}`, formData).subscribe({
      next: (res: any) => this.router.navigate(['/ofertas', res.id]),
      error: (err) => {
        console.error('Error publicando:', err);
        alert(err.error?.error || 'Ocurrió un error inesperado al publicar la oferta.');
        this.uploading.set(false);
      }
    });
  }
}
