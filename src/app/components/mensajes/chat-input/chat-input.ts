import {
  Component,
  EventEmitter,
  Output,
  signal,
  ViewChild,
  ElementRef,
  Input,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

export interface ChatDraft {
  tipo: 'TEXTO' | 'IMAGEN' | 'AUDIO' | 'OFERTA_PRECIO' | 'GIF';
  texto?: string;
  archivo?: File | Blob;
  duracionSegundos?: number;
  precioPropuesto?: number;
}

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-input.html',
  styleUrl: './chat-input.css',
})
export class ChatInputComponent {
  @Input() esDirecto = false;
  @Output() enviarMensaje = new EventEmitter<ChatDraft>();
  @Output() escribiendo = new EventEmitter<void>();
  @Output() abrirNegociacion = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('textArea') textArea!: ElementRef<HTMLTextAreaElement>;

  private http = inject(HttpClient);

  texto = signal('');
  isRecording = signal(false);

  // Gifs
  mostrarGifs = signal(false);
  gifSearch = signal('');
  gifs = signal<any[]>([]);
  private tenorKey = 'LIVDSRZULELA'; // Tenor API key de pruebas gratuita (Google)

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioStartTime = 0;
  private typingTimeout: any;

  // Tamaño máximo de imagen antes de comprimir (800px de lado)
  private readonly MAX_IMAGE_SIZE = 800;
  private readonly MAX_IMAGE_BYTES = 500_000; // 500KB

  onInput() {
    this.autoResize();

    // Throttle evento escribiendo cada 1.5s
    if (!this.typingTimeout) {
      this.escribiendo.emit();
      this.typingTimeout = setTimeout(() => {
        this.typingTimeout = null;
      }, 1500);
    }
  }

  autoResize() {
    const el = this.textArea?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight < 120 ? el.scrollHeight : 120) + 'px';
  }

  enviarTexto() {
    const msg = this.texto().trim();
    if (!msg) return;

    this.enviarMensaje.emit({ tipo: 'TEXTO', texto: msg });
    this.texto.set('');
    this.mostrarGifs.set(false);
    if (this.textArea?.nativeElement) {
      this.textArea.nativeElement.style.height = 'auto';
    }
  }

  // --- GIFS (Tenor API) ---
  toggleGifs() {
    this.mostrarGifs.set(!this.mostrarGifs());
    if (this.mostrarGifs() && this.gifs().length === 0) {
      this.buscarGifs();
    }
  }

  buscarGifs() {
    const q = this.gifSearch().trim() || 'trending';
    const limit = 20;
    const url = `https://g.tenor.com/v1/search?q=${q}&key=${this.tenorKey}&limit=${limit}&media_filter=minimal`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.gifs.set(res.results || []);
      },
      error: (err) => console.error('Error fetching GIFs', err),
    });
  }

  seleccionarGif(gif: any) {
    const url = gif.media[0]?.gif?.url || gif.media[0]?.tinygif?.url;
    if (!url) return;
    this.enviarMensaje.emit({ tipo: 'GIF', texto: url }); // We pass the URL in 'texto' prop, ChatPanel will map to mediaUrl
    this.mostrarGifs.set(false);
  }

  // --- OFERTAS ---
  toggleOfertaModal() {
    this.abrirNegociacion.emit();
  }

  abrirSelectorImagen() {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type.startsWith('image/')) {
        try {
          // Comprimir imagen antes de enviar
          const compressedBlob = await this.compressImage(file);
          const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
          this.enviarMensaje.emit({
            tipo: 'IMAGEN',
            archivo: compressedFile,
            texto: this.texto().trim(),
          });
          this.texto.set('');
        } catch {
          // Si falla la compresión, enviar original
          this.enviarMensaje.emit({ tipo: 'IMAGEN', archivo: file, texto: this.texto().trim() });
          this.texto.set('');
        }
        input.value = '';
      }
    }
  }

  /**
   * Comprimir imagen usando Canvas API.
   * Redimensiona a MAX_IMAGE_SIZE y reduce calidad JPEG.
   */
  private compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Redimensionar si es más grande que el máximo
          if (width > this.MAX_IMAGE_SIZE || height > this.MAX_IMAGE_SIZE) {
            if (width > height) {
              height = Math.round((height / width) * this.MAX_IMAGE_SIZE);
              width = this.MAX_IMAGE_SIZE;
            } else {
              width = Math.round((width / height) * this.MAX_IMAGE_SIZE);
              height = this.MAX_IMAGE_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);

          // Probar con calidad progresivamente más baja
          let quality = 0.7;
          const tryCompress = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) return reject(new Error('No se pudo comprimir'));
                if (blob.size > this.MAX_IMAGE_BYTES && quality > 0.3) {
                  quality -= 0.1;
                  tryCompress();
                } else {
                  resolve(blob);
                }
              },
              'image/jpeg',
              quality,
            );
          };
          tryCompress();
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  // --- GRABACIÓN DE AUDIO ---
  async iniciarGrabacion() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.audioStartTime = Date.now();

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        const duracion = Math.floor((Date.now() - this.audioStartTime) / 1000);
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

        // Detener micrófono
        stream.getTracks().forEach((track) => track.stop());

        if (duracion >= 1 && duracion <= 60) {
          this.enviarMensaje.emit({
            tipo: 'AUDIO',
            archivo: audioBlob,
            duracionSegundos: duracion,
          });
        }
      };

      this.mediaRecorder.start();
      this.isRecording.set(true);
    } catch (err) {
      console.error('Error accediendo al micrófono:', err);
      alert('No se pudo acceder al micrófono. Asegúrate de dar permiso.');
    }
  }

  detenerGrabacion() {
    if (this.mediaRecorder && this.isRecording()) {
      this.mediaRecorder.stop();
      this.isRecording.set(false);
    }
  }
}
