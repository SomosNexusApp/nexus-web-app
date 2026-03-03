import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, forkJoin, of, combineLatest, BehaviorSubject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  takeUntil,
  catchError,
  tap,
  map,
} from 'rxjs/operators';

/* ─────────────────────────────── models ─────────────────────────────── */
export type ResultType = 'TODOS' | 'PRODUCTO' | 'OFERTA' | 'VEHICULO';
export type OrderBy = 'relevancia' | 'reciente' | 'precio_asc' | 'precio_desc' | 'valorado';

export interface SearchResult {
  id: number;
  tipo: 'PRODUCTO' | 'OFERTA' | 'VEHICULO';
  titulo: string;
  precio?: number;
  precioOriginal?: number;
  imagenPrincipal?: string;
  descripcion?: string;
  tipoOferta?: string;
  sparkScore?: number;
  badge?: string;
  estadoProducto?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  km?: number;
  fechaPublicacion?: string;
  descuento?: number;
  ciudad?: string;
}

const API = '/api';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent implements OnInit, OnDestroy {
  @ViewChild('sentinel') sentinel!: ElementRef;

  /* ── state ── */
  form!: FormGroup;
  results: SearchResult[] = [];
  totalResults = 0;
  isLoading = false;
  isLoadingMore = false;
  showMobileFilters = false;
  activeType: ResultType = 'TODOS';
  marcas: string[] = [];
  categorias: any[] = [];

  currentPage = 0;
  pageSize = 20;
  hasMore = true;
  searchTerm = '';

  private destroy$ = new Subject<void>();
  private trigger$ = new BehaviorSubject<{ reset: boolean }>({ reset: true });
  private observer?: IntersectionObserver;

  readonly orderOptions: { value: OrderBy; label: string }[] = [
    { value: 'relevancia', label: 'Relevancia' },
    { value: 'reciente', label: 'Más reciente' },
    { value: 'precio_asc', label: 'Precio ascendente' },
    { value: 'precio_desc', label: 'Precio descendente' },
    { value: 'valorado', label: 'Más valorado' },
  ];

  readonly condiciones = [
    { value: 'NUEVO', label: 'Nuevo' },
    { value: 'COMO_NUEVO', label: 'Como nuevo' },
    { value: 'MUY_BUEN_ESTADO', label: 'Muy buen estado' },
    { value: 'BUEN_ESTADO', label: 'Buen estado' },
    { value: 'ACEPTABLE', label: 'Aceptable' },
  ];

  readonly tiposVehiculo = ['COCHE', 'MOTO', 'FURGONETA', 'SCOOTER'];
  readonly combustibles = ['GASOLINA', 'DIESEL', 'ELECTRICO', 'HIBRIDO'];
  readonly cambios = ['MANUAL', 'AUTOMATICO'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  /* ─────────────────────────── lifecycle ─────────────────────────── */
  ngOnInit(): void {
    this.buildForm();
    this.loadMarcas();
    this.loadCategorias();

    /* Init form from URL */
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.searchTerm = params['q'] ?? '';
      this.activeType = (params['tipo'] as ResultType) ?? 'TODOS';
      this.patchFormFromParams(params);
      this.resetAndSearch();
    });

    /* Watch form changes → update URL */
    this.form.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.syncUrl());

    /* Actual search trigger */
    this.trigger$
      .pipe(
        switchMap(({ reset }) => {
          if (reset) {
            this.currentPage = 0;
            this.results = [];
            this.hasMore = true;
          }
          this.isLoading = reset;
          this.isLoadingMore = !reset;
          this.cdr.markForCheck();
          return this.fetchResults(this.currentPage);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (res.reset) {
          this.results = res.items;
        } else {
          this.results = [...this.results, ...res.items];
        }
        this.totalResults = res.total;
        this.hasMore = this.results.length < res.total;
        this.isLoading = false;
        this.isLoadingMore = false;
        this.cdr.markForCheck();
        if (this.hasMore) this.setupIntersection();
      });
  }

  ngAfterViewInit() {
    this.setupIntersection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.observer?.disconnect();
  }

  /* ─────────────────────────── form build ─────────────────────────── */
  private buildForm(): void {
    this.form = this.fb.group({
      q: [''],
      tipo: ['TODOS'],
      ordenarPor: ['relevancia'],
      precioMin: [null],
      precioMax: [null],
      condicion: [null],
      ubicacion: [''],
      conEnvio: [false],
      categoria: [null],
      // vehicle
      tipoVehiculo: [null],
      combustible: [null],
      marca: [null],
      anioMin: [null],
      anioMax: [null],
      kmMax: [null],
      cambio: [null],
    });
  }

  private patchFormFromParams(p: any): void {
    this.form.patchValue(
      {
        q: p['q'] ?? '',
        tipo: p['tipo'] ?? 'TODOS',
        ordenarPor: p['ordenarPor'] ?? 'relevancia',
        precioMin: p['precioMin'] ? +p['precioMin'] : null,
        precioMax: p['precioMax'] ? +p['precioMax'] : null,
        condicion: p['condicion'] ?? null,
        ubicacion: p['ubicacion'] ?? '',
        conEnvio: p['conEnvio'] === 'true',
        categoria: p['categoria'] ?? null,
        tipoVehiculo: p['tipoVehiculo'] ?? null,
        combustible: p['combustible'] ?? null,
        marca: p['marca'] ?? null,
        anioMin: p['anioMin'] ? +p['anioMin'] : null,
        anioMax: p['anioMax'] ? +p['anioMax'] : null,
        kmMax: p['kmMax'] ? +p['kmMax'] : null,
        cambio: p['cambio'] ?? null,
      },
      { emitEvent: false },
    );
    this.activeType = (p['tipo'] as ResultType) ?? 'TODOS';
  }

  /* ─────────────────────────── url sync ─────────────────────────── */
  private syncUrl(): void {
    const v = this.form.value;
    const qp: any = {};
    Object.entries(v).forEach(([k, val]) => {
      if (val !== null && val !== '' && val !== false) qp[k] = val;
    });
    this.router.navigate([], { queryParams: qp, replaceUrl: true });
  }

  /* ─────────────────────────── fetch logic ─────────────────────────── */
  private fetchResults(page: number) {
    const v = this.form.value;
    const tipo: ResultType = v.tipo ?? 'TODOS';
    const reset = page === 0;

    const prodParams: any = { pagina: page, tamano: this.pageSize };
    const ofertaParams: any = { pagina: page, tamañoPagina: this.pageSize };
    const vehParams: any = { pagina: page, tamano: this.pageSize };

    if (v.q) {
      prodParams.busqueda = v.q;
      ofertaParams.busqueda = v.q;
      vehParams.q = v.q;
    }
    if (v.precioMin) {
      prodParams.precioMin = v.precioMin;
      ofertaParams.precioMin = v.precioMin;
      vehParams.precioMin = v.precioMin;
    }
    if (v.precioMax) {
      prodParams.precioMax = v.precioMax;
      ofertaParams.precioMax = v.precioMax;
      vehParams.precioMax = v.precioMax;
    }
    if (v.categoria) {
      ofertaParams.categoria = v.categoria;
    }
    if (v.tipoVehiculo) {
      vehParams.tipo = v.tipoVehiculo;
    }
    if (v.combustible) {
      vehParams.combustible = v.combustible;
    }
    if (v.marca) {
      vehParams.marca = v.marca;
    }
    if (v.anioMin) {
      vehParams.anioMin = v.anioMin;
    }
    if (v.kmMax) {
      vehParams.kmMax = v.kmMax;
    }

    const prod$ = this.http
      .get<any>(`${API}/producto/filtrar`, { params: prodParams })
      .pipe(catchError(() => of({ contenido: [], totalElementos: 0 })));
    const oferta$ = this.http
      .get<any>(`${API}/oferta/filtrar`, { params: ofertaParams })
      .pipe(catchError(() => of({ ofertas: [], totalElementos: 0 })));
    const veh$ = this.http
      .get<any>(`${API}/vehiculo/filtrar`, { params: vehParams })
      .pipe(catchError(() => of({ contenido: [], totalElementos: 0 })));

    let combined$;

    if (tipo === 'PRODUCTO') {
      combined$ = prod$.pipe(
        map((r) => ({
          items: this.mapProductos(r.contenido ?? []),
          total: r.totalElementos ?? 0,
          reset,
        })),
      );
    } else if (tipo === 'OFERTA') {
      combined$ = oferta$.pipe(
        map((r) => ({
          items: this.mapOfertas(r.ofertas ?? []),
          total: r.totalElementos ?? 0,
          reset,
        })),
      );
    } else if (tipo === 'VEHICULO') {
      combined$ = veh$.pipe(
        map((r) => ({
          items: this.mapVehiculos(r.contenido ?? []),
          total: r.totalElementos ?? 0,
          reset,
        })),
      );
    } else {
      combined$ = forkJoin([prod$, oferta$, veh$]).pipe(
        map(([p, o, v]) => {
          const all = [
            ...this.mapProductos(p.contenido ?? []),
            ...this.mapOfertas(o.ofertas ?? []),
            ...this.mapVehiculos(v.contenido ?? []),
          ].sort((a, b) => {
            const da = a.fechaPublicacion ? new Date(a.fechaPublicacion).getTime() : 0;
            const db = b.fechaPublicacion ? new Date(b.fechaPublicacion).getTime() : 0;
            return db - da;
          });
          const total = (p.totalElementos ?? 0) + (o.totalElementos ?? 0) + (v.totalElementos ?? 0);
          return { items: all, total, reset };
        }),
      );
    }

    return combined$;
  }

  /* ─────────────────── mappers ─────────────────── */
  private mapProductos(arr: any[]): SearchResult[] {
    return (arr ?? []).map((p) => ({
      id: p.id,
      tipo: 'PRODUCTO' as const,
      titulo: p.titulo,
      precio: p.precio,
      imagenPrincipal: p.imagenPrincipal,
      descripcion: p.descripcion,
      estadoProducto: p.estadoProducto,
      tipoOferta: p.tipoOferta,
      fechaPublicacion: p.fechaPublicacion,
      ciudad: p.ubicacion,
    }));
  }

  private mapOfertas(arr: any[]): SearchResult[] {
    return (arr ?? []).map((o) => ({
      id: o.id,
      tipo: 'OFERTA' as const,
      titulo: o.titulo,
      precio: o.precioOferta,
      precioOriginal: o.precioOriginal,
      imagenPrincipal: o.imagenPrincipal,
      descripcion: o.descripcion,
      sparkScore: o.sparkScore,
      badge: o.badge,
      fechaPublicacion: o.fechaPublicacion,
      descuento:
        o.precioOriginal && o.precioOferta
          ? Math.round((1 - o.precioOferta / o.precioOriginal) * 100)
          : undefined,
    }));
  }

  private mapVehiculos(arr: any[]): SearchResult[] {
    return (arr ?? []).map((v) => ({
      id: v.id,
      tipo: 'VEHICULO' as const,
      titulo: `${v.marca ?? ''} ${v.modelo ?? ''}`.trim() || v.titulo,
      precio: v.precio,
      imagenPrincipal: v.imagenPrincipal,
      descripcion: v.descripcion,
      marca: v.marca,
      modelo: v.modelo,
      anio: v.anio,
      km: v.km,
      fechaPublicacion: v.fechaPublicacion,
    }));
  }

  /* ─────────────────── actions ─────────────────── */
  setType(t: string): void {
    this.activeType = t as ResultType;
    this.form.patchValue({ tipo: t });
    this.resetAndSearch();
  }

  resetAndSearch(): void {
    this.trigger$.next({ reset: true });
  }

  loadMore(): void {
    if (this.isLoadingMore || !this.hasMore) return;
    this.currentPage++;
    this.isLoadingMore = true;
    this.fetchResults(this.currentPage).subscribe((res) => {
      this.results = [...this.results, ...res.items];
      this.isLoadingMore = false;
      this.hasMore = this.results.length < res.total;
      this.cdr.markForCheck();
      if (this.hasMore) this.setupIntersection();
    });
  }

  private loadMarcas(): void {
    this.http
      .get<string[]>(`${API}/vehiculo/marcas`)
      .pipe(
        catchError(() => of([])),
        takeUntil(this.destroy$),
      )
      .subscribe((m) => {
        this.marcas = m;
        this.cdr.markForCheck();
      });
  }

  private loadCategorias(): void {
    this.http
      .get<any[]>(`${API}/categorias`)
      .pipe(
        catchError(() => of([])),
        takeUntil(this.destroy$),
      )
      .subscribe((c) => {
        this.categorias = c;
        this.cdr.markForCheck();
      });
  }

  useGeolocation(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      this.form.patchValue({ ubicacion: `${pos.coords.latitude},${pos.coords.longitude}` });
    });
  }

  clearFilters(): void {
    this.form.reset({ tipo: this.activeType, ordenarPor: 'relevancia', conEnvio: false });
    this.resetAndSearch();
  }

  toggleMobileFilters(): void {
    this.showMobileFilters = !this.showMobileFilters;
    this.cdr.markForCheck();
  }

  trackById(_: number, item: SearchResult): number {
    return item.id;
  }

  get showVehicleFilters(): boolean {
    return this.activeType === 'VEHICULO' || this.form.value.categoria === 'vehiculos';
  }

  get skeletonArray(): number[] {
    return Array.from({ length: 12 });
  }

  /* ─────────────────── intersection observer ─────────────────── */
  private setupIntersection(): void {
    this.observer?.disconnect();
    setTimeout(() => {
      if (!this.sentinel?.nativeElement) return;
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            this.observer?.disconnect();
            this.loadMore();
          }
        },
        { threshold: 0.1 },
      );
      this.observer.observe(this.sentinel.nativeElement);
    }, 300);
  }

  formatPrice(n?: number): string {
    if (n == null) return '—';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(n);
  }

  formatKm(n?: number): string {
    if (n == null) return '';
    return new Intl.NumberFormat('es-ES').format(n) + ' km';
  }
}
