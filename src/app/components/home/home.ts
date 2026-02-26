import { Component } from '@angular/core';
import { HeroComponent } from '../hero/hero';

@Component({
  selector: 'app-home',
  imports: [HeroComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {}
