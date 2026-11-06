import { ServiceModel } from '../models/ServiceModel';
import { TipoVeiculo, ConsultaPaginacao } from '../types';
import { getPaginationParams, paginate } from '../utils/pagination';
import { cacheAside, invalidarCache, TTL } from '../utils/cache';
import { publicar } from '../lib/pubsub';
import { CANAIS } from '../types/events';
import { criarLogger } from '../utils/logger';

const log = criarLogger('ServicoService');

type DadosAtualizacaoServico = Partial<{
  nome: string;
  descricao: string;
  preco: number;
  duracao: number;
  tiposVeiculo: TipoVeiculo[];
  ativo: boolean;
  imagemUrl: string | null;
}>;

// Prefixos das chaves Redis para cache
const KEY = {
  listar: (pagina: number, limite: number) => `servicos:listar:p${pagina}:l${limite}`,
  listarAdmin: (pagina: number, limite: number) => `servicos:admin:p${pagina}:l${limite}`,
  todos: 'servicos:*',
};

export class ServicoService {
  async criar(nome: string, descricao: string, preco: number, duracao: number, tiposVeiculo: TipoVeiculo[]) {
    log.info('Criando novo serviço', { nome, preco });

    if (!nome || !descricao) throw new Error('Nome e descrição são obrigatórios');
    if (preco <= 0) throw new Error('Preço deve ser maior que zero');
    if (duracao <= 0) throw new Error('Duração deve ser maior que zero');

    const servico = await ServiceModel.create({
      nome, descricao, preco, duracao, tiposVeiculo: tiposVeiculo.join(','),
    });

    log.info('Serviço criado', { servicoId: servico.id, nome });

    // Invalidar cache — novo serviço aparece nas listagens
    await invalidarCache(KEY.todos);

    // Publicar evento
    await publicar(CANAIS.SERVICO_CRIADO, {
      servicoId: servico.id,
      nome: servico.nome,
      preco: servico.preco,
      criadoEm: servico.criadoEm.toISOString(),
    });

    return this.formatar(servico);
  }

  async listar(consulta: ConsultaPaginacao) {
    log.debug('Listando serviços ativos (clientes)');
    const { currentPage, pageLimit, skip } = getPaginationParams(consulta.pagina, consulta.limite);

    return cacheAside(
      KEY.listar(currentPage, pageLimit),
      TTL.SERVICOS,
      async () => {
        const { rows, count: total } = await ServiceModel.findAndCountAll({
          where: { ativo: true },
          offset: skip,
          limit: pageLimit,
          order: [['criadoEm', 'DESC']],
        });
        return paginate(rows.map(this.formatar), total, currentPage, pageLimit);
      },
    );
  }

  async listarAdmin(consulta: ConsultaPaginacao) {
    log.debug('Listando todos os serviços (admin)');
    const { currentPage, pageLimit, skip } = getPaginationParams(consulta.pagina, consulta.limite);

    return cacheAside(
      KEY.listarAdmin(currentPage, pageLimit),
      TTL.SERVICOS,
      async () => {
        const { rows, count: total } = await ServiceModel.findAndCountAll({
          offset: skip,
          limit: pageLimit,
          order: [['criadoEm', 'DESC']],
        });
        return paginate(rows.map(this.formatar), total, currentPage, pageLimit);
      },
    );
  }

  async atualizar(id: string, dados: DadosAtualizacaoServico) {
    log.info('Atualizando serviço', { servicoId: id, campos: Object.keys(dados) });

    const servico = await ServiceModel.findByPk(id);
    if (!servico) throw new Error('Serviço não encontrado');

    const dadosAtualizados: Record<string, unknown> = { ...dados };
    if (dados.tiposVeiculo) dadosAtualizados.tiposVeiculo = dados.tiposVeiculo.join(',');

    await servico.update(dadosAtualizados);

    log.info('Serviço atualizado', { servicoId: id });

    // Invalidar cache
    await invalidarCache(KEY.todos);

    // Publicar evento
    await publicar(CANAIS.SERVICO_ATUALIZADO, {
      servicoId: id,
      campos: Object.keys(dados),
      atualizadoEm: new Date().toISOString(),
    });

    return this.formatar(servico);
  }

  async excluir(id: string) {
    log.info('Excluindo serviço', { servicoId: id });

    const servico = await ServiceModel.findByPk(id);
    if (!servico) throw new Error('Serviço não encontrado');
    await servico.destroy();

    log.info('Serviço excluído', { servicoId: id });

    // Invalidar cache
    await invalidarCache(KEY.todos);
  }

  private formatar(s: ServiceModel) {
    type ServicoPlano = {
      id: string; nome: string; descricao: string; preco: number;
      duracao: number; tiposVeiculo: string; ativo: boolean;
      imagemUrl: string | null;
      criadoEm: Date; atualizadoEm: Date;
    };
    const plano = s.toJSON() as unknown as ServicoPlano;
    return { ...plano, tiposVeiculo: plano.tiposVeiculo.split(',') as TipoVeiculo[] };
  }
}
