import { Component, EventEmitter, inject, OnInit, Output, OnDestroy, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../../core/services/chat.service';
import { ChatMensaje, WebSocketService } from '../../../core/services/websocket.service';
import { AuthStore } from '../../../core/auth/auth-store';
import { Subscription } from 'rxjs';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { CoverImagePipe } from '../../../shared/pipes/cover-image.pipe';

@Component({
  selector: 'app-conversaciones-list',
  standalone: true,
  imports: [CommonModule, TruncatePipe, TimeAgoPipe, CoverImagePipe],
  templateUrl: './conversaciones-list.html',
  styleUrl: './conversaciones-list.css',
})
export class ConversacionesListComponent implements OnInit, OnDestroy {
  @Input() convSeleccionada: any = null;
  @Output() conversacionSeleccionada = new EventEmitter<any>();

  chatService = inject(ChatService);
  wsService = inject(WebSocketService);
  authStore = inject(AuthStore);

  conversaciones = signal<any[]>([]);
  escribiendoMap = signal<Map<string, boolean>>(new Map()); // "productId_otherUserId" -> boolean

  private subNotif: Subscription | null = null;
  private subMensajes: Subscription | null = null;

  // Agruparemos las últimas conversaciones combinando datos del producto y del otro usuario
  // En este prototipo asumimos que el backend de Bandeja devuelve 1 mensaje por conversación (el último)
  ngOnInit() {
    this.cargarConversaciones();

    // Reaccionar a nuevos mensajes por websocket para ponerlos los primeros en la lista y actualizar el texto
    this.subMensajes = this.wsService.mensajes.subscribe((msg: ChatMensaje) => {
      this.cargarConversaciones(); // O actualizar la seńal in-place
    });
  }

  cargarConversaciones() {
    const user = this.authStore.user();
    if (!user) return;
    this.chatService.getConversaciones(user.id).subscribe((msgs) => {
      // Filtrar y ordenar la bandeja
      // Asumimos que msgs son el ÚLTIMO mensaje de CADA conversación.
      this.conversaciones.set(msgs);
    });
  }

  seleccionar(conv: ChatMensaje) {
    this.conversacionSeleccionada.emit(conv);
  }

  getOtroUsuario(msg: ChatMensaje): any {
    const miId = this.authStore.user()?.id;
    return msg.remitente.id === miId ? msg.receptor : msg.remitente;
  }

  ngOnDestroy() {
    this.subMensajes?.unsubscribe();
    this.subNotif?.unsubscribe();
  }
}
