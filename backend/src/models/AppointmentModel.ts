import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './database';
import { UserModel } from './UserModel';
import { VehicleModel } from './VehicleModel';
import { ServiceModel } from './ServiceModel';
import { StatusAgendamento } from '../types';

interface AgendamentoAtributos {
  id: string;
  usuarioId: string;
  veiculoId: string;
  servicoId: string;
  agendadoPara: Date;
  status: StatusAgendamento;
  observacoes?: string;
  precoTotal: number;
  criadoEm?: Date;
  atualizadoEm?: Date;
}

interface AgendamentoCriacao extends Optional<AgendamentoAtributos, 'id' | 'status' | 'observacoes'> {}

export class AppointmentModel extends Model<AgendamentoAtributos, AgendamentoCriacao> {
  declare id: string;
  declare usuarioId: string;
  declare veiculoId: string;
  declare servicoId: string;
  declare agendadoPara: Date;
  declare status: StatusAgendamento;
  declare observacoes: string | null;
  declare precoTotal: number;
  declare criadoEm: Date;
  declare atualizadoEm: Date;
}

AppointmentModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    usuarioId: { type: DataTypes.UUID, allowNull: false },
    veiculoId: { type: DataTypes.UUID, allowNull: false },
    servicoId: { type: DataTypes.UUID, allowNull: false },
    agendadoPara: { type: DataTypes.DATE, allowNull: false },
    status: {
      type: DataTypes.ENUM('pendente', 'em_andamento', 'concluido', 'cancelado'),
      defaultValue: 'pendente',
      allowNull: false,
    },
    observacoes: { type: DataTypes.STRING(255), allowNull: true },
    precoTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  {
    sequelize,
    tableName: 'agendamento',
    timestamps: true,
    createdAt: 'criadoEm',
    updatedAt: 'atualizadoEm',
  }
);

AppointmentModel.belongsTo(UserModel, { foreignKey: 'usuarioId', as: 'usuario' });
AppointmentModel.belongsTo(VehicleModel, { foreignKey: 'veiculoId', as: 'veiculo' });
AppointmentModel.belongsTo(ServiceModel, { foreignKey: 'servicoId', as: 'servico' });

UserModel.hasMany(AppointmentModel, { foreignKey: 'usuarioId', as: 'agendamentos' });
VehicleModel.hasMany(AppointmentModel, { foreignKey: 'veiculoId', as: 'agendamentos' });
ServiceModel.hasMany(AppointmentModel, { foreignKey: 'servicoId', as: 'agendamentos' });
