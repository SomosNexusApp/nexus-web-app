import { Component, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from './hero/hero.component'; 
import { CategoriasRapidasComponent } from './categorias-rapidas/categorias-rapidas.component';
import { ChollosDiaComponent } from './chollos-dia/chollos-dia.component';
import { ProductosRecientesComponent } from './productos-recientes/productos-recientes.component';
import { CtaRegistroComponent } from './cta-registro/cta-registro.component';
import { OfertasCategoriaComponent } from './ofertas-categoria/ofertas-categoria.component';
import { MejoresCategoriasComponent } from './mejores-categorias/mejores-categorias.component';
import { PatrociniosStripComponent } from './patrocinios-strip/patrocinios-strip.component';
import { MobileFeedComponent } from '../../mobile/mobile-feed/mobile-feed';

// pagina principal del marketplace.
// en mobile muestra MobileFeedComponent (scroll infinito tipo APP).
// en desktop muestra las secciones clasicas (hero, categorias, chollos, etc.).
// usamos OnPush para que Angular solo re-renderice cuando cambien las signals o inputs.
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
    MejoresCategoriasComponent,
    PatrociniosStripComponent,
    MobileFeedComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // mas eficiente: solo re-renderiza cuando cambian los datos
})
export class HomeComponent implements OnInit {
  // signal reactiva: true si la pantalla es de movil (<= 768px)
  // se usa en el HTML para decidir que componente mostrar
  isMobileUI = signal(window.innerWidth <= 768);

  ngOnInit() {
    // actualizamos la signal cuando el usuario redimensiona la ventana
    window.addEventListener('resize', () => {
      this.isMobileUI.set(window.innerWidth <= 768);
    });
  }
}
