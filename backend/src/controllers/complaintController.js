import * as complaintService from '../services/complaintService.js';
import * as reportService from '../services/reportService.js';
import * as dashboardService from '../services/dashboardService.js';
import * as notificationService from '../services/notificationService.js';
import * as auditService from '../services/auditService.js';

// COMPLAINTS
export const getComplaints = async (req, res, next) => {
  try {
    const data = await complaintService.getComplaints(req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getComplaintById = async (req, res, next) => {
  try {
    const data = await complaintService.getComplaintById(req.params.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const registerComplaint = async (req, res, next) => {
  try {
    const data = await complaintService.registerComplaint(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: `Complaint registered. Verification status: ${data.complaint.verification_status}`,
      data,
    });
  } catch (err) { next(err); }
};

export const updateComplaintInvestigation = async (req, res, next) => {
  try {
    const data = await complaintService.updateComplaintInvestigation(req.params.id, req.body, req.user.id);
    res.json({ success: true, message: 'Complaint investigation updated', data });
  } catch (err) { next(err); }
};

// REPORTS
export const getReportData = async (req, res, next) => {
  try {
    const data = await reportService.getReportData(req.params.reportType, req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const exportReportExcel = async (req, res, next) => {
  try {
    const excelBuffer = await reportService.exportReportExcel(req.params.reportType, req.query);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Report_${req.params.reportType}_${Date.now()}.xlsx`);
    res.send(excelBuffer);
  } catch (err) { next(err); }
};

export const exportReportPdf = async (req, res, next) => {
  try {
    const pdfBuffer = await reportService.exportReportPdf(req.params.reportType, req.query);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Report_${req.params.reportType}_${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};

// DASHBOARD
export const getDashboardMetrics = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardMetrics(req.user);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// NOTIFICATIONS
export const getNotifications = async (req, res, next) => {
  try {
    const data = await notificationService.getUserNotifications(req.user.id, req.user.role);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const data = await notificationService.markAsRead(req.params.id, req.user.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id, req.user.role);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};

// AUDIT LOGS
export const getAuditLogs = async (req, res, next) => {
  try {
    const data = await auditService.getAuditLogs(req.query);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
