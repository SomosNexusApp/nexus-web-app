import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { ProductDetailComponent } from './components/product-detail/product-detail';

export const routes: Routes = [
  // Cuando la URL está vacía (inicio), carga la Home
  { path: '', component: HomeComponent },
  
  // Rutas de detalle
  { path: 'producto/:id', component: ProductDetailComponent },
  { path: 'oferta/:id', component: ProductDetailComponent },
  
  // Si no encuentra nada, vuelve al inicio
  { path: '**', redirectTo: '' }
];