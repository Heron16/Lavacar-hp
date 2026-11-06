import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './database';
import { UserModel } from './UserModel';
import { TipoVeiculo } from '../types';

interface VeiculoAtributos {
  id: string;
  usuarioId: string;
  marca: string;
  modelo: string;
  ano: number;
  placa: string;
  cor: string;
  tipo: TipoVeiculo;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

interface VeiculoCriacao extends Optional<VeiculoAtributos, 'id'> {}

export class VehicleModel extends Model<VeiculoAtributos, VeiculoCriacao> {
  declare id: string;
  declare usuarioId: string;
  declare marca: string;
  declare modelo: string;
  declare ano: number;
  declare placa: string;
  declare cor: string;
  declare tipo: TipoVeiculo;
  declare criadoEm: Date;
  declare atualizadoEm: Date;
}

VehicleModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    usuarioId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    marca: { type: DataTypes.STRING(255), allowNull: false },
    modelo: { type: DataTypes.STRING(255), allowNull: false },
    ano: { type: DataTypes.INTEGER, allowNull: false },
    placa: { type: DataTypes.STRING(10), allowNull: false, unique: true },
    cor: { type: DataTypes.STRING(255), allowNull: false },
    tipo: {
      type: DataTypes.ENUM('carro', 'moto', 'caminhao', 'suv'),
      defaultValue: 'carro',
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'veiculo',
    timestamps: true,
    createdAt: 'criadoEm',
    updatedAt: 'atualizadoEm',
  }
);

VehicleModel.belongsTo(UserModel, { foreignKey: 'usuarioId', as: 'usuario' });
UserModel.hasMany(VehicleModel, { foreignKey: 'usuarioId', as: 'veiculos' });
