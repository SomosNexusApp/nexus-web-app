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
import { ProductoCardComponent } from '../../shared/components/marketplace/product-card/producto-card.component';
import { OfertaCardComponent } from '../../shared/components/marketplace/oferta-card/oferta-card.component';
import { Categoria } from '../../models/categoria.model';
import { environment } from '../../../environments/enviroment';

/** Slugs/palabras que activan modo vehículo automáticamente */
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
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
})
export class SearchComponent implements OnInit, AfterViewInit, OnDestroy {
  // ── Inyección ──────────────────────────────────────────────────────
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private searchService = inject(SearchService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  // ── Formulario ─────────────────────────────────────────────────────
  filterForm!: FormGroup;

  // ── Estado de resultados ───────────────────────────────────────────
  resultados: SearchResultItem[] = [];
  cargando = true;
  cargandoMas = false;
  totalResultados = 0;
  busquedaRealizada = false;

  // ── Paginación / scroll infinito ───────────────────────────────────
  paginaActual = 0;
  sizePorPagina = 20;
  hayMasResultados = true;
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
  private observer!: IntersectionObserver;

  // ── Estado UI ──────────────────────────────────────────────────────
  isMobileFiltersOpen = false;
  esBusquedaVehiculo = false;
  obteniendoUbicacion = false;
  categoriaNombreActual = signal<string>('');

  // ── Suscripciones ──────────────────────────────────────────────────
  private destroy$ = new Subject<void>();
  private formSub!: Subscription;

  // ── Listas dinámicas ───────────────────────────────────────────────
  sugerenciasUbicacion: string[] = [];
  mostrandoSugerenciasUbi = false;
  marcasDisponibles: string[] = [];
  modelosDisponibles: string[] = [];
  categoriasDisponibles: Categoria[] = [];

  // ═══════════════════════════════════════════════════════════════════
  // CICLO DE VIDA
  // ═══════════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════════
  // 1. FORMULARIO
  // ═══════════════════════════════════════════════════════════════════

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

    // Tipo cambia manualmente → toggle filtros motor
    this.filterForm
      .get('tipo')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((tipo) => {
        const esV = tipo === 'VEHICULO';
        if (this.esBusquedaVehiculo !== esV) {
          this.esBusquedaVehiculo = esV;
          if (!esV) this.limpiarFiltrosMotor();
          this.cdr.detectChanges();
        }
      });

    // Cambios del form → actualizar URL
    this.formSub = this.filterForm.valueChanges
      .pipe(
        debounceTime(600),
        distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)),
        takeUntil(this.destroy$),
      )
      .subscribe((v) => this.actualizarURL(v));
  }

  // ═══════════════════════════════════════════════════════════════════
  // 2. CARGA DE DATOS ESTÁTICOS
  // ═══════════════════════════════════════════════════════════════════

  private cargarCategorias(): void {
    this.http
      .get<Categoria[]>(`${environment.apiUrl}/categorias`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => []),
      )
      .subscribe((cats) => {
        this.categoriasDisponibles = cats;
        // Si ya hay un param de categoría activo, actualizar el título ahora
        // que tenemos los nombres disponibles
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

  // ═══════════════════════════════════════════════════════════════════
  // 3. SINCRONIZACIÓN URL ↔ FORMULARIO
  // ═══════════════════════════════════════════════════════════════════

  private escucharCambiosURL(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (this.formSub) this.formSub.unsubscribe();

      const tipoParam = params['tipo'] || 'TODOS';
      const categoriaParam = params['categoria'] || '';

      // ── Detectar modo vehículo ──────────────────────────────
      const esVehiculoPorTipo = tipoParam === 'VEHICULO';
      const esVehiculoPorCat = this.slugEsVehiculo(categoriaParam);
      this.esBusquedaVehiculo = esVehiculoPorTipo || esVehiculoPorCat;

      // Si la categoría es de motor, forzar tipo VEHICULO
      const tipoFinal = this.esBusquedaVehiculo ? 'VEHICULO' : tipoParam;

      // ── Título dinámico ─────────────────────────────────────
      this.actualizarTituloCat(categoriaParam);

      // ── Volcar URL → form ───────────────────────────────────
      this.filterForm.patchValue(
        {
          q: params['q'] || '',
          tipo: tipoFinal,
          categoria: categoriaParam, // slug string, nunca Number
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

      // Reactivar escucha del form
      this.formSub = this.filterForm.valueChanges
        .pipe(
          debounceTime(600),
          distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)),
          takeUntil(this.destroy$),
        )
        .subscribe((v) => this.actualizarURL(v));

      this.realizarBusqueda(true);
    });
  }

  private actualizarURL(valores: any): void {
    const queryParams: any = {};
    Object.keys(valores).forEach((key) => {
      const v = valores[key];
      if (v !== null && v !== undefined && v !== '' && v !== false) {
        queryParams[key] = v;
      }
    });
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: false,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 4. BÚSQUEDA CORE
  // ═══════════════════════════════════════════════════════════════════

  private realizarBusqueda(reiniciar = false): void {
    if (reiniciar) {
      this.cargando = true;
      this.paginaActual = 0;
      this.resultados = [];
      this.hayMasResultados = true;
      this.cdr.detectChanges();
    } else {
      this.cargandoMas = true;
    }

    const fv = this.filterForm.value;

    const params: SearchParams = {
      q: fv.q,
      tipo: fv.tipo,
      categoria: fv.categoria || undefined,
      precioMin: fv.precioMin || undefined,
      precioMax: fv.precioMax || undefined,
      condicion: fv.condicion || undefined,
      ubicacion: fv.ubicacion || undefined,
      conEnvio: fv.conEnvio || undefined,
      orden: fv.orden,
      page: this.paginaActual,
      size: this.sizePorPagina,
      marca: fv.marca || undefined,
      modelo: fv.modelo || undefined,
      anioMin: fv.anioMin || undefined,
      anioMax: fv.anioMax || undefined,
      kmMax: fv.kmMax || undefined,
      combustible: fv.combustible || undefined,
      cambio: fv.cambio || undefined,
      potenciaMin: fv.potenciaMin || undefined,
      cilindradaMin: fv.cilindradaMin || undefined,
      color: fv.color || undefined,
      numeroPuertas: fv.numeroPuertas || undefined,
      plazas: fv.plazas || undefined,
      garantia: fv.garantia || undefined,
      itv: fv.itv || undefined,
    };

    this.searchService
      .buscar(params)
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
        error: (err) => {
          console.error('Error en búsqueda:', err);
          this.cargando = false;
          this.cargandoMas = false;
          this.cdr.detectChanges();
        },
      });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 5. SCROLL INFINITO
  // ═══════════════════════════════════════════════════════════════════

  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !this.cargando && !this.cargandoMas && this.hayMasResultados) {
          this.paginaActual++;
          this.realizarBusqueda(false);
        }
      },
      { root: null, rootMargin: '150px', threshold: 0 },
    );
    if (this.scrollAnchor) this.observer.observe(this.scrollAnchor.nativeElement);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 6. AUTOCOMPLETADOS Y GEOLOCALIZACIÓN
  // ═══════════════════════════════════════════════════════════════════

  private escucharAutocompletados(): void {
    // Ubicación → Nominatim
    this.filterForm
      .get('ubicacion')
      ?.valueChanges.pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        if (query && query.length > 2 && !this.obteniendoUbicacion) {
          this.searchService.buscarUbicacionExterna(query).subscribe((sugerencias) => {
            this.sugerenciasUbicacion = sugerencias;
            this.mostrandoSugerenciasUbi = sugerencias.length > 0;
            this.cdr.detectChanges();
          });
        } else {
          this.sugerenciasUbicacion = [];
          this.mostrandoSugerenciasUbi = false;
          this.cdr.detectChanges();
        }
      });

    // Marca → cargar modelos
    this.filterForm
      .get('marca')
      ?.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((marca) => {
        this.filterForm.patchValue({ modelo: '' }, { emitEvent: false });
        if (marca) {
          this.cargarModelos(marca);
        } else {
          this.modelosDisponibles = [];
          this.cdr.detectChanges();
        }
      });

    // Categoría → detectar si es de vehículos (ahora slug, no id)
    this.filterForm
      .get('categoria')
      ?.valueChanges.pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((slug) => {
        // Actualizar título
        this.actualizarTituloCat(slug || '');

        // Forzar modo motor si el slug es de vehículos
        if (this.slugEsVehiculo(slug)) {
          this.filterForm.patchValue({ tipo: 'VEHICULO' }, { emitEvent: false });
          this.esBusquedaVehiculo = true;
          this.cdr.detectChanges();
        } else if (slug === '' && this.filterForm.get('tipo')?.value === 'VEHICULO') {
          // Si borran la categoría y el tipo era VEHICULO solo por la categoría,
          // no lo reseteamos — el usuario puede haberlo elegido manualmente
        }
      });
  }

  seleccionarUbicacion(ubicacion: string): void {
    this.filterForm.patchValue({ ubicacion });
    this.mostrandoSugerenciasUbi = false;
    this.cdr.detectChanges();
  }

  usarUbicacionActual(): void {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    this.obteniendoUbicacion = true;
    this.mostrandoSugerenciasUbi = false;
    this.cdr.detectChanges();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=10&addressdetails=1`;
        this.http.get<any>(url).subscribe({
          next: (res) => {
            if (res?.address) {
              const ciudad =
                res.address.city ||
                res.address.town ||
                res.address.village ||
                res.address.county ||
                'Tu ubicación';
              this.filterForm.patchValue({ ubicacion: ciudad });
            }
            this.obteniendoUbicacion = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.obteniendoUbicacion = false;
            alert('No se pudo resolver el nombre de tu ciudad.');
            this.cdr.detectChanges();
          },
        });
      },
      (err) => {
        this.obteniendoUbicacion = false;
        if (err.code === 1) alert('Debes dar permisos de ubicación a tu navegador.');
        this.cdr.detectChanges();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // 7. HELPERS
  // ═══════════════════════════════════════════════════════════════════

  /** Devuelve true si el slug corresponde a la categoría de motor */
  private slugEsVehiculo(slug: string): boolean {
    if (!slug) return false;
    const lower = slug.toLowerCase();
    return VEHICLE_SLUGS.some((kw) => lower.includes(kw));
  }

  /**
   * Rellena `categoriaNombreActual` con el nombre bonito de la categoría.
   * Busca en las categorías cargadas por slug; si aún no están cargadas,
   * capitaliza el slug como fallback y se sobreescribirá en `cargarCategorias`.
   */
  private actualizarTituloCat(slug: string): void {
    if (!slug) {
      this.categoriaNombreActual.set('');
      return;
    }
    const cat = this.categoriasDisponibles.find(
      (c: any) => (c.slug || '').toLowerCase() === slug.toLowerCase(),
    );
    this.categoriaNombreActual.set(
      cat ? (cat as any).nombre : slug.charAt(0).toUpperCase() + slug.slice(1),
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // 8. UTILIDADES UI
  // ═══════════════════════════════════════════════════════════════════

  limpiarFiltros(): void {
    const q = this.filterForm.get('q')?.value;
    this.filterForm.reset({
      q,
      tipo: 'TODOS',
      conEnvio: false,
      garantia: false,
      itv: false,
      orden: 'relevancia',
    });
    this.modelosDisponibles = [];
    this.esBusquedaVehiculo = false;
    this.categoriaNombreActual.set('');
    this.cdr.detectChanges();
  }

  limpiarFiltrosMotor(): void {
    this.filterForm.patchValue(
      {
        marca: '',
        modelo: '',
        anioMin: '',
        anioMax: '',
        kmMax: '',
        combustible: '',
        cambio: '',
        potenciaMin: '',
        cilindradaMin: '',
        color: '',
        numeroPuertas: '',
        plazas: '',
        garantia: false,
        itv: false,
      },
      { emitEvent: false },
    );
    this.modelosDisponibles = [];
  }

  toggleMobileFilters(): void {
    this.isMobileFiltersOpen = !this.isMobileFiltersOpen;
    document.body.style.overflow = this.isMobileFiltersOpen ? 'hidden' : '';
    this.cdr.detectChanges();
  }
}
