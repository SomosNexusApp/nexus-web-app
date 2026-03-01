import { Actor } from './actor.model';
import { Producto } from './producto.model';
import { Oferta } from './oferta.model';
import { Vehiculo } from './vehiculo.model';
import { Mensaje } from './mensaje.model';
import { Comentario } from './comentario.model';

// He añadido MENSAJE y COMENTARIO según lo que soporta tu backend
export type TipoReporte = 'PRODUCTO' | 'OFERTA' | 'USUARIO' | 'VEHICULO' | 'MENSAJE' | 'COMENTARIO';
export type MotivoReporte =
  | 'SPAM'
  | 'FRAUDE'
  | 'ACOSO'
  | 'CONTENIDO_INAPROPIADO'
  | 'INFORMACION_FALSA';
export type EstadoReporte = 'PENDIENTE' | 'EN_REVISION' | 'RESUELTO' | 'DESESTIMADO';

export interface Reporte {
  id: number;
  reportador?: Actor;
  tipo: TipoReporte;
  motivo: MotivoReporte;
  descripcion?: string;
  estado: EstadoReporte;
  fecha?: string;

  // Objeto denunciado (solo uno de estos tendrá valor dependiendo del 'tipo')
  actorDenunciado?: Actor;
  productoDenunciado?: Producto;
  ofertaDenunciada?: Oferta;
  vehiculoDenunciado?: Vehiculo;
  mensajeDenunciado?: Mensaje;
  comentarioDenunciado?: Comentario;

  // Datos de resolución (Solo Admin)
  resolucion?: string;
  resoltor?: Actor;
  fechaResolucion?: string;
}
