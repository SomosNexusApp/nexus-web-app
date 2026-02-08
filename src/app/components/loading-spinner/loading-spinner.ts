import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  imports: [CommonModule],
  templateUrl: './loading-spinner.html',
  styleUrl: './loading-spinner.css',
})
export class LoadingSpinnerComponent {
  @Input() message: string = 'Cargando...';
}
