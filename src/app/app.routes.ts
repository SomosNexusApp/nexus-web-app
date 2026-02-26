import { Routes } from '@angular/router';
import { HeroComponent } from './components/hero/hero';
import { HomeComponent } from './components/home/home';

export const routes: Routes = [
  // Cuando la URL está vacía (inicio), carga la Home
  { path: '', component: HomeComponent },
];
