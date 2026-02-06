// src/app/components/vehiculo-card/vehiculo-card.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vehiculo-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehiculo-card.html',
  styleUrls: ['./vehiculo-card.css']
})
export class VehiculoCardComponent {
  @Input() vehiculo: any;

  constructor(private router: Router) {}

  verDetalle(): void {
    this.router.navigate(['/vehiculo', this.vehiculo.id]);
  }
}