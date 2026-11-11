# Architecture & Documented Business Assumptions

This document captures the architectural decisions and explicit design resolutions for the **5 Open Questions / Ambiguities** identified in `Inventory_Production_Traceability_Requirements_Report.pdf` and `Client_Inventory_Production_QR_Workflow_Flowcharts.pdf`:

1. **Counterparty & PO Direction (`po_direction`)**:
   - The Purchase Order module supports both `Inbound Supplier PO` (linked to a `Vendor`) and `Outbound Customer SO` (linked to a `Customer`) so the plant can track supplier procurement as well as customer-supplied order references.
2. **Configurable Operational Permissions**:
   - In addition to primary RBAC roles (`Super Admin`, `Admin`, `Sales`, `Accounts`), granular operational permissions (`perform_iqc`, `execute_production`, `perform_qc`, `perform_packaging`, `generate_qr`, `execute_dispatch`) can be toggled per user in Master Data -> Users & RBAC.
3. **4 IQC Divisions (`Paint`, `Assembly`, `Store`, `Basement`)**:
   - Every material receipt and IQC inspection is routed to one of the four divisions, preserves the original `vendor_batch_number` immutably, and generates a unique internal batch ID (`B-2026-XXXX`). Rejected or Quarantined batches are blocked from entering available inventory.
4. **QR Code Granularity (`Part QR` + `Box QR` + `Batch` + `Shipment`)**:
   - Both individual Part QRs (`PT-0001`..`PT-0010`) and Master Carton Box QRs (`BX-0001` / `BX-0145`) are generated only after Packaging Verification & Approval.
5. **Accounts Checklist Customer Acknowledgement (`acknowledgement_method`)**:
   - Supports 4 configurable methods (`Document Upload`, `Email Acknowledgement`, `Customer Portal`, `Internal Verification`). Editing a checklist after clearance automatically invalidates all three dispatch approvals (`Admin`, `Sales`, `Accounts`) and logs a critical audit trail event.

