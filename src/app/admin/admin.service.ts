import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/enviroment';
import {
  AdminKpis, DiaValorDTO, CatValorDTO, AdminUsuario, AdminReporte,
  AdminDevolucion, AdminSancion, AuditLogEntry, AdminHealth,
  AdminFraudeFlag, AdminProductoSospechoso, PagedResult
} from './admin.models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/admin`;

  // ── Health ──────────────────────────────────────────────────────────────
  getHealth(): Observable<AdminHealth> {
    return this.http.get<AdminHealth>(`${this.base}/sistema/health`);
  }

  // ── Estadísticas ─────────────────────────────────────────────────────────
  getKpis(): Observable<AdminKpis> {
    return this.http.get<AdminKpis>(`${this.base}/estadisticas`);
  }

  getUsuariosPorDia(): Observable<DiaValorDTO[]> {
    return this.http.get<DiaValorDTO[]>(`${this.base}/estadisticas/usuarios-dia`);
  }

  getComprasPorDia(): Observable<DiaValorDTO[]> {
    return this.http.get<DiaValorDTO[]>(`${this.base}/estadisticas/compras-dia`);
  }

  getProductosPorCategoria(): Observable<CatValorDTO[]> {
    return this.http.get<CatValorDTO[]>(`${this.base}/estadisticas/productos-categoria`);
  }

  getTopVendedores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/estadisticas/top-vendedores`);
  }

  getUltimasCompras(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/estadisticas/ultimas-compras`);
  }

  getUltimosReportes(): Observable<AdminReporte[]> {
    return this.http.get<AdminReporte[]>(`${this.base}/estadisticas/ultimos-reportes`);
  }

  // ── Usuarios ─────────────────────────────────────────────────────────────
  getUsuarios(params: any): Observable<PagedResult<AdminUsuario>> {
    return this.http.get<PagedResult<AdminUsuario>>(`${this.base}/usuarios`, { params });
  }

  getUsuario(id: number): Observable<AdminUsuario> {
    return this.http.get<AdminUsuario>(`${this.base}/usuarios/${id}`);
  }

  verificarUsuario(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/usuarios/${id}/verificar`, {});
  }

  suspenderUsuario(id: number, motivo: string, duracionHoras: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/usuarios/${id}/suspender`, { motivo, duracionHoras });
  }

  banearUsuario(id: number, motivo: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/usuarios/${id}/banear`, { motivo });
  }

  desbanearUsuario(id: number, motivo: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/usuarios/${id}/desbanear`, { motivo });
  }

  impersonarUsuario(id: number): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.base}/usuarios/${id}/impersonar`, {});
  }

  enviarAviso(usuarioId: number, mensaje: string): Observable<void> {
    return this.http.post<void>(`${this.base}/notificaciones`, { usuarioId, tipo: 'AVISO', mensaje });
  }

  // ── Reportes ─────────────────────────────────────────────────────────────
  getReportes(params: any): Observable<PagedResult<AdminReporte>> {
    return this.http.get<PagedResult<AdminReporte>>(`${this.base}/reportes`, { params });
  }

  getCountReportesPendientes(): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.base}/reportes/count-pendientes`);
  }

  updateReporte(id: number, body: any): Observable<void> {
    return this.http.patch<void>(`${this.base}/reportes/${id}`, body);
  }

  suspenderYResolver(body: any): Observable<void> {
    return this.http.post<void>(`${this.base}/acciones/suspender-y-resolver`, body);
  }

  // ── Sanciones ────────────────────────────────────────────────────────────
  getSanciones(params: any): Observable<PagedResult<AdminSancion>> {
    return this.http.get<PagedResult<AdminSancion>>(`${this.base}/sanciones`, { params });
  }

  // ── Fraude ───────────────────────────────────────────────────────────────
  getFraudeFlags(): Observable<AdminFraudeFlag[]> {
    return this.http.get<AdminFraudeFlag[]>(`${this.base}/fraude/flags`);
  }

  getProductosSospechosos(): Observable<AdminProductoSospechoso[]> {
    return this.http.get<AdminProductoSospechoso[]>(`${this.base}/fraude/productos-sospechosos`);
  }

  getFraudeEstadisticas(): Observable<DiaValorDTO[]> {
    return this.http.get<DiaValorDTO[]>(`${this.base}/fraude/estadisticas`);
  }

  marcarFraudeRevisado(userId: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/fraude/flags/${userId}/revisado`, {});
  }

  // ── Devoluciones ─────────────────────────────────────────────────────────
  getDevoluciones(params: any): Observable<PagedResult<AdminDevolucion>> {
    return this.http.get<PagedResult<AdminDevolucion>>(`${this.base}/devoluciones`, { params });
  }

  aceptarDevolucion(id: number, body: any): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/api/devoluciones/${id}/aceptar`, body);
  }

  rechazarDevolucion(id: number, motivo: string): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/api/devoluciones/${id}/rechazar`, { motivo });
  }

  cerrarDevolucion(id: number, motivo: string): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/api/devoluciones/${id}/cerrar-admin`, { motivo });
  }

  // ── Audit Log ────────────────────────────────────────────────────────────
  getAuditLog(params: any): Observable<PagedResult<AuditLogEntry>> {
    return this.http.get<PagedResult<AuditLogEntry>>(`${this.base}/audit`, { params });
  }

  exportAuditLog(): Observable<Blob> {
    return this.http.get(`${this.base}/audit/export`, { responseType: 'blob' });
  }
}
