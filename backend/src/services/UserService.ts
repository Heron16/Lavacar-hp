import bcrypt from 'bcryptjs';
import { UserModel } from '../models/UserModel';
import { validateEmail, validatePasswordStrength } from '../utils/validators';
import { getPaginationParams, paginate } from '../utils/pagination';
import { ConsultaPaginacao, DadosAtualizacaoUsuario } from '../types';

export class UserService {
  async criar(nome: string, email: string, senha: string) {
    if (!validateEmail(email)) throw new Error('E-mail inválido');
    if (!validatePasswordStrength(senha))
      throw new Error('Senha fraca: mínimo 8 chars, maiúscula, minúscula, número e especial');

    const existe = await UserModel.findOne({ where: { email } });
    if (existe) throw new Error('E-mail já cadastrado');

    const senhaHash = await bcrypt.hash(senha, 12);
    const usuario = await UserModel.create({ nome, email, senha: senhaHash });
    return { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil };
  }

  async atualizar(usuarioId: string, solicitanteId: string, dados: DadosAtualizacaoUsuario) {
    if (usuarioId !== solicitanteId) throw new Error('Sem permissão para editar este usuário');

    if (dados.senha && !validatePasswordStrength(dados.senha))
      throw new Error('Senha fraca: mínimo 8 chars, maiúscula, minúscula, número e especial');

    const dadosAtualizados = await this.montarDadosAtualizacao(dados);
    await UserModel.update(dadosAtualizados, { where: { id: usuarioId } });

    return UserModel.findByPk(usuarioId, {
      attributes: ['id', 'nome', 'email', 'telefone', 'perfil'],
    });
  }

  async listarTodos(consulta: ConsultaPaginacao) {
    const { currentPage, pageLimit, skip } = getPaginationParams(consulta.pagina, consulta.limite);
    const { rows: dados, count: total } = await UserModel.findAndCountAll({
      attributes: ['id', 'nome', 'email', 'perfil', 'telefone', 'criadoEm'],
      offset: skip,
      limit: pageLimit,
      order: [['criadoEm', 'DESC']],
    });
    return paginate(dados, total, currentPage, pageLimit);
  }

  async buscarPorId(id: string) {
    const usuario = await UserModel.findByPk(id, {
      attributes: ['id', 'nome', 'email', 'telefone', 'perfil'],
    });
    if (!usuario) throw new Error('Usuário não encontrado');
    return usuario;
  }

  async excluir(id: string) {
    const usuario = await UserModel.findByPk(id);
    if (!usuario) throw new Error('Usuário não encontrado');
    await usuario.destroy();
  }

  private async montarDadosAtualizacao(dados: DadosAtualizacaoUsuario): Promise<Record<string, string>> {
    const result: Record<string, string> = { nome: dados.nome };
    if (dados.telefone) result.telefone = dados.telefone;
    if (dados.senha) result.senha = await bcrypt.hash(dados.senha, 12);
    return result;
  }
}
