/**
 * Appointment Service
 * Comprehensive appointment management service inspired by web-softclinic-app
 * Includes appointment booking, scheduling, and slot management
 */

import api from '@/lib/api';
import { apiConfig } from '@/config/apiConfig';

// ─── Types & Interfaces ───────────────────────────────────────────────────────

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  patientName: string;
  patientUHID: string;
  patientMobile?: string;
  patientAge?: number;
  patientGender?: string;
  doctorId: string;
  doctorName: string;
  departmentId?: string;
  departmentName?: string;
  facilityId?: string;
  facilityName?: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  durationUnit: 'Minutes' | 'Hours';
  appointmentType: 'New' | 'FollowUp' | 'Emergency' | 'Teleconsultation';
  status: 'Scheduled' | 'CheckedIn' | 'InConsultation' | 'Completed' | 'Cancelled' | 'NoShow';
  priority: 'Normal' | 'Urgent' | 'Emergency';
  chiefComplaint?: string;
  notes?: string;
  bookingSource: 'WalkIn' | 'Phone' | 'Online' | 'Mobile';
  bookingReference?: string;
  slotId?: string;
  tokenNumber?: number;
  waitTime?: number;
  consultationFee?: number;
  paidAmount?: number;
  paymentStatus: 'Pending' | 'Partial' | 'Paid' | 'Refunded';
  paymentMode?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  completedAt?: string;
  completedBy?: string;
  noShowAt?: string;
  noShowReason?: string;
  reminderSent: boolean;
  reminderSentAt?: string;
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  tenantId?: string;
}

export interface AppointmentSlot {
  id: string;
  slotNumber: string;
  doctorId: string;
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  durationUnit: 'Minutes' | 'Hours';
  maxAppointments: number;
  bookedAppointments: number;
  availableAppointments: number;
  isAvailable: boolean;
  slotType: 'Regular' | 'Emergency' | 'Reserved';
  status: 'Active' | 'Inactive' | 'Full' | 'Cancelled';
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  tenantId?: string;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  doctorName: string;
  departmentId?: string;
  facilityId?: string;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  appointmentDuration: number;
  maxAppointments: number;
  breakStartTime?: string;
  breakEndTime?: string;
  isAvailable: boolean;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  tenantId?: string;
}

export interface AppointmentFilter {
  appointmentNumber?: string;
  patientId?: string;
  patientUHID?: string;
  patientName?: string;
  patientMobile?: string;
  doctorId?: string;
  departmentId?: string;
  facilityId?: string;
  appointmentDate?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  appointmentType?: string;
  bookingSource?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SlotFilter {
  doctorId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  isAvailable?: boolean;
  slotType?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface ScheduleFilter {
  doctorId?: string;
  departmentId?: string;
  facilityId?: string;
  dateFrom?: string;
  dateTo?: string;
  isAvailable?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface BookingRequest {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: 'New' | 'FollowUp' | 'Emergency' | 'Teleconsultation';
  chiefComplaint?: string;
  notes?: string;
  bookingSource: 'WalkIn' | 'Phone' | 'Online' | 'Mobile';
  priority?: 'Normal' | 'Urgent' | 'Emergency';
}

export interface SlotTemplate {
  id: string;
  name: string;
  doctorId?: string;
  departmentId?: string;
  startTime: string;
  endTime: string;
  appointmentDuration: number;
  maxAppointments: number;
  breakStartTime?: string;
  breakEndTime?: string;
  slotType: 'Regular' | 'Emergency' | 'Reserved';
  isActive: boolean;
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  tenantId?: string;
}

// ─── Appointment Service ──────────────────────────────────────────────────────

export const appointmentService = {
  // ─── Appointment Management ─────────────────────────────────────────────────

  /**
   * Get appointments with filtering
   */
  getAppointments: async (filter: AppointmentFilter) => {
    const params: any = {
      ...filter,
      pageNumber: filter.pageNumber || 1,
      pageSize: filter.pageSize || 20
    };

    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments`, { params })
      .then(r => r.data);
  },

  /**
   * Get appointment by ID
   */
  getAppointmentById: async (id: string) => {
    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/${id}`)
      .then(r => r.data);
  },

  /**
   * Get appointment by appointment number
   */
  getAppointmentByNumber: async (appointmentNumber: string) => {
    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/number/${appointmentNumber}`)
      .then(r => r.data);
  },

  /**
   * Get appointments by patient ID
   */
  getAppointmentsByPatientId: async (patientId: string) => {
    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/patient/${patientId}`)
      .then(r => r.data);
  },

  /**
   * Get appointments by doctor ID
   */
  getAppointmentsByDoctorId: async (doctorId: string, date?: string) => {
    const params = date ? { date } : {};
    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/doctor/${doctorId}`, { params })
      .then(r => r.data);
  },

  /**
   * Get today's appointments
   */
  getTodayAppointments: async (doctorId?: string, facilityId?: string) => {
    const params: any = {};
    if (doctorId) params.doctorId = doctorId;
    if (facilityId) params.facilityId = facilityId;

    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/today`, { params })
      .then(r => r.data);
  },

  /**
   * Get upcoming appointments
   */
  getUpcomingAppointments: async (patientId: string, limit: number = 5) => {
    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/patient/${patientId}/upcoming`, { params: { limit } })
      .then(r => r.data);
  },

  /**
   * Book appointment
   */
  bookAppointment: async (booking: BookingRequest) => {
    return api.post(`${apiConfig.appointmentService.baseUrl}/api/appointments/book`, booking)
      .then(r => r.data);
  },

  /**
   * Update appointment
   */
  updateAppointment: async (id: string, updates: Partial<Appointment>) => {
    return api.put(`${apiConfig.appointmentService.baseUrl}/api/appointments/${id}`, updates)
      .then(r => r.data);
  },

  /**
   * Cancel appointment
   */
  cancelAppointment: async (id: string, reason: string) => {
    return api.post(`${apiConfig.appointmentService.baseUrl}/api/appointments/${id}/cancel`, { reason })
      .then(r => r.data);
  },

  /**
   * Check-in patient
   */
  checkInPatient: async (id: string, notes?: string) => {
    return api.post(`${apiConfig.appointmentService.baseUrl}/api/appointments/${id}/checkin`, { notes })
      .then(r => r.data);
  },

  /**
   * Mark appointment as no-show
   */
  markNoShow: async (id: string, reason?: string) => {
    return api.post(`${apiConfig.appointmentService.baseUrl}/api/appointments/${id}/no-show`, { reason })
      .then(r => r.data);
  },

  /**
   * Complete appointment
   */
  completeAppointment: async (id: string, completedBy: string) => {
    return api.post(`${apiConfig.appointmentService.baseUrl}/api/appointments/${id}/complete`, { completedBy })
      .then(r => r.data);
  },

  /**
   * Reschedule appointment
   */
  rescheduleAppointment: async (id: string, newDate: string, newTime: string, reason?: string) => {
    return api.post(`${apiConfig.appointmentService.baseUrl}/api/appointments/${id}/reschedule`, { newDate, newTime, reason })
      .then(r => r.data);
  },

  // ─── Slot Management ────────────────────────────────────────────────────────

  /**
   * Get available slots
   */
  getAvailableSlots: async (filter: SlotFilter) => {
    const params: any = {
      ...filter,
      pageNumber: filter.pageNumber || 1,
      pageSize: filter.pageSize || 50
    };

    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/slots`, { params })
      .then(r => r.data);
  },

  /**
   * Get slots by doctor and date
   */
  getSlotsByDoctorAndDate: async (doctorId: string, date: string) => {
    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/slots/doctor/${doctorId}/date/${date}`)
      .then(r => r.data);
  },

  /**
   * Get available slots for booking
   */
  getAvailableSlotsForBooking: async (doctorId: string, date: string, appointmentType?: string) => {
    const params: any = {};
    if (appointmentType) params.appointmentType = appointmentType;

    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/slots/available/doctor/${doctorId}/date/${date}`, { params })
      .then(r => r.data);
  },

  /**
   * Create slot
   */
  createSlot: async (slot: Partial<AppointmentSlot>) => {
    return api.post(`${apiConfig.appointmentService.baseUrl}/api/appointments/slots`, slot)
      .then(r => r.data);
  },

  /**
   * Update slot
   */
  updateSlot: async (id: string, slot: Partial<AppointmentSlot>) => {
    return api.put(`${apiConfig.appointmentService.baseUrl}/api/appointments/slots/${id}`, slot)
      .then(r => r.data);
  },

  /**
   * Delete slot
   */
  deleteSlot: async (id: string) => {
    return api.delete(`${apiConfig.appointmentService.baseUrl}/api/appointments/slots/${id}`)
      .then(r => r.data);
  },

  /**
   * Cancel slot
   */
  cancelSlot: async (id: string, reason: string) => {
    return api.post(`${apiConfig.appointmentService.baseUrl}/api/appointments/slots/${id}/cancel`, { reason })
      .then(r => r.data);
  },

  // ─── Doctor Schedule ────────────────────────────────────────────────────────

  /**
   * Get doctor schedules
   */
  getSchedules: async (filter: ScheduleFilter) => {
    const params: any = {
      ...filter,
      pageNumber: filter.pageNumber || 1,
      pageSize: filter.pageSize || 20
    };

    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/schedules`, { params })
      .then(r => r.data);
  },

  /**
   * Get schedule by ID
   */
  getScheduleById: async (id: string) => {
    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/schedules/${id}`)
      .then(r => r.data);
  },

  /**
   * Get doctor availability
   */
  getDoctorAvailability: async (doctorId: string, dateFrom: string, dateTo: string) => {
    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/schedules/doctor/${doctorId}/availability`, { params: { dateFrom, dateTo } })
      .then(r => r.data);
  },

  /**
   * Create schedule
   */
  createSchedule: async (schedule: Partial<DoctorSchedule>) => {
    return api.post(`${apiConfig.appointmentService.baseUrl}/api/appointments/schedules`, schedule)
      .then(r => r.data);
  },

  /**
   * Update schedule
   */
  updateSchedule: async (id: string, schedule: Partial<DoctorSchedule>) => {
    return api.put(`${apiConfig.appointmentService.baseUrl}/api/appointments/schedules/${id}`, schedule)
      .then(r => r.data);
  },

  /**
   * Delete schedule
   */
  deleteSchedule: async (id: string) => {
    return api.delete(`${apiConfig.appointmentService.baseUrl}/api/appointments/schedules/${id}`)
      .then(r => r.data);
  },

  /**
   * Generate slots from schedule
   */
  generateSlotsFromSchedule: async (scheduleId: string) => {
    return api.post(`${apiConfig.appointmentService.baseUrl}/api/appointments/schedules/${scheduleId}/generate-slots`)
      .then(r => r.data);
  },

  // ─── Slot Templates ─────────────────────────────────────────────────────────

  /**
   * Get slot templates
   */
  getSlotTemplates: async (doctorId?: string, isActive?: boolean) => {
    const params: any = {};
    if (doctorId) params.doctorId = doctorId;
    if (isActive !== undefined) params.isActive = isActive;

    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/slot-templates`, { params })
      .then(r => r.data);
  },

  /**
   * Create slot template
   */
  createSlotTemplate: async (template: Partial<SlotTemplate>) => {
    return api.post(`${apiConfig.appointmentService.baseUrl}/api/appointments/slot-templates`, template)
      .then(r => r.data);
  },

  /**
   * Update slot template
   */
  updateSlotTemplate: async (id: string, template: Partial<SlotTemplate>) => {
    return api.put(`${apiConfig.appointmentService.baseUrl}/api/appointments/slot-templates/${id}`, template)
      .then(r => r.data);
  },

  /**
   * Delete slot template
   */
  deleteSlotTemplate: async (id: string) => {
    return api.delete(`${apiConfig.appointmentService.baseUrl}/api/appointments/slot-templates/${id}`)
      .then(r => r.data);
  },

  // ─── Appointment Statistics & Dashboard ─────────────────────────────────────

  /**
   * Get appointment statistics
   */
  getAppointmentStats: async () => {
    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/statistics`)
      .then(r => r.data?.data || {});
  },

  /**
   * Get appointment dashboard summary
   */
  getDashboardSummary: async () => {
    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/dashboard`)
      .then(r => r.data?.data || {});
  },

  /**
   * Get appointment analytics
   */
  getAppointmentAnalytics: async (dateFrom: string, dateTo: string, groupBy?: 'day' | 'week' | 'month') => {
    const params: any = { dateFrom, dateTo };
    if (groupBy) params.groupBy = groupBy;

    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/analytics`, { params })
      .then(r => r.data?.data || []);
  },

  /**
   * Get no-show statistics
   */
  getNoShowStats: async (dateFrom: string, dateTo: string, doctorId?: string) => {
    const params: any = { dateFrom, dateTo };
    if (doctorId) params.doctorId = doctorId;

    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/statistics/no-show`, { params })
      .then(r => r.data?.data || []);
  },

  // ─── Reminders & Notifications ──────────────────────────────────────────────

  /**
   * Send appointment reminder
   */
  sendReminder: async (appointmentId: string, reminderType: 'SMS' | 'Email' | 'WhatsApp') => {
    return api.post(`${apiConfig.appointmentService.baseUrl}/api/appointments/${appointmentId}/reminder`, { reminderType })
      .then(r => r.data);
  },

  /**
   * Send bulk reminders
   */
  sendBulkReminders: async (date: string, reminderType: 'SMS' | 'Email' | 'WhatsApp' = 'SMS') => {
    return api.post(`${apiConfig.appointmentService.baseUrl}/api/appointments/reminders/send`, { date, reminderType })
      .then(r => r.data);
  },

  // ─── Reports ────────────────────────────────────────────────────────────────

  /**
   * Generate appointment report
   */
  generateAppointmentReport: async (dateFrom: string, dateTo: string, format: 'PDF' | 'Excel' = 'PDF') => {
    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/reports/appointments`, {
      params: { dateFrom, dateTo, format },
      responseType: 'blob'
    })
      .then(r => r.data);
  },

  /**
   * Generate no-show report
   */
  generateNoShowReport: async (dateFrom: string, dateTo: string, format: 'PDF' | 'Excel' = 'PDF') => {
    return api.get(`${apiConfig.appointmentService.baseUrl}/api/appointments/reports/no-show`, {
      params: { dateFrom, dateTo, format },
      responseType: 'blob'
    })
      .then(r => r.data);
  }
};

export default appointmentService;