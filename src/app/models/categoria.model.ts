export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  orden: number;
  activa: boolean;
  parent?: Categoria;
  hijos?: Categoria[]; // En tu backend se llama 'hijos', no 'children'
}
