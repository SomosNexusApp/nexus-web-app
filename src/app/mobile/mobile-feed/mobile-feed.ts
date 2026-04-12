declare var L: any;
import { Component, OnInit, inject, signal, effect, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SearchService, SearchParams } from '../../core/services/search.service';
import { ProductoCardComponent } from '../../shared/components/marketplace/product-card/producto-card.component';
import { OfertaCardComponent } from '../../shared/components/marketplace/oferta-card/oferta-card.component';
import { VehiculoCardComponent } from '../../shared/components/vehiculo-card/vehiculo-card.component';
import { MarketplaceItem } from '../../models/marketplace-item.model';
import { environment } from '../../../environments/enviroment';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Categoria } from '../../models/categoria.model';

export type FeedTab = 'todos' | 'ofertas' | 'nuevo' | 'segunda_mano' | 'vehiculos';
export type SubTab = 'mas_votados' | 'recientes';

@Component({
  selector: 'app-mobile-feed',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ProductoCardComponent,
    OfertaCardComponent,
    VehiculoCardComponent
  ],
  templateUrl: './mobile-feed.html',
  styleUrls: ['./mobile-feed.css']
})
export class MobileFeedComponent implements OnInit, OnDestroy {
  private searchService = inject(SearchService);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  // Estados
  selectedTab = signal<FeedTab>('todos');
  selectedSubTab = signal<SubTab>('mas_votados');
  items = signal<MarketplaceItem[]>([]);
  loading = signal(false);

  // Filtros Avanzados
  filterForm!: FormGroup;
  isFiltersOpen = signal(false);
  categoriasDisponibles = signal<Categoria[]>([]);
  marcasDisponibles = signal<any[]>([]);
  modelosDisponibles = signal<string[]>([]);
  
  // Ubicación / Mapa
  mostrandoMapaModal = signal(false);
  obteniendoUbicacion = signal(false);
  sugerenciasUbicacion = signal<any[]>([]);
  mostrandoSugerenciasUbi = signal(false);
  private map: any;
  private marker: any;
  private radiusCircle: any;

  private destroy$ = new Subject<void>();

  constructor() {
    this.initForm();
    
    // Al cambiar la pestaña, el sub-filtro o el texto de búsqueda, recargar
    effect(() => {
      this.selectedTab();
      this.selectedSubTab();
      this.searchService.searchTerm();
      this.fetchItems();
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.cargarCategorias();
    this.cargarMarcas();
    
    // Escuchar cambios en marca para cargar modelos
    this.filterForm.get('marca')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(marca => {
        this.filterForm.get('modelo')?.setValue('');
        this.cargarModelos(marca);
      });

    // Autocomplete de ubicación
    this.filterForm.get('ubicacion')?.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(q => {
        if (q && q.length > 2 && !this.obteniendoUbicacion()) {
          this.searchService.buscarUbicacionExterna(q).subscribe(s => {
            this.sugerenciasUbicacion.set(s);
            this.mostrandoSugerenciasUbi.set(s.length > 0);
          });
        } else {
          this.sugerenciasUbicacion.set([]);
          this.mostrandoSugerenciasUbi.set(false);
        }
      });

    // Escuchar cambios en el formulario para recargar automáticamente al aplicar filtros
    this.filterForm.valueChanges
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.fetchItems();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
    }
  }

  private initForm() {
    this.filterForm = this.fb.group({
      categoria: [''],
      precioMin: [''],
      precioMax: [''],
      condicion: [''],
      conEnvio: [false],
      marca: [''],
      modelo: [''],
      anioMin: [''],
      anioMax: [''],
      kmMax: [''],
      combustible: [''],
      cambio: [''],
      orden: ['relevancia'],
      ubicacion: [''],
      lat: [null],
      lng: [null],
      radius: [150],
      diasPublicacion: [''],
      potenciaMin: [''],
      cilindradaMin: [''],
      color: [''],
      numeroPuertas: [''],
      plazas: [''],
      garantia: [false],
      itv: [false]
    });
  }

  private cargarCategorias() {
    this.http.get<Categoria[]>(`${environment.apiUrl}/categorias`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(cats => this.categoriasDisponibles.set(cats));
  }

  private cargarMarcas() {
    this.searchService.getMarcasVehiculos()
      .pipe(takeUntil(this.destroy$))
      .subscribe(marcas => this.marcasDisponibles.set(marcas));
  }

  private cargarModelos(marca: string) {
    if (!marca) {
      this.modelosDisponibles.set([]);
      return;
    }
    this.searchService.getModelosPorMarca(marca)
      .pipe(takeUntil(this.destroy$))
      .subscribe(modelos => this.modelosDisponibles.set(modelos));
  }

  toggleFilters() {
    this.isFiltersOpen.update(v => !v);
  }

  // --- LÓGICA DE MAPA Y UBICACIÓN ---
  
  toggleMapa() {
    this.mostrandoMapaModal.update(v => !v);
    if (this.mostrandoMapaModal()) {
      setTimeout(() => this.initMapa(), 100);
    }
  }

  private initMapa() {
    if (typeof L === 'undefined') return;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const initialLat = this.filterForm.get('lat')?.value || 40.4168;
    const initialLng = this.filterForm.get('lng')?.value || -3.7038;

    this.map = L.map('m-filter-map', { 
      attributionControl: false,
      zoomControl: false 
    }).setView([initialLat, initialLng], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(this.map);

    this.marker = L.marker([initialLat, initialLng], { 
      draggable: true,
      icon: L.divIcon({
        className: 'nx-custom-marker',
        html: '<div class="nx-marker-dot"></div><div class="nx-marker-pulse"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    }).addTo(this.map);

    this.marker.on('dragend', () => this.updateRadiusCircle());
    this.map.on('click', (e: any) => {
      this.marker.setLatLng(e.latlng);
      this.updateRadiusCircle();
    });

    this.updateRadiusCircle();
  }

  updateRadiusCircle() {
    if (!this.map || !this.marker) return;
    const pos = this.marker.getLatLng();
    const radiusKm = this.filterForm.get('radius')?.value || 50;

    if (this.radiusCircle) {
      this.radiusCircle.setLatLng(pos);
      this.radiusCircle.setRadius(radiusKm * 1000);
    } else {
      this.radiusCircle = L.circle(pos, {
        radius: radiusKm * 1000,
        color: '#6366f1',
        fillColor: '#6366f1',
        fillOpacity: 0.1,
        weight: 1
      }).addTo(this.map);
    }
    this.map.fitBounds(this.radiusCircle.getBounds(), { padding: [20, 20] });
  }

  confirmarUbicacionMapa() {
    if (!this.marker) return;
    const pos = this.marker.getLatLng();
    this.filterForm.patchValue({
      lat: pos.lat,
      lng: pos.lng
    });
    this.reverseGeocode(pos.lat, pos.lng);
    this.mostrandoMapaModal.set(false);
  }

  seleccionarUbicacion(u: string, coords?: {lat: number, lng: number}) {
    this.filterForm.patchValue({ ubicacion: u });
    this.mostrandoSugerenciasUbi.set(false);

    if (coords && this.map && this.marker) {
      this.filterForm.patchValue({ lat: coords.lat, lng: coords.lng }, { emitEvent: false });
      this.marker.setLatLng([coords.lat, coords.lng]);
      this.map.setView([coords.lat, coords.lng], 13);
      this.updateRadiusCircle();
    }
  }

  usarUbicacionActual() {
    if (!navigator.geolocation) return;
    this.obteniendoUbicacion.set(true);
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        this.filterForm.patchValue({ lat: latitude, lng: longitude }, { emitEvent: false });
        if (this.map && this.marker) {
          this.marker.setLatLng([latitude, longitude]);
          this.map.setView([latitude, longitude], 13);
          this.updateRadiusCircle();
        }
        this.reverseGeocode(latitude, longitude);
      },
      () => this.obteniendoUbicacion.set(false)
    );
  }

  private reverseGeocode(lat: number, lng: number) {
    this.http.get<any>(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .subscribe({
        next: (res) => {
          const ciudad = res?.address?.city || res?.address?.town || res?.address?.village || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          this.filterForm.patchValue({ ubicacion: ciudad });
          this.obteniendoUbicacion.set(false);
        },
        error: () => this.obteniendoUbicacion.set(false)
      });
  }

  fetchItems() {
    this.loading.set(true);
    
    const fv = this.filterForm.value;
    const params: SearchParams = {
      q: this.searchService.searchTerm(),
      page: 0,
      size: 20,
      orden: fv.orden || (this.selectedSubTab() === 'recientes' ? 'novedades' : 'relevancia'),
      ...fv
    };

    // Ajustar parámetros según la pestaña
    switch (this.selectedTab()) {
      case 'ofertas':
        params.tipo = 'OFERTA';
        break;
      case 'nuevo':
        params.tipo = 'TODOS';
        params.condicion = 'NUEVO';
        break;
      case 'segunda_mano':
        params.tipo = 'TODOS';
        params.condicion = 'USADO';
        break;
      case 'vehiculos':
        params.tipo = 'VEHICULO';
        break;
      default:
        params.tipo = 'TODOS';
    }

    this.searchService.buscar(params).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  limpiarFiltros() {
    this.filterForm.reset({
      categoria: '',
      precioMin: '',
      precioMax: '',
      condicion: '',
      conEnvio: false,
      marca: '',
      modelo: '',
      anioMin: '',
      anioMax: '',
      kmMax: '',
      combustible: '',
      cambio: '',
      orden: 'relevancia',
      diasPublicacion: '',
      potenciaMin: '',
      cilindradaMin: '',
      color: '',
      numeroPuertas: '',
      plazas: '',
      garantia: false,
      itv: false
    });
  }

  setTab(tab: FeedTab) {
    this.selectedTab.set(tab);
    // Auto-ajustar tipo en el form si se cambia tab
    if (tab === 'vehiculos') {
      this.filterForm.patchValue({ categoria: '' }, { emitEvent: false });
    }
  }

  setSubTab(tab: SubTab) {
    this.selectedSubTab.set(tab);
  }
}
