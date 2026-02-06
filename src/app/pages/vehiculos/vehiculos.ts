import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

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
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './vehiculos.html',
  styleUrls: ['./vehiculos.css']
})
export class VehiculosComponent implements OnInit {
  vehiculos: any[] = [];
  isLoading = true;
  
  filtro: VehiculoFiltro = {};
  
  marcas = ['Toyota', 'Volkswagen', 'BMW', 'Mercedes', 'Audi', 'Seat', 'Ford', 'Renault'];
  combustibles = ['GASOLINA', 'DIESEL', 'ELECTRICO', 'HIBRIDO', 'HIBRIDO_ENCHUFABLE'];

  ngOnInit() {
    this.cargarVehiculos();
  }

  cargarVehiculos() {
    this.isLoading = true;
    // Simulación - conectar con tu VehiculoService
    setTimeout(() => {
      this.vehiculos = this.generarVehiculosDemo();
      this.isLoading = false;
    }, 800);
  }

  get vehiculosFiltrados() {
    return this.vehiculos.filter(v => {
      if (this.filtro.marca && v.marca !== this.filtro.marca) return false;
      if (this.filtro.precioMin && v.precio < this.filtro.precioMin) return false;
      if (this.filtro.precioMax && v.precio > this.filtro.precioMax) return false;
      if (this.filtro.anioMin && v.anio < this.filtro.anioMin) return false;
      if (this.filtro.anioMax && v.anio > this.filtro.anioMax) return false;
      if (this.filtro.kilometrosMax && v.kilometros > this.filtro.kilometrosMax) return false;
      if (this.filtro.combustible && v.combustible !== this.filtro.combustible) return false;
      return true;
    });
  }

  limpiarFiltros() {
    this.filtro = {};
  }

  private generarVehiculosDemo() {
    return [
      {
        id: 1,
        titulo: 'BMW Serie 3 320d',
        marca: 'BMW',
        modelo: 'Serie 3',
        anio: 2020,
        kilometros: 45000,
        precio: 28500,
        combustible: 'DIESEL',
        cambio: 'AUTOMATICO',
        potencia: 190,
        imagenPrincipal: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'
      },
      {
        id: 2,
        titulo: 'Volkswagen Golf GTI',
        marca: 'Volkswagen',
        modelo: 'Golf',
        anio: 2021,
        kilometros: 28000,
        precio: 32000,
        combustible: 'GASOLINA',
        cambio: 'MANUAL',
        potencia: 245,
        imagenPrincipal: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800'
      },
      {
        id: 3,
        titulo: 'Tesla Model 3 Long Range',
        marca: 'Tesla',
        modelo: 'Model 3',
        anio: 2022,
        kilometros: 15000,
        precio: 45000,
        combustible: 'ELECTRICO',
        cambio: 'AUTOMATICO',
        potencia: 350,
        imagenPrincipal: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800'
      }
    ];
  }
}