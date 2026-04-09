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
  marcasDisponibles = signal<string[]>([]);
  modelosDisponibles = signal<string[]>([]);
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
      orden: ['relevancia']
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
        params.condicion = 'NUEVO';
        break;
      case 'segunda_mano':
        params.condicion = 'BUEN_ESTADO';
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
      orden: 'relevancia'
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
