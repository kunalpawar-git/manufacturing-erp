export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Manufacturing ERP API - QR Traceability & 3-Way Dispatch Clearance',
    version: '1.0.0',
    description: `Complete REST API for Manufacturing Operations ERP.
    Primary capabilities:
    - Order intake & PO Management (Supplier/Customer configurable)
    - 4 IQC Divisions (Paint, Assembly, Store, Basement) with Immutable Vendor Batch Retention & Unique Internal Batch IDs
    - Batch-level Inventory Ledger & Stock Movement Transactions
    - Sales Requirement Submission & Admin Approval Engine
    - Production Work Orders & Consumed Source Batch Allocation
    - Sample QC Inspections & Pass/Fail Rework loops
    - Packaging Inspections & Dual QR Generation (Part QR + Master Box QR)
    - Accounts Dispatch Checklist & Commercial Acknowledgement
    - Mandatory 3-Way Dispatch Clearance (Admin + Sales + Accounts)
    - Outward Gate-Out Dispatch & Delivery Challan PDF
    - Complaint Traceability & Authenticity Investigation
    - 17 Reports with Excel/PDF export & Audit Logs`,
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local ERP Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/api/auth/login': {
      post: {
        summary: 'Authenticate demo user & receive JWT token',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'superadmin@demo.com' },
                  password: { type: 'string', example: 'Demo@123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'JWT token and user profile returned' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/dashboard': {
      get: {
        summary: 'Retrieve role-based metrics, widgets, and charts',
        tags: ['Dashboard'],
        responses: { 200: { description: 'Aggregated analytics data' } },
      },
    },
    '/api/qr/scan': {
      post: {
        summary: 'Resolve scanned QR code / opaque token and retrieve end-to-end traceability timeline',
        tags: ['QR Traceability'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'PT-0001' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Complete visual lineage and authenticity verification' } },
      },
    },
    '/api/dispatch-approvals/{shipmentId}/decision': {
      post: {
        summary: 'Submit Admin, Sales, or Accounts approval for 3-way clearance',
        tags: ['3-Way Clearance'],
        parameters: [{ name: 'shipmentId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  decision: { type: 'string', enum: ['Approved', 'Rejected'], example: 'Approved' },
                  comments: { type: 'string', example: 'Commercial terms verified' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Approval state updated' } },
      },
    },
    '/api/shipments/{id/dispatch': {
      post: {
        summary: 'Execute Outward Dispatch (Requires verified 3-Way clearance)',
        tags: ['Outward Dispatch'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Dispatched successfully' },
          400: { description: 'Forbidden if clearance incomplete' },
        },
      },
    },
  },
};
