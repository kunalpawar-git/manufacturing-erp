import { Material, InventoryBatch } from '../models/index.js';

/**
 * Scheduled / On-Demand Operational Job:
 * Scans material stock levels against reorder thresholds and flags low-stock alerts.
 */
export const checkLowStockMaterials = async () => {
  const materials = await Material.findAll();
  const batches = await InventoryBatch.findAll({ where: { status: 'Available' } });

  const alerts = [];
  for (const mat of materials) {
    const available = batches
      .filter((b) => b.material_id === mat.id)
      .reduce((acc, b) => acc + parseFloat(b.available_qty || 0), 0);

    if (available <= parseFloat(mat.reorder_level || 0)) {
      alerts.push({
        material_code: mat.material_code,
        material_name: mat.name,
        available_qty: available,
        reorder_level: mat.reorder_level,
      });
    }
  }
  return alerts;
};

