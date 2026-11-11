/**
 * Initial ERP Database Migration (PostgreSQL / SQLite via Sequelize)
 * Syncs all 25 normalized tables for Manufacturing Inventory, Production & QR Traceability ERP.
 */
import sequelize from '../models/index.js';

export async function up() {
  await sequelize.sync({ alter: true });
}

export async function down() {
  await sequelize.drop();
}

