export enum EstadoEnvio {
  EN_RUTA = 'EN RUTA',
  CRITICO = 'CRÍTICO',
  ENTREGADO = 'ENTREGADO',
  EN_ESPERA = 'EN ESPERA',
}

export interface Envio {
  id: number;
  insumo: string;
  temp: number;
  ubicacion: string;
  lat: number | null;
  long: number | null;
  estado: EstadoEnvio | string;
}

export interface AlertaTemperatura {
  id: number;
  envioId: number;
  temp: number;
  timestamp: string;
  duracion: number;
  tipo: 'CRITICA' | 'PREVENTIVA';
}

export interface EstadisticasFlota {
  totalEnvios: number;
  enviosCriticos: number;
  enviosEnRuta: number;
  tempPromedio: number;
  tempMaxima: number;
  tempMinima: number;
}
