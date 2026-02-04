import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroment';
import { Oferta, OfertaCreateDTO, OfertaUpdateDTO } from '../models/oferta';

@Injectable({
  providedIn: 'root'
})
export class OfertaService {
  private endpoint = `${environment.apiUrl}/oferta`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las ofertas
   */
  getAll(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(this.endpoint);
  }

  /**
   * Obtiene una oferta por ID
   */
  getById(id: number): Observable<Oferta> {
    return this.http.get<Oferta>(`${this.endpoint}/${id}`);
  }

  /**
   * Crea una nueva oferta con imágenes
   * @param oferta Datos de la oferta
   * @param actorId ID del actor (Usuario o Empresa)
   * @param imagenPrincipal Archivo de imagen principal/banner (OBLIGATORIO)
   * @param galeriaImagenes Array de archivos de imágenes adicionales (OPCIONAL, max 4)
   */
  create(
    oferta: OfertaCreateDTO,
    actorId: number,
    imagenPrincipal: File,
    galeriaImagenes?: File[]
  ): Observable<Oferta> {
    const formData = new FormData();
    
    // Agregar el JSON de la oferta
    formData.append('oferta', new Blob([JSON.stringify(oferta)], { type: 'application/json' }));
    
    // Agregar imagen principal (OBLIGATORIO)
    formData.append('imagenPrincipal', imagenPrincipal);
    
    // Agregar galería de imágenes (OPCIONAL)
    if (galeriaImagenes && galeriaImagenes.length > 0) {
      galeriaImagenes.forEach(imagen => {
        formData.append('galeria', imagen);
      });
    }
    
    return this.http.post<Oferta>(`${this.endpoint}/${actorId}`, formData);
  }

  /**
   * Actualiza una oferta existente con nuevas imágenes
   * @param id ID de la oferta
   * @param oferta Datos a actualizar
   * @param imagenPrincipal Nueva imagen principal (opcional)
   * @param galeriaImagenes Nuevas imágenes de galería (opcional, se añaden a las existentes)
   */
  update(
    id: number,
    oferta: OfertaUpdateDTO,
    imagenPrincipal?: File,
    galeriaImagenes?: File[]
  ): Observable<Oferta> {
    const formData = new FormData();
    
    // Agregar el JSON de la oferta
    formData.append('oferta', new Blob([JSON.stringify(oferta)], { type: 'application/json' }));
    
    // Agregar nueva imagen principal si se proporciona
    if (imagenPrincipal) {
      formData.append('imagenPrincipal', imagenPrincipal);
    }
    
    // Agregar nuevas imágenes de galería si se proporcionan
    if (galeriaImagenes && galeriaImagenes.length > 0) {
      galeriaImagenes.forEach(imagen => {
        formData.append('galeria', imagen);
      });
    }
    
    return this.http.put<Oferta>(`${this.endpoint}/${id}`, formData);
  }

  /**
   * Elimina una oferta (también elimina sus imágenes de Cloudinary)
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Obtiene ofertas activas (no expiradas)
   */
  getActivas(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.endpoint}/activas`);
  }

  /**
   * Obtiene ofertas de un actor específico
   */
  getByActor(actorId: number): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.endpoint}/actor/${actorId}`);
  }

  /**
   * Busca ofertas por tienda
   */
  getByTienda(tienda: string): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.endpoint}/tienda/${encodeURIComponent(tienda)}`);
  }

  /**
   * Busca ofertas por categoría
   */
  getByCategoria(categoria: string): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.endpoint}/categoria/${categoria}`);
  }

  /**
   * Busca ofertas por título (búsqueda parcial)
   */
  search(query: string): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.endpoint}/buscar?q=${encodeURIComponent(query)}`);
  }

  /**
   * Obtiene ofertas que expiran pronto (próximas 24 horas)
   */
  getProximasExpirar(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.endpoint}/proximas-expirar`);
  }

  /**
   * Obtiene ofertas con mejor descuento
   */
  getMejoresDescuentos(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.endpoint}/mejores-descuentos`);
  }
}