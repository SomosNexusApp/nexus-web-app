export enum TipoVehiculo {
  COCHE = 'COCHE',
  MOTO = 'MOTO',
  FURGONETA = 'FURGONETA',
  CARAVANA = 'CARAVANA',
  CAMION = 'CAMION'
}

export enum TipoCombustible {
  GASOLINA = 'GASOLINA',
  DIESEL = 'DIESEL',
  ELECTRICO = 'ELECTRICO',
  HIBRIDO = 'HIBRIDO',
  HIBRIDO_ENCHUFABLE = 'HIBRIDO_ENCHUFABLE',
  GLP = 'GLP'
}

export enum TipoCambio {
  MANUAL = 'MANUAL',
  AUTOMATICO = 'AUTOMATICO',
  SEMI_AUTOMATICO = 'SEMI_AUTOMATICO'
}

export enum EstadoVehiculo {
  EXCELENTE = 'EXCELENTE',
  MUY_BUENO = 'MUY_BUENO',
  BUENO = 'BUENO',
  ACEPTABLE = 'ACEPTABLE',
  NECESITA_REPARACION = 'NECESITA_REPARACION'
}

export interface Vehiculo {
  id: number;
  titulo: string;
  descripcion: string;
  precio: number;
  imagenPrincipal: string;
  galeriaImagenes?: string[];
  
  // Específico de vehículo
  tipoVehiculo: TipoVehiculo;
  marca: string;
  modelo: string;
  anio: number;
  kilometros: number;
  combustible: TipoCombustible;
  cilindrada?: number;
  potencia?: number;
  cambio: TipoCambio;
  numPuertas?: number;
  numPlazas?: number;
  color?: string;
  extras?: string[];
  matricula?: string;
  esSegundaMano: boolean;
  tieneITV?: boolean;
  fechaProximaITV?: string;
  estadoVehiculo: EstadoVehiculo;
  
  // Publicador
  publicador?: any;
}

export interface FiltroVehiculo {
  tipoVehiculo?: TipoVehiculo;
  marca?: string;
  modelo?: string;
  anioMin?: number;
  anioMax?: number;
  kilometrosMax?: number;
  precioMin?: number;
  precioMax?: number;
  combustible?: TipoCombustible;
  cilindradaMin?: number;
  cilindradaMax?: number;
  potenciaMin?: number;
  potenciaMax?: number;
  cambio?: TipoCambio;
  numPuertasMin?: number;
  color?: string;
  extras?: string[];
  soloSegundaMano?: boolean;
  conITV?: boolean;
  estadoMinimo?: EstadoVehiculo;
  ordenarPor?: 'precio' | 'kilometros' | 'anio' | 'fecha';
  direccion?: 'asc' | 'desc';
  pagina?: number;
  tamañoPagina?: number;
}