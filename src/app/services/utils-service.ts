import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  /**
   * Formatea un precio con separadores de miles y símbolo de euro
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  /**
   * Calcula el porcentaje de descuento
   */
  calculateDiscount(originalPrice: number, offerPrice: number): number {
    if (originalPrice <= 0 || offerPrice >= originalPrice) {
      return 0;
    }
    return Math.round(((originalPrice - offerPrice) / originalPrice) * 100);
  }

  /**
   * Formatea una fecha a formato legible
   */
  formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d);
  }

  /**
   * Formatea una fecha a formato relativo (hace 2 horas, ayer, etc.)
   */
  formatRelativeDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return this.formatDate(d);
  }

  /**
   * Trunca un texto a un número máximo de caracteres
   */
  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Genera un slug a partir de un texto
   */
  slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Genera iniciales de un nombre
   */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  /**
   * Valida un email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida un teléfono español
   */
  isValidSpanishPhone(phone: string): boolean {
    const phoneRegex = /^(\+34|0034|34)?[6789]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Valida un CIF español
   */
  isValidCIF(cif: string): boolean {
    const cifRegex = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/;
    return cifRegex.test(cif.toUpperCase());
  }

  /**
   * Copia texto al portapapeles
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Comparte contenido usando Web Share API
   */
  async share(data: { title?: string; text?: string; url?: string }): Promise<boolean> {
    if (!navigator.share) {
      return false;
    }

    try {
      await navigator.share(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Detecta si es un dispositivo móvil
   */
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Genera un color aleatorio basado en un string (para avatars)
   */
  stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      '#A8B4FF', '#CDB0E8', '#FF91D5', '#FF69B4',
      '#4FFFB0', '#FFD700', '#FF6B6B', '#4ECDC4'
    ];
    
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Genera un ID único
   */
  generateUniqueId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Debounce de una función
   */
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: any;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Descarga un archivo
   */
  downloadFile(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Calcula días restantes hasta una fecha
   */
  daysUntil(date: string | Date): number {
    const target = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    return Math.ceil(diffMs / 86400000);
  }

  /**
   * Verifica si una fecha ha expirado
   */
  isExpired(date: string | Date): boolean {
    const target = typeof date === 'string' ? new Date(date) : date;
    return target.getTime() < Date.now();
  }
}