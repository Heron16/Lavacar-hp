export type PerfilUsuario = 'cliente' | 'admin';
export type StatusAgendamento = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
export type TipoVeiculo = 'carro' | 'moto' | 'caminhao' | 'suv';

export interface ErroApi {
  response?: {
    data?: {
      mensagem?: string;
    };
  };
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  perfil: PerfilUsuario;
}

export interface RespostaAuth {
  token: string;
  usuario: Usuario;
}

export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  duracao: number;
  tiposVeiculo: TipoVeiculo[];
  ativo: boolean;
}

export interface Veiculo {
  id: string;
  usuarioId: string;
  marca: string;
  modelo: string;
  ano: number;
  placa: string;
  cor: string;
  tipo: TipoVeiculo;
}

export interface Agendamento {
  id: string;
  usuarioId: string;
  veiculoId: string;
  servicoId: string;
  veiculo?: Veiculo;
  servico?: Servico;
  agendadoPara: string;
  status: StatusAgendamento;
  observacoes?: string;
  precoTotal: number;
}

export interface ResultadoPaginado<T> {
  dados: T[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface FormLogin {
  email: string;
  senha: string;
}

export interface FormCadastro {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

export interface FormEdicaoUsuario {
  nome: string;
  cpf: string;
  telefone: string;
  senha: string;
  confirmarSenha: string;
}
