import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/UserModel';
import { JwtPayload } from '../types';
import { validateEmail } from '../utils/validators';

export class AuthService {
  async login(email: string, senha: string) {
    if (!validateEmail(email)) throw new Error('E-mail inválido');

    const usuario = await UserModel.findOne({ where: { email } });
    if (!usuario) throw new Error('E-mail ou senha incorretos');

    const valido = await bcrypt.compare(senha, usuario.senha);
    if (!valido) throw new Error('E-mail ou senha incorretos');

    const payload: JwtPayload = { usuarioId: usuario.id, perfil: usuario.perfil };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '7d' });

    return {
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        telefone: usuario.telefone,
        fotoPerfil: usuario.fotoPerfil ?? null,
      },
    };
  }
}
