import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/enviroment';
import { Compra, TipoEnvio } from '../../models/compra.model';

export interface IniciarPagoResponse {
  compraId: number;
  clientSecret: string;
  precioProducto: number;
  costoEnvio: number;
  comisionNexus: number;
  ahorroRecogida: number;
  total: number;
  tipoEnvio: TipoEnvio;
  pesoKg?: number;
  esRecogida?: boolean;
}

export interface ConfirmarPagoRequest {
  paymentIntentId: string;
  metodoEntrega: 'ENVIO_PAQUETERIA' | 'ENTREGA_EN_PERSONA';
  nombreDestinatario?: string;
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
  pais?: string;
  telefono?: string;
  precioEnvio?: number;
  pesoKg?: number;
  transportista?: string;
}

@Injectable({ providedIn: 'root' })
export class CompraService {
  private http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/compra`;

  /**
   * Paso 1: crear PaymentIntent en Stripe (backend) y la compra en estado PENDIENTE.
   * El peso del paquete lo fija el vendedor al publicar.
   */
  iniciarPago(
    productoId: number,
    compradorId: number,
    tipoEnvio: TipoEnvio,
    direccionCompleta?: string,
    puntoRecogidaId?: string,
    transportista?: string,
    esRecogida: boolean = false,
  ): Observable<IniciarPagoResponse> {
    let params = new HttpParams()
      .set('productoId', productoId)
      .set('compradorId', compradorId)
      .set('tipoEnvio', tipoEnvio)
      .set('esRecogida', esRecogida);

    if (direccionCompleta) params = params.set('direccionCompleta', direccionCompleta);
    if (puntoRecogidaId) params = params.set('puntoRecogidaId', puntoRecogidaId);
    if (transportista) params = params.set('transportista', transportista);

    return this.http.post<IniciarPagoResponse>(`${this.BASE}/intent`, null, { params });
  }

  /**
   * Consulta el coste de envío de un producto SIN crear ningún registro.
   * Usar para mostrar el precio en el checkout antes de confirmar el pago.
   */
  consultarPrecio(
    productoId: number,
    esRecogida: boolean = false,
  ): Observable<{
    costoEnvio: number;
    comisionNexus: number;
    pesoKg: number;
    ahorroRecogida: number;
    total: number;
  }> {
    const params = new HttpParams().set('productoId', productoId).set('esRecogida', esRecogida);
    return this.http.get<any>(`${this.BASE}/precio`, { params });
  }

  /**
   * Paso 2: confirmar el pago exitoso de Stripe → reserva el producto y crea el envío.
   */
  confirmarPago(compraId: number, body: ConfirmarPagoRequest): Observable<any> {
    return this.http.post<any>(`${this.BASE}/${compraId}/confirmar-pago`, body);
  }

  /**
   * Obtener detalles de una compra.
   */
  getCompra(id: number): Observable<Compra> {
    return this.http.get<Compra>(`${this.BASE}/${id}`);
  }

  /**
   * Obtener el envío asociado a una compra.
   */
  getEnvioPorCompra(compraId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/envio/compra/${compraId}`);
  }

  /**
   * Historial de compras del usuario autenticado (/mis-compras)
   */
  getMisCompras(): Observable<Compra[]> {
    return this.http.get<Compra[]>(`${this.BASE}/mis-compras`);
  }

  /**
   * Historial de ventas del usuario autenticado (/mis-ventas)
   */
  getMisVentas(): Observable<Compra[]> {
    return this.http.get<Compra[]>(`${this.BASE}/mis-ventas`);
  }

  /**
   * Historial de compras del usuario.
   */
  getHistorial(usuarioId: number): Observable<Compra[]> {
    return this.http.get<Compra[]>(`${this.BASE}/historial/${usuarioId}`);
  }

  /**
   * Comprador confirma la recepción del pedido.
   */
  confirmarEntrega(envioId: number, valoracion?: number, comentario?: string): Observable<any> {
    const body: any = {};
    if (valoracion) body.valoracion = valoracion;
    if (comentario) body.comentario = comentario;
    return this.http.post<any>(`${environment.apiUrl}/envio/${envioId}/confirmar`, body);
  }
}
