import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const dialect = process.env. DATABASE_URL ? 'postgres' : (process.env.DB_DIALECT || 'sqlite');

let sequelize;

if (process.env.DATABASE_URL) {
  // Cloud PostgreSQL connection string (Neon.tech, Supabase, Render, Railway)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions:
      process.env.DB_SSL === 'false'
        ? {}
        : {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          },
    define: {
      timestamps: true,
      underscored: true,
    },
  });
} else if (dialect === 'postgres') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'manufacturing_erp',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: true,
      },
    }
  );
} else {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const storagePath = process.env.DB_STORAGE
    ? path.resolve(process.cwd(), process.env.DB_STORAGE)
    : path.resolve(dataDir, 'manufacturing_erp.sqlite');

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  });
}

export const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log(`[Database] Connection established successfully using [${sequelize.getDialect()}] dialect.`);
    return sequelize;
  } catch (error) {
    if (dialect === 'postgres') {
      console.warn(`[Database] Failed to connect to PostgreSQL (${error.message}). Falling back to local SQLite engine for out-of-the-box operation.`);
      const dataDir = path.resolve(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const storagePath = path.resolve(dataDir, 'manufacturing_erp.sqlite');
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: storagePath,
        logging: false,
        define: {
          timestamps: true,
          underscored: true,
        },
      });
      await sequelize.authenticate();
      console.log(`[Database] Fallback SQLite connection active at: ${storagePath}`);
      return sequelize;
    }
    throw error;
  }
};

export default sequelize;
