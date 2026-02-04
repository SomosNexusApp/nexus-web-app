import { Injectable } from '@angular/core';
import { environment } from '../../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  /**
   * Valida si un archivo es una imagen válida
   */
  validateImage(file: File): { valid: boolean; error?: string } {
    // Validar tipo de archivo
    if (!environment.upload.allowedImageTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Formato de imagen no permitido. Usa JPG, PNG o WEBP.'
      };
    }

    // Validar tamaño
    if (file.size > environment.upload.maxFileSize) {
      const maxSizeMB = environment.upload.maxFileSize / (1024 * 1024);
      return {
        valid: false,
        error: `La imagen excede el tamaño máximo de ${maxSizeMB}MB.`
      };
    }

    return { valid: true };
  }

  /**
   * Valida un array de imágenes
   */
  validateImages(files: File[], maxImages?: number): { valid: boolean; error?: string } {
    if (!files || files.length === 0) {
      return { valid: true }; // Vacío es válido (opcional)
    }

    // Validar cantidad máxima
    if (maxImages && files.length > maxImages) {
      return {
        valid: false,
        error: `Máximo ${maxImages} imágenes permitidas.`
      };
    }

    // Validar cada archivo
    for (const file of files) {
      const validation = this.validateImage(file);
      if (!validation.valid) {
        return validation;
      }
    }

    return { valid: true };
  }

  /**
   * Crea una URL de vista previa para una imagen
   */
  createPreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Crea vistas previas para múltiples imágenes
   */
  async createPreviewUrls(files: File[]): Promise<string[]> {
    const promises = files.map(file => this.createPreviewUrl(file));
    return Promise.all(promises);
  }

  /**
   * Obtiene una URL de placeholder si la imagen es nula
   */
  getImageOrPlaceholder(imageUrl: string | undefined | null, type: 'producto' | 'oferta' | 'avatar' = 'producto'): string {
    if (imageUrl) {
      return imageUrl;
    }

    // Placeholders según tipo
    switch (type) {
      case 'avatar':
        return 'https://res.cloudinary.com/dzahpgslo/image/upload/v1234567890/defaults/avatar-default.png';
      case 'oferta':
        return 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&auto=format';
      case 'producto':
      default:
        return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format';
    }
  }

  /**
   * Comprime una imagen antes de subirla (opcional, usando canvas)
   */
  async compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calcular nuevas dimensiones manteniendo aspect ratio
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo crear contexto de canvas'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Error al comprimir imagen'));
                return;
              }
              
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              
              resolve(compressedFile);
            },
            file.type,
            quality
          );
        };
        
        img.onerror = () => reject(new Error('Error al cargar imagen'));
      };
      
      reader.onerror = () => reject(new Error('Error al leer archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Extrae el public_id de una URL de Cloudinary
   * Útil para eliminar imágenes
   */
  extractCloudinaryPublicId(url: string): string | null {
    try {
      const match = url.match(/\/v\d+\/(.+)\.\w+$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}