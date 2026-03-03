import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from './hero/hero.component'; // ← ajusta la ruta si es diferente
import { CategoriasRapidasComponent } from './categorias-rapidas/categorias-rapidas.component';
import { ChollosDiaComponent } from './chollos-dia/chollos-dia.component';
import { ProductosRecientesComponent } from './productos-recientes/productos-recientes.component';
import { CtaRegistroComponent } from './cta-registro/cta-registro.component';
import { OfertasCategoriaComponent } from './ofertas-categoria/ofertas-categoria.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    CategoriasRapidasComponent,
    ChollosDiaComponent,
    ProductosRecientesComponent,
    CtaRegistroComponent,
    OfertasCategoriaComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
