import { Sequelize } from 'sequelize';

const databaseUrl = process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/carwash';

export const sequelize = new Sequelize(databaseUrl, {
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    charset: 'utf8mb4',
    decimalNumbers: true,
  },
  define: {
    timestamps: true,
  },
});
