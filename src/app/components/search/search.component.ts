import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, catchError } from 'rxjs/operators';

import { SearchService, SearchParams, SearchResultItem } from '../../core/services/search.service';
import { ProductoCardComponent } from '../../shared/components/producto-card/producto-card.component';
import { OfertaCardComponent } from '../../shared/components/oferta-card/oferta-card.component';
import { Categoria } from '../../models/categoria.model';
import { environment } from '../../../environments/enviroment';

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
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private searchService = inject(SearchService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef); // Fundamental para evitar el error NG0100

  // --- FORMULARIO Y ESTADOS ---
  filterForm!: FormGroup;

  // Estado de resultados de búsqueda
  resultados: SearchResultItem[] = [];
  cargando = true;
  cargandoMas = false;
  totalResultados = 0;
  busquedaRealizada = false;

  // Paginación y Scroll Infinito
  paginaActual = 0;
  sizePorPagina = 20;
  hayMasResultados = true;
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
  private observer!: IntersectionObserver;

  // Estado UI
  isMobileFiltersOpen = false;
  esBusquedaVehiculo = false;
  obteniendoUbicacion = false; // Para mostrar un spinner en el botón "Cerca de mí"

  // Control de suscripciones (Memory Leak Prevention)
  private destroy$ = new Subject<void>();
  private formSub!: Subscription;

  // Listas de datos dinámicos (APIs)
  sugerenciasUbicacion: string[] = [];
  mostrandoSugerenciasUbi = false;
  marcasDisponibles: string[] = [];
  modelosDisponibles: string[] = [];
  categoriasDisponibles: Categoria[] = [];

  // --- CICLO DE VIDA ---

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
  }

  // --- 1. INICIALIZACIÓN Y CONFIGURACIÓN ---

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

      // --- FILTROS COMPLETOS DE VEHÍCULOS ---
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

    // Detectar si el usuario cambia el tipo manualmente a VEHICULO para mostrar los filtros de motor
    this.filterForm
      .get('tipo')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((tipo) => {
        this.esBusquedaVehiculo = tipo === 'VEHICULO';
        // Si sale de la pestaña vehículos, podríamos limpiar los campos de motor para no enviar basura en la URL
        if (!this.esBusquedaVehiculo) {
          this.limpiarFiltrosMotor();
        }
        this.cdr.detectChanges(); // Previene NG0100
      });

    // Escuchar cualquier cambio en el formulario y sincronizar con la URL
    this.formSub = this.filterForm.valueChanges
      .pipe(
        debounceTime(600), // Esperamos a que el usuario termine de escribir o mover el slider
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        takeUntil(this.destroy$),
      )
      .subscribe((valores) => {
        this.actualizarURL(valores);
      });
  }

  // --- 2. CARGA DE DATOS ESTÁTICOS / API EXTERNA ---

  private cargarCategorias(): void {
    this.http
      .get<Categoria[]>(`${environment.apiUrl}/categorias`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => []),
      )
      .subscribe((categorias) => {
        this.categoriasDisponibles = categorias;
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

  // --- 3. SINCRONIZACIÓN CON LA URL ---

  private escucharCambiosURL(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      // 1. Desactivamos la escucha del formulario temporalmente para no crear un bucle infinito
      if (this.formSub) this.formSub.unsubscribe();

      // 2. Comprobar si estamos en modo Vehículo por URL explícita
      this.esBusquedaVehiculo =
        params['tipo'] === 'VEHICULO' || this.router.url.includes('vehiculos');

      // 3. Volcar los parámetros de la URL al formulario (conversión segura)
      this.filterForm.patchValue(
        {
          q: params['q'] || '',
          tipo: params['tipo'] || 'TODOS',
          categoria: params['categoria'] ? Number(params['categoria']) : '',
          precioMin: params['precioMin'] || '',
          precioMax: params['precioMax'] || '',
          condicion: params['condicion'] || '',
          ubicacion: params['ubicacion'] || '',
          conEnvio: params['conEnvio'] === 'true',
          orden: params['orden'] || 'relevancia',

          // Vehículos
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
      ); // ¡Clave! emitEvent: false evita que se dispare valueChanges

      // Si la URL traía marca, necesitamos cargar dinámicamente sus modelos
      if (params['marca']) {
        this.cargarModelos(params['marca']);
      }

      // 4. Reactivamos la escucha del formulario
      this.formSub = this.filterForm.valueChanges
        .pipe(
          debounceTime(600),
          distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
          takeUntil(this.destroy$),
        )
        .subscribe((valores) => this.actualizarURL(valores));

      // 5. Ejecutamos la búsqueda basada en la URL que acaba de cargar
      this.realizarBusqueda(true);
    });
  }

  private actualizarURL(valoresFormulario: any): void {
    const queryParams: any = {};

    // Limpieza de parámetros vacíos, nulos o falsos para mantener la URL limpia
    Object.keys(valoresFormulario).forEach((key) => {
      const value = valoresFormulario[key];
      if (value !== null && value !== undefined && value !== '' && value !== false) {
        queryParams[key] = value;
      }
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge', // Respeta parámetros extra que pudiera haber
      replaceUrl: false, // true = no guarda en el historial de navegación. false es mejor para buscadores.
    });
  }

  // --- 4. LÓGICA CORE DE BÚSQUEDA ---

  private realizarBusqueda(reiniciarPaginacion: boolean = false): void {
    if (reiniciarPaginacion) {
      this.cargando = true;
      this.paginaActual = 0;
      this.resultados = [];
      this.hayMasResultados = true;
      this.cdr.detectChanges(); // Previene NG0100
    } else {
      this.cargandoMas = true;
    }

    const params: SearchParams = {
      ...this.filterForm.value,
      page: this.paginaActual,
      size: this.sizePorPagina,
    };

    this.searchService
      .buscar(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (nuevosResultados) => {
          // Si el backend devuelve menos del tamaño de página, ya no hay más resultados en BD
          if (nuevosResultados.length < this.sizePorPagina) {
            this.hayMasResultados = false;
          }

          if (reiniciarPaginacion) {
            this.resultados = nuevosResultados;
          } else {
            // Concatena los resultados nuevos a los existentes (Scroll infinito)
            this.resultados = [...this.resultados, ...nuevosResultados];
          }

          this.totalResultados = this.resultados.length;
          this.cargando = false;
          this.cargandoMas = false;
          this.busquedaRealizada = true;

          this.cdr.detectChanges(); // Sincroniza la vista con los nuevos datos de forma segura
        },
        error: (err) => {
          console.error('Error al realizar la búsqueda:', err);
          this.cargando = false;
          this.cargandoMas = false;
          this.cdr.detectChanges();
        },
      });
  }

  // --- 5. INTERSECTION OBSERVER (Scroll Infinito Nativo) ---

  private setupIntersectionObserver(): void {
    const options = {
      root: null,
      rootMargin: '150px', // Empieza a cargar 150px antes de llegar al pie de página (UX Fluida)
      threshold: 0,
    };

    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !this.cargando && !this.cargandoMas && this.hayMasResultados) {
        this.paginaActual++;
        this.realizarBusqueda(false); // false = es una página nueva, no reiniciar
      }
    }, options);

    if (this.scrollAnchor) {
      this.observer.observe(this.scrollAnchor.nativeElement);
    }
  }

  // --- 6. AUTOCOMPLETADOS Y GEOLOCALIZACIÓN PREMIUM ---

  private escucharAutocompletados(): void {
    // Escucha el input de ubicación para llamar a Nominatim/OSM
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

    // Cargar modelos automáticamente si el usuario cambia la marca de vehículo
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
  }

  seleccionarUbicacion(ubicacion: string): void {
    this.filterForm.patchValue({ ubicacion });
    this.mostrandoSugerenciasUbi = false;
    this.cdr.detectChanges();
  }

  /**
   * FUNCIONALIDAD PREMIUM: "Cerca de mí".
   * Usa HTML5 Geolocation API y geocodificación inversa (Reverse Geocoding)
   */
  usarUbicacionActual(): void {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    this.obteniendoUbicacion = true;
    this.mostrandoSugerenciasUbi = false;
    this.cdr.detectChanges();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Geocodificación Inversa usando Nominatim (Gratuito y sin API Key)
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;

        this.http.get<any>(url).subscribe({
          next: (res) => {
            if (res && res.address) {
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
            // Fallback si falla la geocodificación
            alert('No se pudo resolver el nombre de tu ciudad.');
            this.cdr.detectChanges();
          },
        });
      },
      (error) => {
        console.warn('Error obteniendo geolocalización:', error);
        this.obteniendoUbicacion = false;
        if (error.code === 1) alert('Debes dar permisos de ubicación a tu navegador.');
        this.cdr.detectChanges();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  // --- 7. UTILIDADES DE LA UI ---

  limpiarFiltros(): void {
    this.filterForm.reset({
      q: this.filterForm.get('q')?.value, // Mantenemos la palabra clave de búsqueda
      tipo: 'TODOS',
      conEnvio: false,
      garantia: false,
      itv: false,
      orden: 'relevancia',
    });
    this.modelosDisponibles = [];
    this.cdr.detectChanges();
  }

  limpiarFiltrosMotor(): void {
    this.filterForm.patchValue({
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
    });
  }

  toggleMobileFilters(): void {
    this.isMobileFiltersOpen = !this.isMobileFiltersOpen;
    // Previene el scroll del body principal cuando el modal de filtros está abierto en móvil
    if (this.isMobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    this.cdr.detectChanges();
  }
}
