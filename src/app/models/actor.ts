export interface Actor {
  id: number;
  user: string; // En Java es 'private String user;'
  email: string;
  fechaRegistro?: string;
}

export interface Usuario extends Actor {
  telefono?: string;
  esVerificado: boolean;
  fotoPerfil?: string;
  biografia?: string;
  ubicacion?: string;
  reputacion?: number;
}

export interface Empresa extends Actor {
  cif: string;
}