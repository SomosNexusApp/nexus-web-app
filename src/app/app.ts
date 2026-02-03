import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header';
// ELIMINADO: HeroComponent (ya no se usa aquí)

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent], // HeroComponent quitado de aquí
  templateUrl: './app.html',
  // ELIMINADO: styleUrls porque no tienes un css específico para app por ahora
  // Si quisieras usar el global sería: styleUrls: ['../styles.css'] pero no es necesario.
})
export class AppComponent {
  title = 'Nexus';
}