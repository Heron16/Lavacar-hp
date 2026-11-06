import { VehicleModel } from '../models/VehicleModel';
import { UserModel } from '../models/UserModel';
import { ConsultaPaginacao, DadosCriacaoVeiculo } from '../types';
import { getPaginationParams, paginate } from '../utils/pagination';

export class VeiculoService {
  async criar(dados: DadosCriacaoVeiculo) {
    if (!dados.marca || !dados.modelo || !dados.placa || !dados.cor)
      throw new Error('Todos os campos são obrigatórios');

    const existe = await VehicleModel.findOne({ where: { placa: dados.placa.toUpperCase() } });
    if (existe) throw new Error('Placa já cadastrada');

    return VehicleModel.create({ ...dados, placa: dados.placa.toUpperCase() });
  }

  async listarPorUsuario(usuarioId: string, consulta: ConsultaPaginacao) {
    const { currentPage, pageLimit, skip } = getPaginationParams(consulta.pagina, consulta.limite);
    const { rows: dados, count: total } = await VehicleModel.findAndCountAll({
      where: { usuarioId },
      offset: skip,
      limit: pageLimit,
      order: [['criadoEm', 'DESC']],
    });
    return paginate(dados, total, currentPage, pageLimit);
  }

  async listarTodos(consulta: ConsultaPaginacao) {
    const { currentPage, pageLimit, skip } = getPaginationParams(consulta.pagina, consulta.limite);
    const { rows: dados, count: total } = await VehicleModel.findAndCountAll({
      offset: skip,
      limit: pageLimit,
      include: [{ model: UserModel, as: 'usuario', attributes: ['nome', 'email'] }],
      order: [['criadoEm', 'DESC']],
    });
    return paginate(dados, total, currentPage, pageLimit);
  }

  async atualizar(id: string, usuarioId: string, dados: Partial<DadosCriacaoVeiculo>) {
    const veiculo = await VehicleModel.findOne({ where: { id, usuarioId } });
    if (!veiculo) throw new Error('Veículo não encontrado ou sem permissão');
    await veiculo.update(dados);
    return veiculo;
  }

  async excluir(id: string, usuarioId: string, isAdmin: boolean) {
    const condicao = isAdmin ? { id } : { id, usuarioId };
    const veiculo = await VehicleModel.findOne({ where: condicao });
    if (!veiculo) throw new Error('Veículo não encontrado ou sem permissão');
    await veiculo.destroy();
  }
}
