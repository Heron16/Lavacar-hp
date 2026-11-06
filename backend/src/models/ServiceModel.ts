import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './database';

interface ServicoAtributos {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  duracao: number;
  tiposVeiculo: string;
  ativo: boolean;
  imagemUrl?: string | null;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

interface ServicoCriacao extends Optional<ServicoAtributos, 'id' | 'ativo' | 'imagemUrl'> {}

export class ServiceModel extends Model<ServicoAtributos, ServicoCriacao> {
  declare id: string;
  declare nome: string;
  declare descricao: string;
  declare preco: number;
  declare duracao: number;
  declare tiposVeiculo: string;
  declare ativo: boolean;
  declare imagemUrl: string | null;
  declare criadoEm: Date;
  declare atualizadoEm: Date;
}

ServiceModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    preco: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    duracao: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tiposVeiculo: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'carro',
      field: 'tiposVeiculo',
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    imagemUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
      field: 'imagemUrl',
    },
  },
  {
    sequelize,
    tableName: 'servico',
    timestamps: true,
    createdAt: 'criadoEm',
    updatedAt: 'atualizadoEm',
  }
);
