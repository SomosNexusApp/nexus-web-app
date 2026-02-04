import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Producto, ProductoCreateDTO, ProductoUpdateDTO } from '../models/producto';
import { environment } from '../../environments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private endpoint = `${environment.apiUrl}/producto`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los productos disponibles (estado = DISPONIBLE)
   */
  getDisponibles(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.endpoint}/disponibles`);
  }

  /**
   * Obtiene todos los productos (sin filtro de estado)
   */
  getAll(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.endpoint);
  }

  /**
   * Obtiene un producto por ID
   */
  getById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.endpoint}/${id}`);
  }

  /**
   * Crea un nuevo producto con imágenes
   * @param producto Datos del producto
   * @param usuarioId ID del usuario publicador
   * @param imagenPrincipal Archivo de imagen principal (OBLIGATORIO)
   * @param galeriaImagenes Array de archivos de imágenes adicionales (OPCIONAL, max 5)
   */
  create(
    producto: ProductoCreateDTO,
    usuarioId: number,
    imagenPrincipal: File,
    galeriaImagenes?: File[]
  ): Observable<Producto> {
    const formData = new FormData();

    // Agregar el JSON del producto
    formData.append('producto', new Blob([JSON.stringify(producto)], { type: 'application/json' }));

    // Agregar imagen principal (OBLIGATORIO)
    formData.append('imagenPrincipal', imagenPrincipal);

    // Agregar galería de imágenes (OPCIONAL)
    if (galeriaImagenes && galeriaImagenes.length > 0) {
      galeriaImagenes.forEach(imagen => {
        formData.append('galeria', imagen);
      });
    }

    return this.http.post<Producto>(`${this.endpoint}/publicar/${usuarioId}`, formData);
  }

  /**
   * Actualiza un producto existente con nuevas imágenes
   * @param id ID del producto
   * @param producto Datos a actualizar
   * @param imagenPrincipal Nueva imagen principal (opcional)
   * @param galeriaImagenes Nuevas imágenes de galería (opcional, se añaden a las existentes)
   */
  update(
    id: number,
    producto: ProductoUpdateDTO,
    imagenPrincipal?: File,
    galeriaImagenes?: File[]
  ): Observable<Producto> {
    const formData = new FormData();

    // Agregar el JSON del producto
    formData.append('producto', new Blob([JSON.stringify(producto)], { type: 'application/json' }));

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

    return this.http.put<Producto>(`${this.endpoint}/${id}`, formData);
  }

  /**
   * Elimina un producto (también elimina sus imágenes de Cloudinary)
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Obtiene productos de un usuario específico
   */
  getByUsuario(usuarioId: number): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.endpoint}/usuario/${usuarioId}`);
  }

  /**
   * Busca productos por categoría
   */
  getByCategoria(categoria: string): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.endpoint}/categoria/${categoria}`);
  }

  /**
   * Busca productos por título (búsqueda parcial)
   */
  search(query: string): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.endpoint}/buscar?q=${encodeURIComponent(query)}`);
  }

  /**
   * Cambia el estado de un producto
   */
  cambiarEstado(id: number, estado: string): Observable<Producto> {
    return this.http.patch<Producto>(`${this.endpoint}/${id}/estado`, { estado });
  }
}