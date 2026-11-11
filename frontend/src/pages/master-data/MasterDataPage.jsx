import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  Users,
  Truck,
  Building,
  Package,
  Boxes,
  Plus,
  Edit,
  Search,
  Star,
  Layers,
  MapPin,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

const OPERATIONAL_PERMISSION_GROUPS = [
  { label: 'IQC (Incoming Quality Control)', key: 'perform_iqc' },
  { label: 'IQC Approval Authority', key: 'approve_iqc' },
  { label: 'Production Execution', key: 'execute_production' },
  { label: 'Production Planning & Management', key: 'manage_production' },
  { label: 'Quality Control (Sample QC)', key: 'perform_qc' },
  { label: 'Packaging & Box Verification', key: 'perform_packaging' },
  { label: 'QR Code Generation & Printing', key: 'generate_qr' },
  { label: 'Outward / Dispatch Gate Pass', key: 'execute_dispatch' },
  { label: '3-Way Dispatch Approval (Admin)', key: 'dispatch_approval_admin' },
  { label: '3-Way Dispatch Approval (Sales)', key: 'dispatch_approval_sales' },
  { label: '3-Way Dispatch Approval (Accounts)', key: 'dispatch_approval_accounts' },
];

const DEFAULT_UNITS = [
  { code: 'kg', name: 'Kilogram (kg)', category: 'Mass / Weight' },
  { code: 'pcs', name: 'Pieces (pcs)', category: 'Count / Discrete' },
  { code: 'ltr', name: 'Liters (ltr)', category: 'Volume / Liquid' },
  { code: 'mtr', name: 'Meters (mtr)', category: 'Length / Linear' },
  { code: 'set', name: 'Assembly Set (set)', category: 'Composite Unit' },
  { code: 'box', name: 'Master Carton Box (box)', category: 'Packaging Unit' },
];

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('vendors');
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [rolesAndDepts, setRolesAndDepts] = useState({ roles: [], departments: [] });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [deptLocModalOpen, setDeptLocModalOpen] = useState(false);

  // Form states
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [bomRows, setBomRows] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, cRes, mRes, pRes, uRes, catRes, rdRes, deptRes, locRes] = await Promise.all([
        api.get('/vendors'),
        api.get('/customers'),
        api.get('/materials'),
        api.get('/products'),
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/categories'),
        api.get('/users/roles-departments').catch(() => ({ data: { roles: [], departments: [] } })),
        api.get('/departments').catch(() => ({ data: [] })),
        api.get('/locations').catch(() => ({ data: [] })),
      ]);

      setVendors(vRes.data || []);
      setCustomers(cRes.data || []);
      setMaterials(mRes.data || []);
      setProducts(pRes.data || []);
      setUsers(uRes.data || []);
      setCategories(catRes.data || []);
      setRolesAndDepts(rdRes.data || { roles: [], departments: [] });
      setDepartments(deptRes.data || []);
      setLocations(locRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Form Handlers
  const handleVendorSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        await api.put(`/vendors/${selectedItem.id}`, formData);
        toast.success('Vendor updated successfully');
      } else {
        await api.post('/vendors', formData);
        toast.success('Vendor added successfully');
      }
      setVendorModalOpen(false);
      loadData();
    } catch {
      // error toast handled
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        await api.put(`/customers/${selectedItem.id}`, formData);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', formData);
        toast.success('Customer added');
      }
      setCustomerModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        await api.put(`/materials/${selectedItem.id}`, formData);
        toast.success('Material updated');
      } else {
        await api.post('/materials', formData);
        toast.success('Material created');
      }
      setMaterialModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        bom_items: bomRows.filter((r) => r.material_id && Number(r.quantity_required) > 0),
      };
      if (selectedItem) {
        await api.put(`/products/${selectedItem.id}`, payload);
        toast.success('Product & BOM updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product & BOM created');
      }
      setProductModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', formData);
      toast.success('Category created');
      setCategoryModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  const handleDeptLocSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.record_type === 'location') {
        await api.post('/locations', {
          name: formData.name,
          code: formData.code,
          division: formData.division || 'Store',
          description: formData.description,
        });
        toast.success('Storage Location created');
      } else {
        await api.post('/departments', {
          name: formData.name,
          code: formData.code,
          description: formData.description,
        });
        toast.success('Department created');
      }
      setDeptLocModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        await api.put(`/users/${selectedItem.id}`, formData);
        toast.success('User & Operational Permissions updated');
      } else {
        await api.post('/users', formData);
        toast.success('User created');
      }
      setUserModalOpen(false);
      loadData();
    } catch {
      // toast
    }
  };

  const togglePermission = (permKey) => {
    const current = Array.isArray(formData.operational_permissions)
      ? formData.operational_permissions
      : [];
    if (current.includes(permKey)) {
      setFormData({
        ...formData,
        operational_permissions: current.filter((p) => p !== permKey),
      });
    } else {
      setFormData({
        ...formData,
        operational_permissions: [...current, permKey],
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Master Data Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository of vendors, customers, materials, products/BOM, categories, departments, locations, units, and RBAC users.
          </p>
        </div>

        {/* Action Button depending on active tab */}
        <div className="flex gap-2">
          {activeTab === 'vendors' && (
            <button
              onClick={() => { setSelectedItem(null); setFormData({ status: 'Active', rating: 4.5 }); setVendorModalOpen(true); }}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vendor</span>
            </button>
          )}
          {activeTab === 'customers' && (
            <button
              onClick={() => { setSelectedItem(null); setFormData({ status: 'Active' }); setCustomerModalOpen(true); }}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          )}
          {activeTab === 'materials' && (
            <button
              onClick={() => { setSelectedItem(null); setFormData({ status: 'Active', unit: 'kg', reorder_level: 50, standard_cost: 250 }); setMaterialModalOpen(true); }}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Material</span>
            </button>
          )}
          {activeTab === 'products' && (
            <button
              onClick={() => {
                setSelectedItem(null);
                setFormData({ status: 'Active', unit: 'pcs', bom_type: 'Machined Assembly', price: 4500 });
                setBomRows([]);
                setProductModalOpen(true);
              }}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product & BOM</span>
            </button>
          )}
          {activeTab === 'categories' && (
            <button
              onClick={() => { setSelectedItem(null); setFormData({ name: '', description: '' }); setCategoryModalOpen(true); }}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          )}
          {activeTab === 'departments' && (
            <button
              onClick={() => { setSelectedItem(null); setFormData({ record_type: 'department', name: '', code: '', division: 'Store' }); setDeptLocModalOpen(true); }}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department / Location</span>
            </button>
          )}
          {activeTab === 'users' && (
            <button
              onClick={() => {
                setSelectedItem(null);
                setFormData({ status: 'Active', password: 'Demo@123', operational_permissions: ['perform_iqc', 'execute_production'] });
                setUserModalOpen(true);
              }}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-medium">
        {[
          { id: 'vendors', label: `Vendors (${vendors.length})`, icon: Truck },
          { id: 'customers', label: `Customers (${customers.length})`, icon: Building },
          { id: 'materials', label: `Materials (${materials.length})`, icon: Boxes },
          { id: 'products', label: `Products & BOM (${products.length})`, icon: Package },
          { id: 'categories', label: `Categories & Units (${categories.length})`, icon: Layers },
          { id: 'departments', label: `Depts & Locations (${departments.length + locations.length})`, icon: MapPin },
          { id: 'users', label: `Users & RBAC (${users.length})`, icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-700 font-bold bg-brand-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter / Search Bar */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${activeTab}...`}
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        />
      </div>

      {loading ? (
        <LoadingSkeleton rows={5} cols={5} />
      ) : (
        <>
          {/* 1. VENDORS TAB */}
          {activeTab === 'vendors' && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Vendor Name</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">GST Number</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vendors
                      .filter((v) => v.name?.toLowerCase().includes(search.toLowerCase()) || v.vendor_code?.toLowerCase().includes(search.toLowerCase()))
                      .map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">{v.vendor_code}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{v.name}</td>
                          <td className="px-4 py-3">
                            <div>{v.contact_person}</div>
                            <div className="text-[11px] text-slate-400">{v.phone}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px]">{v.gst_number || '-'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              {v.rating}
                            </span>
                          </td>
                          <td className="px-4 py-3"><Badge status={v.status} /></td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => { setSelectedItem(v); setFormData(v); setVendorModalOpen(true); }}
                              className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* 2. CUSTOMERS TAB */}
          {activeTab === 'customers' && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Customer Name</th>
                      <th className="px-4 py-3">Contact Person</th>
                      <th className="px-4 py-3">Phone & Email</th>
                      <th className="px-4 py-3">GST Number</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers
                      .filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()) || c.customer_code?.toLowerCase().includes(search.toLowerCase()))
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">{c.customer_code}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                          <td className="px-4 py-3">{c.contact_person}</td>
                          <td className="px-4 py-3">
                            <div>{c.phone}</div>
                            <div className="text-[11px] text-slate-400">{c.email}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px]">{c.gst_number || '-'}</td>
                          <td className="px-4 py-3"><Badge status={c.status} /></td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => { setSelectedItem(c); setFormData(c); setCustomerModalOpen(true); }}
                              className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* 3. MATERIALS TAB */}
          {activeTab === 'materials' && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Material Code</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3">Reorder Level</th>
                      <th className="px-4 py-3">Standard Cost</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {materials
                      .filter((m) => m.name?.toLowerCase().includes(search.toLowerCase()) || m.material_code?.toLowerCase().includes(search.toLowerCase()))
                      .map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">{m.material_code}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                          <td className="px-4 py-3">{m.ProductCategory?.name || 'General'}</td>
                          <td className="px-4 py-3 font-mono">{m.unit}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{m.reorder_level}</td>
                          <td className="px-4 py-3 font-mono">₹{m.standard_cost?.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3"><Badge status={m.status} /></td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => { setSelectedItem(m); setFormData(m); setMaterialModalOpen(true); }}
                              className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* 4. PRODUCTS & BOM TAB */}
          {activeTab === 'products' && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Product Code</th>
                      <th className="px-4 py-3">Product Name</th>
                      <th className="px-4 py-3">BOM Type</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3">Price (INR)</th>
                      <th className="px-4 py-3">BOM Items</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products
                      .filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()) || p.product_code?.toLowerCase().includes(search.toLowerCase()))
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.product_code}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                          <td className="px-4 py-3 font-mono text-[11px]">{p.bom_type}</td>
                          <td className="px-4 py-3 font-mono">{p.unit}</td>
                          <td className="px-4 py-3 font-mono font-semibold">₹{p.price?.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              <span className="px-2 py-0.5 rounded-full text-[11px] bg-brand-50 text-brand-700 font-mono font-semibold">
                                {p.bom_items?.length || 0} materials
                              </span>
                              {p.bom_items?.map((bi) => (
                                <span key={bi.id} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600">
                                  {bi.material?.material_code}: {bi.quantity_required}{bi.material?.unit}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3"><Badge status={p.status} /></td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedItem(p);
                                setFormData(p);
                                setBomRows(
                                  (p.bom_items || []).map((b) => ({
                                    material_id: b.material_id,
                                    quantity_required: b.quantity_required,
                                    notes: b.notes || '',
                                  }))
                                );
                                setProductModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* 5. CATEGORIES & UNITS OF MEASUREMENT TAB */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Product & Material Categories" subtitle="Master taxonomy for BOM and raw materials">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Category Name</th>
                        <th className="px-4 py-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">CAT-{cat.id}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{cat.name}</td>
                          <td className="px-4 py-3 text-slate-500">{cat.description || 'Standard Manufacturing Category'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card title="Units of Measurement (UoM)" subtitle="Standardized engineering and inventory measurement units">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">UoM Symbol</th>
                        <th className="px-4 py-3">Unit Name</th>
                        <th className="px-4 py-3">Measurement Dimension</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {DEFAULT_UNITS.map((u) => (
                        <tr key={u.code} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-brand-700">{u.code}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{u.name}</td>
                          <td className="px-4 py-3 text-slate-500">{u.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* 6. DEPARTMENTS & LOCATIONS TAB */}
          {activeTab === 'departments' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Plant Departments" subtitle="Organizational units mapped to RBAC users & production lines">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Department Name</th>
                        <th className="px-4 py-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {departments.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">{d.code}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{d.name}</td>
                          <td className="px-4 py-3 text-slate-500">{d.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card title="Warehouse & IQC Storage Locations" subtitle="Physical bins mapped to Paint, Assembly, Store, and Basement divisions">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Bin Code</th>
                        <th className="px-4 py-3">Location Name</th>
                        <th className="px-4 py-3">Division</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {locations.map((loc) => (
                        <tr key={loc.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">{loc.code}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{loc.name}</td>
                          <td className="px-4 py-3"><Badge status={loc.division} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* 7. USERS TAB */}
          {activeTab === 'users' && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">User Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Configurable Operational Permissions</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users
                      .filter((u) => u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
                      .map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-bold text-slate-900">{u.full_name}</td>
                          <td className="px-4 py-3 font-mono text-[11px]">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full font-semibold border border-brand-200">
                              {u.Role?.name || 'User'}
                            </span>
                          </td>
                          <td className="px-4 py-3">{u.Department?.name || 'Operations'}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {Array.isArray(u.operational_permissions) && u.operational_permissions.slice(0, 4).map((p) => (
                                <span key={p} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-600">
                                  {p}
                                </span>
                              ))}
                              {u.operational_permissions?.length > 4 && (
                                <span className="text-[10px] text-slate-400">+{u.operational_permissions.length - 4} more</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3"><Badge status={u.status} /></td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => { setSelectedItem(u); setFormData(u); setUserModalOpen(true); }}
                              className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* VENDOR MODAL */}
      <Modal
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        title={selectedItem ? 'Edit Vendor Details' : 'Register New Vendor'}
      >
        <form onSubmit={handleVendorSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Code</label>
              <input
                type="text"
                required
                value={formData.vendor_code || ''}
                onChange={(e) => setFormData({ ...formData, vendor_code: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                placeholder="V-09"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Name</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contact_person || ''}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST Number</label>
              <input
                type="text"
                value={formData.gst_number || ''}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                placeholder="27AAACT2727Q1ZB"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <textarea
              rows={2}
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setVendorModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Save Vendor</button>
          </div>
        </form>
      </Modal>

      {/* CUSTOMER MODAL */}
      <Modal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title={selectedItem ? 'Edit Customer' : 'Add New Customer'}
      >
        <form onSubmit={handleCustomerSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Code</label>
              <input
                type="text"
                required
                value={formData.customer_code || ''}
                onChange={(e) => setFormData({ ...formData, customer_code: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contact_person || ''}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST Number</label>
              <input
                type="text"
                value={formData.gst_number || ''}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <textarea
              rows={2}
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setCustomerModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Save Customer</button>
          </div>
        </form>
      </Modal>

      {/* MATERIAL MODAL */}
      <Modal
        isOpen={materialModalOpen}
        onClose={() => setMaterialModalOpen(false)}
        title={selectedItem ? 'Edit Raw Material' : 'Add Raw Material'}
      >
        <form onSubmit={handleMaterialSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Material Code</label>
              <input
                type="text"
                required
                value={formData.material_code || ''}
                onChange={(e) => setFormData({ ...formData, material_code: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Material Name</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category_id || ''}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit (UoM)</label>
              <select
                value={formData.unit || 'kg'}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
              >
                {DEFAULT_UNITS.map((u) => (
                  <option key={u.code} value={u.code}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Level</label>
              <input
                type="number"
                value={formData.reorder_level || 50}
                onChange={(e) => setFormData({ ...formData, reorder_level: parseFloat(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setMaterialModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Save Material</button>
          </div>
        </form>
      </Modal>

      {/* PRODUCT & BOM MODAL */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={selectedItem ? 'Edit Product & Bill of Materials (BOM)' : 'Create Product & BOM'}
      >
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Code</label>
              <input
                type="text"
                required
                value={formData.product_code || ''}
                onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">BOM / Part Type</label>
              <input
                type="text"
                value={formData.bom_type || 'Machined Assembly'}
                onChange={(e) => setFormData({ ...formData, bom_type: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price (INR)</label>
              <input
                type="number"
                value={formData.price || 0}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* BOM Editor */}
          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800">Bill of Materials (BOM Requirements per Unit)</label>
              <button
                type="button"
                onClick={() => setBomRows([...bomRows, { material_id: materials[0]?.id || '', quantity_required: 1 }])}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add BOM Material
              </button>
            </div>
            <div className="space-y-2 max-h-44 overflow-y-auto">
              {bomRows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={row.material_id}
                    onChange={(e) => {
                      const updated = [...bomRows];
                      updated[idx].material_id = Number(e.target.value);
                      setBomRows(updated);
                    }}
                    className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  >
                    <option value="">Select Material</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.material_code} - {m.name} ({m.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={row.quantity_required}
                    onChange={(e) => {
                      const updated = [...bomRows];
                      updated[idx].quantity_required = parseFloat(e.target.value) || 0;
                      setBomRows(updated);
                    }}
                    className="w-24 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    placeholder="Qty"
                  />
                  <button
                    type="button"
                    onClick={() => setBomRows(bomRows.filter((_, i) => i !== idx))}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setProductModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Save Product & BOM</button>
          </div>
        </form>
      </Modal>

      {/* CATEGORY MODAL */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Create Product / Material Category"
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              placeholder="e.g., Precision Castings"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setCategoryModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Save Category</button>
          </div>
        </form>
      </Modal>

      {/* DEPARTMENT / LOCATION MODAL */}
      <Modal
        isOpen={deptLocModalOpen}
        onClose={() => setDeptLocModalOpen(false)}
        title="Add Plant Department or Warehouse Location"
      >
        <form onSubmit={handleDeptLocSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Record Type</label>
            <select
              value={formData.record_type || 'department'}
              onChange={(e) => setFormData({ ...formData, record_type: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            >
              <option value="department">Plant Department</option>
              <option value="location">Warehouse / IQC Storage Location</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Code</label>
              <input
                type="text"
                required
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                placeholder="DEPT-09 or LOC-B2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          {formData.record_type === 'location' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IQC / Plant Division</label>
              <select
                value={formData.division || 'Store'}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              >
                <option value="Paint">Paint</option>
                <option value="Assembly">Assembly</option>
                <option value="Store">Store</option>
                <option value="Basement">Basement</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setDeptLocModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Save Record</button>
          </div>
        </form>
      </Modal>

      {/* USER MODAL WITH CONFIGURABLE OPERATIONAL PERMISSIONS */}
      <Modal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={selectedItem ? 'Edit User Credentials & Configurable Operational Permissions' : 'Create System User'}
      >
        <form onSubmit={handleUserSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
              <select
                value={formData.role_id || ''}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              >
                <option value="">Select Role</option>
                {rolesAndDepts.roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={formData.department_id || ''}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              >
                <option value="">Select Department</option>
                {rolesAndDepts.departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Configurable Operational Permissions */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-bold text-slate-800">
                Configurable Operational Permissions (IQC, Production, QC, Packaging, Outward Dispatch)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OPERATIONAL_PERMISSION_GROUPS.map((perm) => {
                const checked = Array.isArray(formData.operational_permissions) && formData.operational_permissions.includes(perm.key);
                return (
                  <label key={perm.key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(perm.key)}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>{perm.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {!selectedItem && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={formData.password || 'Demo@123'}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setUserModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Save User & Permissions</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
