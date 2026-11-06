import { criarLogger } from '../utils/logger';
import { EventoServicoCriado, EventoServicoAtualizado } from '../types/events';

const log = criarLogger('ServicoHandler');

export function handleServicoCriado(payload: EventoServicoCriado): void {
  log.info('🆕 Novo serviço cadastrado', {
    servicoId: payload.servicoId,
    nome:      payload.nome,
    preco:     `R$ ${payload.preco}`,
  });
}

export function handleServicoAtualizado(payload: EventoServicoAtualizado): void {
  log.info('✏️  Serviço atualizado', {
    servicoId:       payload.servicoId,
    camposAlterados: payload.campos,
  });

  if (payload.campos.includes('preco')) {
    log.warn('💰 Preço alterado — clientes com agendamentos futuros devem ser notificados', {
      servicoId: payload.servicoId,
    });
  }
}
