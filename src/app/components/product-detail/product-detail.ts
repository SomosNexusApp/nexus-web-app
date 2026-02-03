import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NexusService } from '../../services/nexus.service';
import { NexusItem, Producto, Oferta } from '../../models/actor';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css']
})
export class ProductDetailComponent implements OnInit {
  item: NexusItem | null = null;
  loading = true;
  type: 'producto' | 'oferta' = 'producto'; // Estado para saber qué UI mostrar

  constructor(
    private route: ActivatedRoute,
    private nexusService: NexusService
  ) {}

  ngOnInit() {
    // Detectamos si la URL empieza por 'oferta' o 'producto'
    const path = this.route.snapshot.url[0].path;
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    this.type = path === 'oferta' ? 'oferta' : 'producto';

    if (this.type === 'oferta') {
      this.loadOferta(id);
    } else {
      this.loadProducto(id);
    }
  }

  loadProducto(id: number) {
    this.nexusService.getProductoById(id).subscribe({
      next: (data) => {
        this.item = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadOferta(id: number) {
    this.nexusService.getOfertaById(id).subscribe({
      next: (data) => {
        this.item = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // Helpers de conversión (Type Guards) para usar en el HTML
  get asProducto(): Producto { return this.item as Producto; }
  get asOferta(): Oferta { return this.item as Oferta; }
}