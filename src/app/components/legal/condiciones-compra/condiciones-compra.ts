import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-condiciones-compra',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './condiciones-compra.html',
  styleUrl: './condiciones-compra.css',
})
export class CondicionesCompra {
  activeSection = 'intro';

  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: 'smooth' });
      this.activeSection = id;
    }
  }

  @HostListener('window:scroll')
  onScroll() {
    const sections = ['intro', 'definicion', 'uso', 'publi', 'propiedad', 'garantias', 'contratacion', 'terceros', 'enlaces'];
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= 200) {
          this.activeSection = id;
          break;
        }
      }
    }
  }
}
