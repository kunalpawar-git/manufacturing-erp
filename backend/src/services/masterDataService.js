import {
  Vendor,
  Customer,
  ProductCategory,
  Material,
  Product,
  BomItem,
  Department,
  Location,
} from '../models/index.js';
import { logAudit } from './auditService.js';

// VENDORS
export const getVendors = async () => Vendor.findAll({ order: [['vendor_code', 'ASC']] });
export const getVendorById = async (id) => Vendor.findByPk(id);
export const createVendor = async (data, userId) => {
  const vendor = await Vendor.create(data);
  await logAudit({ userId, action: 'CREATE_VENDOR', entityType: 'Vendor', entityId: vendor.id, newValues: data });
  return vendor;
};
export const updateVendor = async (id, data, userId) => {
  const vendor = await Vendor.findByPk(id);
  if (!vendor) throw new Error('Vendor not found');
  await vendor.update(data);
  await logAudit({ userId, action: 'UPDATE_VENDOR', entityType: 'Vendor', entityId: id, newValues: data });
  return vendor;
};

// CUSTOMERS
export const getCustomers = async () => Customer.findAll({ order: [['customer_code', 'ASC']] });
export const getCustomerById = async (id) => Customer.findByPk(id);
export const createCustomer = async (data, userId) => {
  const customer = await Customer.create(data);
  await logAudit({ userId, action: 'CREATE_CUSTOMER', entityType: 'Customer', entityId: customer.id, newValues: data });
  return customer;
};
export const updateCustomer = async (id, data, userId) => {
  const customer = await Customer.findByPk(id);
  if (!customer) throw new Error('Customer not found');
  await customer.update(data);
  await logAudit({ userId, action: 'UPDATE_CUSTOMER', entityType: 'Customer', entityId: id, newValues: data });
  return customer;
};

// PRODUCT CATEGORIES
export const getCategories = async () => ProductCategory.findAll({ order: [['name', 'ASC']] });
export const createCategory = async (data, userId) => {
  const category = await ProductCategory.create(data);
  await logAudit({ userId, action: 'CREATE_CATEGORY', entityType: 'ProductCategory', entityId: category.id, newValues: data });
  return category;
};

// MATERIALS
export const getMaterials = async () => {
  return Material.findAll({
    include: [{ model: ProductCategory }],
    order: [['material_code', 'ASC']],
  });
};
export const getMaterialById = async (id) => Material.findByPk(id, { include: [ProductCategory] });
export const createMaterial = async (data, userId) => {
  const material = await Material.create(data);
  await logAudit({ userId, action: 'CREATE_MATERIAL', entityType: 'Material', entityId: material.id, newValues: data });
  return material;
};
export const updateMaterial = async (id, data, userId) => {
  const material = await Material.findByPk(id);
  if (!material) throw new Error('Material not found');
  await material.update(data);
  await logAudit({ userId, action: 'UPDATE_MATERIAL', entityType: 'Material', entityId: id, newValues: data });
  return material;
};

// PRODUCTS & BOM
export const getProducts = async () => {
  return Product.findAll({
    include: [
      { model: ProductCategory },
      {
        model: BomItem,
        as: 'bom_items',
        include: [{ model: Material, as: 'material' }],
      },
    ],
    order: [['product_code', 'ASC']],
  });
};
export const getProductById = async (id) => {
  return Product.findByPk(id, {
    include: [
      { model: ProductCategory },
      {
        model: BomItem,
        as: 'bom_items',
        include: [{ model: Material, as: 'material' }],
      },
    ],
  });
};
export const createProduct = async (productData, bomItems = [], userId) => {
  const product = await Product.create(productData);
  if (Array.isArray(bomItems) && bomItems.length > 0) {
    const items = bomItems.map((b) => ({
      ...b,
      product_id: product.id,
    }));
    await BomItem.bulkCreate(items);
  }
  await logAudit({ userId, action: 'CREATE_PRODUCT', entityType: 'Product', entityId: product.id, newValues: productData });
  return getProductById(product.id);
};
export const updateProduct = async (id, productData, bomItems = null, userId) => {
  const product = await Product.findByPk(id);
  if (!product) throw new Error('Product not found');
  await product.update(productData);

  if (bomItems !== null && Array.isArray(bomItems)) {
    await BomItem.destroy({ where: { product_id: id } });
    if (bomItems.length > 0) {
      const items = bomItems.map((b) => ({
        ...b,
        product_id: id,
      }));
      await BomItem.bulkCreate(items);
    }
  }

  await logAudit({ userId, action: 'UPDATE_PRODUCT', entityType: 'Product', entityId: id, newValues: productData });
  return getProductById(id);
};

// DEPARTMENTS & LOCATIONS
export const getDepartments = async () => Department.findAll({ order: [['name', 'ASC']] });
export const getLocations = async () => Location.findAll({ order: [['name', 'ASC']] });
