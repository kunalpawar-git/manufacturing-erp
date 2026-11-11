import * as masterDataService from '../services/masterDataService.js';

// VENDORS
export const getVendors = async (req, res, next) => {
  try {
    const data = await masterDataService.getVendors();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
export const createVendor = async (req, res, next) => {
  try {
    const data = await masterDataService.createVendor(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Vendor registered successfully', data });
  } catch (err) { next(err); }
};
export const updateVendor = async (req, res, next) => {
  try {
    const data = await masterDataService.updateVendor(req.params.id, req.body, req.user.id);
    res.json({ success: true, message: 'Vendor updated successfully', data });
  } catch (err) { next(err); }
};

// CUSTOMERS
export const getCustomers = async (req, res, next) => {
  try {
    const data = await masterDataService.getCustomers();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
export const createCustomer = async (req, res, next) => {
  try {
    const data = await masterDataService.createCustomer(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Customer registered successfully', data });
  } catch (err) { next(err); }
};
export const updateCustomer = async (req, res, next) => {
  try {
    const data = await masterDataService.updateCustomer(req.params.id, req.body, req.user.id);
    res.json({ success: true, message: 'Customer updated successfully', data });
  } catch (err) { next(err); }
};

// CATEGORIES
export const getCategories = async (req, res, next) => {
  try {
    const data = await masterDataService.getCategories();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
export const createCategory = async (req, res, next) => {
  try {
    const data = await masterDataService.createCategory(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Category created', data });
  } catch (err) { next(err); }
};

// MATERIALS
export const getMaterials = async (req, res, next) => {
  try {
    const data = await masterDataService.getMaterials();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
export const createMaterial = async (req, res, next) => {
  try {
    const data = await masterDataService.createMaterial(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Material added', data });
  } catch (err) { next(err); }
};
export const updateMaterial = async (req, res, next) => {
  try {
    const data = await masterDataService.updateMaterial(req.params.id, req.body, req.user.id);
    res.json({ success: true, message: 'Material updated', data });
  } catch (err) { next(err); }
};

// PRODUCTS & BOM
export const getProducts = async (req, res, next) => {
  try {
    const data = await masterDataService.getProducts();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
export const getProductById = async (req, res, next) => {
  try {
    const data = await masterDataService.getProductById(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
export const createProduct = async (req, res, next) => {
  try {
    const { bom_items, ...productData } = req.body;
    const data = await masterDataService.createProduct(productData, bom_items, req.user.id);
    res.status(201).json({ success: true, message: 'Product & BOM created', data });
  } catch (err) { next(err); }
};
export const updateProduct = async (req, res, next) => {
  try {
    const { bom_items, ...productData } = req.body;
    const data = await masterDataService.updateProduct(req.params.id, productData, bom_items, req.user.id);
    res.json({ success: true, message: 'Product updated', data });
  } catch (err) { next(err); }
};

// DEPARTMENTS & LOCATIONS
export const getDepartments = async (req, res, next) => {
  try {
    const data = await masterDataService.getDepartments();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
export const createDepartment = async (req, res, next) => {
  try {
    const data = await masterDataService.createDepartment(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Department created', data });
  } catch (err) { next(err); }
};
export const getLocations = async (req, res, next) => {
  try {
    const data = await masterDataService.getLocations();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
export const createLocation = async (req, res, next) => {
  try {
    const data = await masterDataService.createLocation(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Location created', data });
  } catch (err) { next(err); }
};
