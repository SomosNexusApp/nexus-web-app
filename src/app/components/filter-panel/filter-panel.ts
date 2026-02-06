import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-panel',
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.css',
})
export class FilterPanel {
  @Input() title: string = 'Filtros';
  @Input() showActions: boolean = true;
  @Output() aplicar = new EventEmitter<void>();
  @Output() limpiar = new EventEmitter<void>();
}
