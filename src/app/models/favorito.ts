import { Oferta } from '../models/oferta';
import { Producto } from './producto';

export interface Favorito {
  id: number;
  usuario?: any;
  oferta?: Oferta;
  producto?: Producto;
  fechaGuardado: string;
  nota?: string;
}