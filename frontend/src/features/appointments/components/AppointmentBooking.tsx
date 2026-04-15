/**
 * AppointmentBooking Component
 * Comprehensive appointment booking and management
 * Inspired by web-softclinic-app's appointment booking features
 */

import React, { useState, useEffect } from 'react';
import { appointmentService, Appointment, AppointmentFilter, Doctor, Patient, AppointmentType, AppointmentStatus } from '../services/appointmentService';

interface AppointmentBookingProps {
  onAppointmentBooked?: (appointment: Appointment) => void;
  onAppointmentUpdated?: (appointment: Appointment) => void;
  showFilters?: boolean;
  showActions?: boolean;
  className?: string;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({
  onAppointmentBooked,
  onAppointmentUpdated,
  showFilters = true,
  showActions = true,
  className = ''
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('appointmentDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Filter states
  const [filters, setFilters] = useState<AppointmentFilter>({
    pageNumber: 1,
    pageSize: 20,
    sortBy: 'appointmentDate',
    sortOrder: 'desc'
  });

  // Form state for booking/editing
  const [bookingFormData, setBookingFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    appointmentTypeId: '',
    reason: '',
    status: 'Scheduled' as AppointmentStatus,
    priority: 'Routine',
    consultationType: 'Physical',
    estimatedDuration: 30
  });

  useEffect(() => {
    loadAppointments();
    loadMasterData();
  }, [filters]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const result = await appointmentService.getAppointments(filters);
      setAppointments(result.data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMasterData = async () => {
    try {
      const [doctorsData, patientsData, typesData] = await Promise.all([
        appointmentService.getDoctors(),
        appointmentService.getPatients(),
        appointmentService.getAppointmentTypes()
      ]);

      setDoctors(doctorsData);
      setPatients(patientsData);
      setAppointmentTypes(typesData);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      pageNumber: key === 'pageSize' ? 1 : prev.pageNumber
    }));
  };

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(column);
    setSortOrder(newOrder);
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: newOrder
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters(prev => ({
      ...prev,
      pageNumber: page
    }));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    setFilters(prev => ({
      ...prev,
      pageSize: size,
      pageNumber: 1
    }));
  };

  const handleSelectAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleBookAppointment = () => {
    setBookingFormData({
      patientId: '',
      doctorId: '',
      appointmentDate: '',
      appointmentTime: '',
      appointmentTypeId: '',
      reason: '',
      status: 'Scheduled',
      priority: 'Routine',
      consultationType: 'Physical',
      estimatedDuration: 30
    });
    setShowBookingModal(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setBookingFormData({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      appointmentTypeId: appointment.appointmentTypeId,
      reason: appointment.reason || '',
      status: appointment.status,
      priority: appointment.priority,
      consultationType: appointment.consultationType,
      estimatedDuration: appointment.estimatedDuration || 30
    });
    setShowEditModal(true);
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleSaveAppointment = async () => {
    try {
      const appointmentData = {
        ...bookingFormData,
        estimatedDuration: parseInt(bookingFormData.estimatedDuration.toString())
      };

      if (selectedAppointment && selectedAppointment.id) {
        await appointmentService.updateAppointment(selectedAppointment.id, appointmentData);
        onAppointmentUpdated && onAppointmentUpdated({ ...selectedAppointment, ...appointmentData });
      } else {
        const newAppointment = await appointmentService.createAppointment(appointmentData);
        onAppointmentBooked && onAppointmentBooked(newAppointment);
      }
      
      loadAppointments();
      setShowBookingModal(false);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const handleCancelAppointmentConfirm = async () => {
    if (!selectedAppointment) return;

    try {
      await appointmentService.cancelAppointment(selectedAppointment.id, 'Patient Request');
      loadAppointments();
      setShowCancelModal(false);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const loadAvailableSlots = async (doctorId: string, date: string) => {
    try {
      const slots = await appointmentService.getAvailableSlots(doctorId, date);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading available slots:', error);
      setAvailableSlots([]);
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">Scheduled</span>;
      case 'confirmed':
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Confirmed</span>;
      case 'checkedin':
        return <span className="px-2 py-1 text-xs font-semibold text-purple-800 bg-purple-100 rounded-full">Checked In</span>;
      case 'inprogress':
        return <span className="px-2 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full">In Progress</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Cancelled</span>;
      case 'noshow':
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">No Show</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'routine':
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Routine</span>;
      case 'urgent':
        return <span className="px-2 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full">Urgent</span>;
      case 'emergency':
        return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Emergency</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">{priority}</span>;
    }
  };

  const getConsultationTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'physical':
        return <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">Physical</span>;
      case 'teleconsultation':
        return <span className="px-2 py-1 text-xs font-semibold text-purple-800 bg-purple-100 rounded-full">Tele</span>;
      case 'homevisit':
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Home</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">{type}</span>;
    }
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? `${doctor.firstName} ${doctor.lastName}` : '-';
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : '-';
  };

  const getAppointmentTypeName = (typeId: string) => {
    const type = appointmentTypes.find(t => t.id === typeId);
    return type ? type.name : '-';
  };

  const totalPages = Math.ceil((appointments.length || 0) / pageSize);

  return (
    <div className={`appointment-booking ${className}`}>
      {/* Header with Add Button */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Appointment Booking</h2>
        <button
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          onClick={handleBookAppointment}
        >
          <span className="mr-2">+</span> Book New Appointment
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Search by patient name, doctor name..."
                value={filters.searchTerm || ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
              <select
                className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.doctorId || ''}
                onChange={(e) => handleFilterChange('doctorId', e.target.value)}
              >
                <option value="">All Doctors</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.firstName} {doctor.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Patient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
              <select
                className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.patientId || ''}
                onChange={(e) => handleFilterChange('patientId', e.target.value)}
              >
                <option value="">All Patients</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Confirmed">Confirmed</option>
                <option value="CheckedIn">Checked In</option>
                <option value="InProgress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="NoShow">No Show</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={filters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="mt-4 flex justify-end space-x-3">
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => {
                setFilters({
                  pageNumber: 1,
                  pageSize: 20,
                  sortBy: 'appointmentDate',
                  sortOrder: 'desc'
                });
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              onClick={loadAppointments}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}

      {/* Appointments Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('appointmentDate')}
                >
                  Date & Time {getSortIcon('appointmentDate')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('patientName')}
                >
                  Patient {getSortIcon('patientName')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('doctorName')}
                >
                  Doctor {getSortIcon('doctorName')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('appointmentType')}
                >
                  Type {getSortIcon('appointmentType')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Priority
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Consultation
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Duration
                </th>
                {showActions && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={showActions ? 9 : 8} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={showActions ? 9 : 8} className="px-4 py-8 text-center text-gray-500">
                    No appointments found. Try adjusting your filters or book a new appointment.
                  </td>
                </tr>
              ) : (
                appointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedAppointment?.id === appointment.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleSelectAppointment(appointment)}
                  >
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {new Date(appointment.appointmentDate).toLocaleDateString('en-IN')}
                        </span>
                        <span className="text-gray-500">{appointment.appointmentTime}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm">{getPatientName(appointment.patientId).charAt(0)}</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {getPatientName(appointment.patientId)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.patientUHID}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {getDoctorName(appointment.doctorId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {getAppointmentTypeName(appointment.appointmentTypeId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {getStatusBadge(appointment.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {getPriorityBadge(appointment.priority)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {getConsultationTypeBadge(appointment.consultationType)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {appointment.estimatedDuration} min
                    </td>
                    {showActions && (
                      <td className="px-4 py-3 text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="flex space-x-2">
                          <button
                            className="text-green-600 hover:text-green-900"
                            onClick={() => handleEditAppointment(appointment)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleCancelAppointment(appointment)}
                            title="Cancel"
                            disabled={appointment.status === 'Completed' || appointment.status === 'Cancelled'}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * pageSize, appointments.length || 0)}
              </span>{' '}
              of <span className="font-medium">{appointments.length || 0}</span> appointments
            </div>
            <select
              className="form-select text-sm border-gray-300 rounded-md"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            >
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    currentPage === pageNum
                      ? 'text-white bg-blue-600'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Book New Appointment</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {/* Patient Information */}
              <div className="col-span-2">
                <h4 className="font-medium text-gray-700 mb-3">Patient Information</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient <span className="text-red-500">*</span>
                </label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={bookingFormData.patientId}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, patientId: e.target.value }))}
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} (UHID: {patient.uhid})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor <span className="text-red-500">*</span>
                </label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={bookingFormData.doctorId}
                  onChange={(e) => {
                    setBookingFormData(prev => ({ ...prev, doctorId: e.target.value, appointmentTime: '' }));
                    if (e.target.value && bookingFormData.appointmentDate) {
                      loadAvailableSlots(e.target.value, bookingFormData.appointmentDate);
                    }
                  }}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.firstName} {doctor.lastName} ({doctor.specialization})
                    </option>
                  ))}
                </select>
              </div>

              {/* Appointment Details */}
              <div className="col-span-2 mt-4">
                <h4 className="font-medium text-gray-700 mb-3">Appointment Details</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={bookingFormData.appointmentDate}
                  onChange={(e) => {
                    setBookingFormData(prev => ({ ...prev, appointmentDate: e.target.value, appointmentTime: '' }));
                    if (bookingFormData.doctorId) {
                      loadAvailableSlots(bookingFormData.doctorId, e.target.value);
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time <span className="text-red-500">*</span>
                </label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={bookingFormData.appointmentTime}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                  disabled={!availableSlots.length}
                >
                  <option value="">Select Time Slot</option>
                  {availableSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                {!availableSlots.length && bookingFormData.doctorId && bookingFormData.appointmentDate && (
                  <p className="text-xs text-gray-500 mt-1">Select doctor and date to see available slots</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={bookingFormData.appointmentTypeId}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, appointmentTypeId: e.target.value }))}
                >
                  <option value="">Select Type</option>
                  {appointmentTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={bookingFormData.estimatedDuration}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={bookingFormData.priority}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Type</label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={bookingFormData.consultationType}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, consultationType: e.target.value }))}
                >
                  <option value="Physical">Physical</option>
                  <option value="Teleconsultation">Teleconsultation</option>
                  <option value="HomeVisit">Home Visit</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
                <textarea
                  className="form-textarea w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  value={bookingFormData.reason}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Enter reason for visit"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                onClick={handleSaveAppointment}
                disabled={!bookingFormData.patientId || !bookingFormData.doctorId || !bookingFormData.appointmentDate || !bookingFormData.appointmentTime}
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Appointment</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {/* Patient Information */}
              <div className="col-span-2">
                <h4 className="font-medium text-gray-700 mb-3">Patient Information</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={bookingFormData.patientId}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, patientId: e.target.value }))}
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} (UHID: {patient.uhid})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={bookingFormData.doctorId}
                  onChange={(e) => {
                    setBookingFormData(prev => ({ ...prev, doctorId: e.target.value, appointmentTime: '' }));
                    if (e.target.value && bookingFormData.appointmentDate) {
                      loadAvailableSlots(e.target.value, bookingFormData.appointmentDate);
                    }
                  }}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.firstName} {doctor.lastName} ({doctor.specialization})
                    </option>
                  ))}
                </select>
              </div>

              {/* Appointment Details */}
              <div className="col-span-2 mt-4">
                <h4 className="font-medium text-gray-700 mb-3">Appointment Details</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={bookingFormData.appointmentDate}
                  onChange={(e) => {
                    setBookingFormData(prev => ({ ...prev, appointmentDate: e.target.value, appointmentTime: '' }));
                    if (bookingFormData.doctorId) {
                      loadAvailableSlots(bookingFormData.doctorId, e.target.value);
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={bookingFormData.appointmentTime}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                  disabled={!availableSlots.length}
                >
                  <option value="">Select Time Slot</option>
                  {availableSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={bookingFormData.appointmentTypeId}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, appointmentTypeId: e.target.value }))}
                >
                  <option value="">Select Type</option>
                  {appointmentTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={bookingFormData.status}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, status: e.target.value as AppointmentStatus }))}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="CheckedIn">Checked In</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="NoShow">No Show</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={bookingFormData.priority}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Type</label>
                <select
                  className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={bookingFormData.consultationType}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, consultationType: e.target.value }))}
                >
                  <option value="Physical">Physical</option>
                  <option value="Teleconsultation">Teleconsultation</option>
                  <option value="HomeVisit">Home Visit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={bookingFormData.estimatedDuration}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) }))}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
                <textarea
                  className="form-textarea w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  value={bookingFormData.reason}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Enter reason for visit"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                onClick={handleSaveAppointment}
              >
                Update Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">
              ⚠️ Cancel Appointment
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </p>
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-medium">Patient: {getPatientName(selectedAppointment.patientId)}</p>
                <p className="text-sm text-gray-600">Date: {new Date(selectedAppointment.appointmentDate).toLocaleDateString('en-IN')} at {selectedAppointment.appointmentTime}</p>
                <p className="text-sm text-gray-600">Doctor: {getDoctorName(selectedAppointment.doctorId)}</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Appointment
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                onClick={handleCancelAppointmentConfirm}
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentBooking;