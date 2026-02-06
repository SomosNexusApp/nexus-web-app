// src/app/pages/vehiculos/vehiculos.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiculoCardComponent } from '../../components/vehiculo-card/vehiculo-card';
import { VehiculoService } from '../../services/vehiculo-service';
import { FilterPanel } from '../../components/filter-panel/filter-panel';
import { EmptyState } from '../../components/empty-state/empty-state';
import { LoadingSpinner } from '../../components/loading-spinner/loading-spinner';


 interface VehiculoFiltro {
  marca?: string;
  modelo?: string;
  precioMin?: number;
  precioMax?: number;
  anioMin?: number;
  anioMax?: number;
  kilometrosMax?: number;
  combustible?: string;
}

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    VehiculoCardComponent,
    FilterPanel,
    EmptyState,
    LoadingSpinner
  ],
  templateUrl: './vehiculos.html',
  styleUrls: ['./vehiculos.css']
})
export class VehiculosComponent implements OnInit {
  vehiculos: any[] = [];
  isLoading = true;
  
  filtro: VehiculoFiltro = {};
  
  marcas: string[] = [];
  combustibles = ['GASOLINA', 'DIESEL', 'ELECTRICO', 'HIBRIDO', 'HIBRIDO_ENCHUFABLE'];

  constructor(private vehiculoService: VehiculoService) {}

  ngOnInit() {
    this.cargarVehiculos();
    this.cargarMarcas();
  }

  cargarVehiculos() {
    this.isLoading = true;
    this.vehiculoService.filtrar(this.filtro).subscribe({
      next: (data) => {
        this.vehiculos = data.vehiculos || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.vehiculos = [];
        this.isLoading = false;
      }
    });
  }

  cargarMarcas() {
    this.vehiculoService.getMarcasDisponibles().subscribe({
      next: (marcas) => this.marcas = marcas,
      error: (err) => console.error('Error cargando marcas:', err)
    });
  }

  get vehiculosFiltrados() {
    return this.vehiculos;
  }

  aplicarFiltros() {
    this.cargarVehiculos();
  }

  limpiarFiltros() {
    this.filtro = {};
    this.cargarVehiculos();
  }
}