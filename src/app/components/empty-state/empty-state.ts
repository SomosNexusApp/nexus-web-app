import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  imports: [CommonModule, RouterModule],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class EmptyStateComponent {
  @Input() icon: string = '📭';
  @Input() title: string = 'No hay elementos';
  @Input() message: string = 'No se encontraron resultados.';
  @Input() actionText: string = 'Explorar';
  @Input() actionRoute: string | null = null;
}
