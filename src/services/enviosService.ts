import { supabase } from './supabase';
import { Envio, EstadoEnvio } from '../types';

export async function fetchEnvios(): Promise<Envio[]> {
  const { data, error } = await supabase
    .from('envios')
    .select('*')
    .order('id', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Envio[];
}

export interface NuevoEnvioPayload {
  insumo: string;
  temp: number;
  ubicacion: string;
  lat: number;
  long: number;
}

export async function crearEnvio(payload: NuevoEnvioPayload): Promise<void> {
  const { error } = await supabase.from('envios').insert([{
    insumo: payload.insumo,
    temp: payload.temp,
    ubicacion: payload.ubicacion,
    estado: payload.temp > 7 ? EstadoEnvio.CRITICO : EstadoEnvio.EN_RUTA,
    lat: payload.lat,
    long: payload.long,
  }]);

  if (error) throw error;
}

export async function eliminarEnvio(id: number): Promise<void> {
  const { error } = await supabase
    .from('envios')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
