import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.css']
})
export class ConfirmModalComponent {
  @Input() title: string = 'Confirmar Acción';
  @Input() message: string = '¿Estás seguro de que deseas realizar esta acción?';
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';
  @Input() icon: string = 'fas fa-exclamation-triangle';
  @Input() type: 'danger' | 'warning' | 'info' | 'success' | 'primary' = 'warning';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  isOpen = signal(false);

  open() {
    this.isOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.isOpen.set(false);
    document.body.style.overflow = 'auto';
    this.cancelled.emit();
  }

  onConfirm() {
    this.isOpen.set(false);
    document.body.style.overflow = 'auto';
    this.confirmed.emit();
  }
}
