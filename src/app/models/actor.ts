export interface Actor {
  id: number;
  user: string;
  email: string;
  password?: string; // Solo para registro, no viene del backend
  fechaRegistro?: string;
}

export interface Usuario extends Actor {
  telefono?: string;
  esVerificado: boolean;
  avatar?: string; // URL de Cloudinary con valor por defecto
  biografia?: string;
  ubicacion?: string;
  reputacion?: number;
}

export interface Empresa extends Actor {
  cif: string;
  razonSocial?: string;
  descripcion?: string;
  sitioWeb?: string;
}

export interface Admin extends Actor {
  nivel: string;
}