export type PerfilUsuario = 'cliente' | 'admin';
export type StatusAgendamento = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
export type TipoVeiculo = 'carro' | 'moto' | 'caminhao' | 'suv';

export interface JwtPayload {
  usuarioId: string;
  perfil: PerfilUsuario;
}

export interface ConsultaPaginacao {
  pagina?: number;
  limite?: number;
}

export interface ResultadoPaginado<T> {
  dados: T[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface DadosCriacaoAgendamento {
  usuarioId: string;
  veiculoId: string;
  servicoId: string;
  agendadoPara: Date;
  observacoes?: string;
}

export interface DadosCriacaoVeiculo {
  usuarioId: string;
  marca: string;
  modelo: string;
  ano: number;
  placa: string;
  cor: string;
  tipo: TipoVeiculo;
}

export interface DadosAtualizacaoUsuario {
  nome: string;
  telefone?: string;
  senha?: string;
}
