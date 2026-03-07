import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  inject,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, catchError } from 'rxjs/operators';

import { SearchService, SearchParams, SearchResultItem } from '../../core/services/search.service';
import { AuthStore } from '../../core/auth/auth-store';
import { ProductoCardComponent } from '../../shared/components/marketplace/product-card/producto-card.component';
import { OfertaCardComponent } from '../../shared/components/marketplace/oferta-card/oferta-card.component';
import { VehiculoCardComponent } from '../../shared/components/vehiculo-card/vehiculo-card.component';
import { Categoria } from '../../models/categoria.model';
import { environment } from '../../../environments/enviroment';
import { MarketplaceItem } from '../../models/marketplace-item.model';

const VEHICLE_SLUGS = [
  'vehiculo',
  'vehiculos',
  'motor',
  'coches',
  'coche',
  'motos',
  'moto',
  'furgoneta',
  'camion',
  'caravana',
  'autobus',
  'quad',
  'barco',
];

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ProductoCardComponent,
    OfertaCardComponent,
    VehiculoCardComponent,
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
})
export class SearchComponent implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private searchService = inject(SearchService);
  private authStore = inject(AuthStore);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  filterForm!: FormGroup;
  resultados: MarketplaceItem[] = [];
  cargando = true;
  cargandoMas = false;
  totalResultados = 0;
  busquedaRealizada = false;

  paginaActual = 0;
  sizePorPagina = 20;
  hayMasResultados = true;
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
  private observer!: IntersectionObserver;

  isMobileFiltersOpen = false;
  esBusquedaVehiculo = false;
  obteniendoUbicacion = false;
  categoriaNombreActual = signal<string>('');

  private destroy$ = new Subject<void>();
  private formSub!: Subscription;

  sugerenciasUbicacion: string[] = [];
  mostrandoSugerenciasUbi = false;
  marcasDisponibles: string[] = [];
  modelosDisponibles: string[] = [];
  categoriasDisponibles: Categoria[] = [];

  ngOnInit(): void {
    this.initForm();
    this.cargarCategorias();
    this.cargarMarcas();
    this.escucharCambiosURL();
    this.escucharAutocompletados();
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.observer) this.observer.disconnect();
    document.body.style.overflow = '';
  }

  private initForm(): void {
    this.filterForm = this.fb.group({
      q: [''],
      tipo: ['TODOS'],
      categoria: [''],
      precioMin: [''],
      precioMax: [''],
      condicion: [''],
      ubicacion: [''],
      conEnvio: [false],
      orden: ['relevancia'],
      marca: [''],
      modelo: [''],
      anioMin: [''],
      anioMax: [''],
      kmMax: [''],
      combustible: [''],
      cambio: [''],
      potenciaMin: [''],
      cilindradaMin: [''],
      color: [''],
      numeroPuertas: [''],
      plazas: [''],
      garantia: [false],
      itv: [false],
    });

    this.filterForm
      .get('tipo')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((tipo) => {
        this.esBusquedaVehiculo = tipo === 'VEHICULO';
        if (!this.esBusquedaVehiculo) this.limpiarFiltrosMotor();
        this.cdr.detectChanges();
      });

    this.formSub = this.filterForm.valueChanges
      .pipe(
        debounceTime(600),
        distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)),
        takeUntil(this.destroy$),
      )
      .subscribe((v) => this.actualizarURL(v));
  }

  private cargarCategorias(): void {
    this.http
      .get<Categoria[]>(`${environment.apiUrl}/categorias`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => []),
      )
      .subscribe((cats) => {
        this.categoriasDisponibles = cats;
        const slugActual = this.filterForm.get('categoria')?.value;
        if (slugActual) this.actualizarTituloCat(slugActual);
        this.cdr.detectChanges();
      });
  }

  private cargarMarcas(): void {
    this.searchService
      .getMarcasVehiculos()
      .pipe(takeUntil(this.destroy$))
      .subscribe((marcas) => {
        this.marcasDisponibles = marcas;
        this.cdr.detectChanges();
      });
  }

  private cargarModelos(marca: string): void {
    if (!marca) {
      this.modelosDisponibles = [];
      this.cdr.detectChanges();
      return;
    }
    this.searchService
      .getModelosPorMarca(marca)
      .pipe(takeUntil(this.destroy$))
      .subscribe((modelos) => {
        this.modelosDisponibles = modelos;
        this.cdr.detectChanges();
      });
  }

  private escucharCambiosURL(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (this.formSub) this.formSub.unsubscribe();
      const tipoParam = params['tipo'] || 'TODOS';
      const catParam = params['categoria'] || '';
      this.esBusquedaVehiculo = tipoParam === 'VEHICULO' || this.slugEsVehiculo(catParam);
      this.actualizarTituloCat(catParam);

      this.filterForm.patchValue(
        {
          q: params['q'] || '',
          tipo: this.esBusquedaVehiculo ? 'VEHICULO' : tipoParam,
          categoria: catParam,
          precioMin: params['precioMin'] || '',
          precioMax: params['precioMax'] || '',
          condicion: params['condicion'] || '',
          ubicacion: params['ubicacion'] || '',
          conEnvio: params['conEnvio'] === 'true',
          orden: params['orden'] || 'relevancia',
          marca: params['marca'] || '',
          modelo: params['modelo'] || '',
          anioMin: params['anioMin'] || '',
          anioMax: params['anioMax'] || '',
          kmMax: params['kmMax'] || '',
          combustible: params['combustible'] || '',
          cambio: params['cambio'] || '',
          potenciaMin: params['potenciaMin'] || '',
          cilindradaMin: params['cilindradaMin'] || '',
          color: params['color'] || '',
          numeroPuertas: params['numeroPuertas'] || '',
          plazas: params['plazas'] || '',
          garantia: params['garantia'] === 'true',
          itv: params['itv'] === 'true',
        },
        { emitEvent: false },
      );

      if (params['marca']) this.cargarModelos(params['marca']);
      this.formSub = this.filterForm.valueChanges
        .pipe(debounceTime(600), takeUntil(this.destroy$))
        .subscribe((v) => this.actualizarURL(v));
      this.realizarBusqueda(true);
    });
  }

  private actualizarURL(valores: any): void {
    const queryParams: any = {};
    Object.keys(valores).forEach((k) => {
      if (valores[k] !== '' && valores[k] !== false && valores[k] !== null)
        queryParams[k] = valores[k];
    });
    this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: false });
  }

  private realizarBusqueda(reiniciar = false): void {
    if (reiniciar) {
      this.cargando = true;
      this.paginaActual = 0;
      this.resultados = [];
      this.hayMasResultados = true;
    } else {
      this.cargandoMas = true;
    }

    const fv = this.filterForm.value;
    const params: SearchParams = {
      ...fv,
      page: this.paginaActual,
      size: this.sizePorPagina,
      categoria: fv.categoria || undefined,
      precioMin: fv.precioMin || undefined,
      precioMax: fv.precioMax || undefined,
      condicion: fv.condicion || undefined,
      ubicacion: fv.ubicacion || undefined,
      conEnvio: fv.conEnvio || undefined,
    };

    const usuarioId = this.authStore.user()?.id;

    this.searchService
      .buscar(params, usuarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ items, total }) => {
          this.totalResultados = total;
          this.resultados = reiniciar ? items : [...this.resultados, ...items];
          this.hayMasResultados = this.resultados.length < total;
          this.cargando = false;
          this.cargandoMas = false;
          this.busquedaRealizada = true;
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargando = false;
          this.cargandoMas = false;
          this.cdr.detectChanges();
        },
      });
  }

  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !this.cargando && !this.cargandoMas && this.hayMasResultados) {
          this.paginaActual++;
          this.realizarBusqueda(false);
        }
      },
      { rootMargin: '150px' },
    );
    if (this.scrollAnchor) this.observer.observe(this.scrollAnchor.nativeElement);
  }

  private escucharAutocompletados(): void {
    this.filterForm
      .get('ubicacion')
      ?.valueChanges.pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((q) => {
        if (q && q.length > 2 && !this.obteniendoUbicacion) {
          this.searchService.buscarUbicacionExterna(q).subscribe((s) => {
            this.sugerenciasUbicacion = s;
            this.mostrandoSugerenciasUbi = s.length > 0;
            this.cdr.detectChanges();
          });
        } else {
          this.sugerenciasUbicacion = [];
          this.mostrandoSugerenciasUbi = false;
          this.cdr.detectChanges();
        }
      });

    this.filterForm
      .get('marca')
      ?.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((m) => {
        this.filterForm.patchValue({ modelo: '' }, { emitEvent: false });
        if (m) this.cargarModelos(m);
        else this.modelosDisponibles = [];
      });

    this.filterForm
      .get('categoria')
      ?.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((slug) => {
        this.actualizarTituloCat(slug || '');
        if (this.slugEsVehiculo(slug)) {
          this.filterForm.patchValue({ tipo: 'VEHICULO' }, { emitEvent: false });
          this.esBusquedaVehiculo = true;
        }
      });
  }

  seleccionarUbicacion(u: string): void {
    this.filterForm.patchValue({ ubicacion: u });
    this.mostrandoSugerenciasUbi = false;
  }

  private slugEsVehiculo(s: string): boolean {
    return s ? VEHICLE_SLUGS.some((kw) => s.toLowerCase().includes(kw)) : false;
  }

  private actualizarTituloCat(slug: string): void {
    if (!slug) {
      this.categoriaNombreActual.set('');
      return;
    }
    const cat = this.categoriasDisponibles.find((c) => c.slug === slug);
    this.categoriaNombreActual.set(cat ? cat.nombre : slug.charAt(0).toUpperCase() + slug.slice(1));
  }

  limpiarFiltros(): void {
    const q = this.filterForm.get('q')?.value;
    this.filterForm.reset({ q, tipo: 'TODOS', orden: 'relevancia' });
    this.esBusquedaVehiculo = false;
    this.categoriaNombreActual.set('');
  }

  private limpiarFiltrosMotor(): void {
    this.filterForm.patchValue(
      {
        marca: '',
        modelo: '',
        anioMin: '',
        anioMax: '',
        kmMax: '',
        combustible: '',
        cambio: '',
        garantia: false,
        itv: false,
      },
      { emitEvent: false },
    );
  }

  toggleMobileFilters(): void {
    this.isMobileFiltersOpen = !this.isMobileFiltersOpen;
  }

  usarUbicacionActual(): void {
    if (!navigator.geolocation) return;
    this.obteniendoUbicacion = true;
    this.cdr.detectChanges();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        this.http
          .get<any>(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          )
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              const ciudad =
                res?.address?.city ||
                res?.address?.town ||
                res?.address?.village ||
                res?.address?.municipality ||
                `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
              this.filterForm.patchValue({ ubicacion: ciudad });
              this.obteniendoUbicacion = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.filterForm.patchValue({
                ubicacion: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              });
              this.obteniendoUbicacion = false;
              this.cdr.detectChanges();
            },
          });
      },
      () => {
        this.obteniendoUbicacion = false;
        this.cdr.detectChanges();
      },
    );
  }
}
