import { Component, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from './hero/hero.component'; 
import { CategoriasRapidasComponent } from './categorias-rapidas/categorias-rapidas.component';
import { ChollosDiaComponent } from './chollos-dia/chollos-dia.component';
import { ProductosRecientesComponent } from './productos-recientes/productos-recientes.component';
import { CtaRegistroComponent } from './cta-registro/cta-registro.component';
import { OfertasCategoriaComponent } from './ofertas-categoria/ofertas-categoria.component';
import { PatrociniosStripComponent } from './patrocinios-strip/patrocinios-strip.component';
import { MobileFeedComponent } from '../../mobile/mobile-feed/mobile-feed';

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
    PatrociniosStripComponent,
    MobileFeedComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  isMobileUI = signal(window.innerWidth <= 768);

  ngOnInit() {
    window.addEventListener('resize', () => {
      this.isMobileUI.set(window.innerWidth <= 768);
    });
  }
}
