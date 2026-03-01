import { Actor } from './actor.model';
import { Producto } from './producto.model';
import { Oferta } from './oferta.model';
import { Vehiculo } from './vehiculo.model';

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
  mensajeDenunciado?: any; // Reemplazar 'any' por Mensaje si creas el modelo después
  comentarioDenunciado?: any; // Reemplazar 'any' por Comentario si creas el modelo después

  // Datos de resolución (Solo Admin)
  resolucion?: string;
  resoltor?: Actor;
  fechaResolucion?: string;
}
