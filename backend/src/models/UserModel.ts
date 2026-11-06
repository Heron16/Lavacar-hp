import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './database';
import { PerfilUsuario } from '../types';

interface UsuarioAtributos {
  id: string;
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
  perfil: PerfilUsuario;
  telefone?: string;
  fotoPerfil?: string | null;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

interface UsuarioCriacao extends Optional<UsuarioAtributos, 'id' | 'perfil' | 'cpf' | 'telefone' | 'fotoPerfil'> {}

export class UserModel extends Model<UsuarioAtributos, UsuarioCriacao> {
  declare id: string;
  declare nome: string;
  declare email: string;
  declare senha: string;
  declare cpf: string | null;
  declare perfil: PerfilUsuario;
  declare telefone: string | null;
  declare fotoPerfil: string | null;
  declare criadoEm: Date;
  declare atualizadoEm: Date;
}

UserModel.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nome: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    senha: { type: DataTypes.STRING(255), allowNull: false },
    cpf: { type: DataTypes.STRING(14), allowNull: true, unique: true },
    perfil: { type: DataTypes.ENUM('cliente', 'admin'), defaultValue: 'cliente', allowNull: false },
    telefone: { type: DataTypes.STRING(20), allowNull: true },
    fotoPerfil: { type: DataTypes.STRING(255), allowNull: true, field: 'foto_perfil' },
  },
  {
    sequelize,
    tableName: 'usuario',
    timestamps: true,
    createdAt: 'criadoEm',
    updatedAt: 'atualizadoEm',
  },
);
