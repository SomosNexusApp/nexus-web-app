import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroment';
import { Usuario } from '../models/actor';

export interface UsuarioRegistroDTO {
  user: string;
  email: string;
  password: string;
  telefono?: string;
  biografia?: string;
  ubicacion?: string;
}

export interface UsuarioUpdateDTO {
  user?: string;
  email?: string;
  telefono?: string;
  biografia?: string;
  ubicacion?: string;
}

export interface AvatarResponse {
  mensaje: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private endpoint = `${environment.apiUrl}/usuario`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los usuarios
   */
  getAll(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.endpoint);
  }

  /**
   * Obtiene un usuario por ID
   */
  getById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.endpoint}/${id}`);
  }

  /**
   * Obtiene un usuario por email
   */
  getByEmail(email: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.endpoint}/email/${encodeURIComponent(email)}`);
  }

  /**
   * Obtiene un usuario por username
   */
  getByUsername(username: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.endpoint}/username/${encodeURIComponent(username)}`);
  }

  /**
   * Registra un nuevo usuario
   */
  register(usuario: UsuarioRegistroDTO): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.endpoint}/registro`, usuario);
  }

  /**
   * Actualiza los datos de un usuario
   */
  update(id: number, usuario: UsuarioUpdateDTO): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.endpoint}/${id}`, usuario);
  }

  /**
   * Elimina un usuario
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Sube o actualiza el avatar de un usuario
   * @param usuarioId ID del usuario
   * @param avatar Archivo de imagen
   */
  uploadAvatar(usuarioId: number, avatar: File): Observable<AvatarResponse> {
    const formData = new FormData();
    formData.append('file', avatar);
    
    return this.http.post<AvatarResponse>(`${this.endpoint}/${usuarioId}/avatar`, formData);
  }

  /**
   * Verifica un usuario (marca esVerificado = true)
   */
  verificar(id: number): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.endpoint}/${id}/verificar`, {});
  }

  /**
   * Obtiene usuarios verificados
   */
  getVerificados(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.endpoint}/verificados`);
  }

  /**
   * Busca usuarios por ubicación
   */
  getByUbicacion(ubicacion: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.endpoint}/ubicacion/${encodeURIComponent(ubicacion)}`);
  }

  /**
   * Obtiene usuarios con mejor reputación
   */
  getTopReputacion(limit: number = 10): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.endpoint}/top-reputacion?limit=${limit}`);
  }

  /**
   * Incrementa la reputación de un usuario
   */
  incrementarReputacion(id: number, puntos: number = 1): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.endpoint}/${id}/reputacion`, { puntos });
  }

  /**
   * Busca usuarios por nombre de usuario (búsqueda parcial)
   */
  search(query: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.endpoint}/buscar?q=${encodeURIComponent(query)}`);
  }
}