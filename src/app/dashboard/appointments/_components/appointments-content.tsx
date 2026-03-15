// src/app/dashboard/appointments/_components/appointments-content.tsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  List,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  RefreshCw,
} from 'lucide-react';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
type ViewMode = 'list' | 'calendar';
type CalendarMode = 'week' | 'day';

interface Appointment {
  id: string;
  startUtc: Date;
  endUtc: Date;
  status: BookingStatus;
  paymentStatus: string;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  clientNotes: string | null;
  internalNotes: string | null;
  createdAt: Date;
  serviceName: string | null;
  serviceDuration: number | null;
  servicePriceCents: number | null;
  proposedStartUtc: Date | null;
  proposedEndUtc: Date | null;
  proposedAt: Date | null;
  rescheduleNote: string | null;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: AlertCircle },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
  no_show: { label: 'No Show', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200', icon: XCircle },
};

const CALENDAR_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 border-l-amber-500 text-amber-900',
  confirmed: 'bg-blue-100 border-l-blue-500 text-blue-900',
  completed: 'bg-emerald-100 border-l-emerald-500 text-emerald-900',
  cancelled: 'bg-red-50 border-l-red-300 text-red-400 line-through opacity-60',
  no_show: 'bg-slate-100 border-l-slate-400 text-slate-500 opacity-60',
};

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

export function AppointmentsContent({ appointments }: { appointments: Appointment[] }) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>('calendar');
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('week');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [detailApt, setDetailApt] = useState<Appointment | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Reschedule modal state
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleNote, setRescheduleNote] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const now = new Date();

  // Filtering for list view
  const filtered = appointments.filter((apt) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return new Date(apt.startUtc) > now && apt.status !== 'cancelled';
    return apt.status === filter;
  });

  // Week helpers
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const weekStart = getWeekStart(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Group appointments by date for calendar
  const aptsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach((apt) => {
      if (apt.status === 'cancelled' || apt.status === 'no_show') return;
      const key = new Date(apt.startUtc).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(apt);
    });
    return map;
  }, [appointments]);

  const handleStatusUpdate = async (id: string, status: BookingStatus) => {
    try {
      await fetch(`/api/dashboard/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } catch {
      // silently fail
    }
  };

  const openRescheduleModal = (apt: Appointment) => {
    const start = new Date(apt.startUtc);
    // Pre-fill with current date/time
    setRescheduleDate(start.toISOString().split('T')[0]);
    setRescheduleTime(start.toTimeString().slice(0, 5));
    setRescheduleNote('');
    setRescheduleApt(apt);
  };

  const handleProposeReschedule = async () => {
    if (!rescheduleApt || !rescheduleDate || !rescheduleTime) return;
    setRescheduling(true);
    try {
      const proposedStart = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
      const duration = rescheduleApt.serviceDuration || 30;
      const proposedEnd = new Date(proposedStart.getTime() + duration * 60_000);

      await fetch(`/api/dashboard/appointments/${rescheduleApt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'propose_reschedule',
          proposedStartUtc: proposedStart.toISOString(),
          proposedEndUtc: proposedEnd.toISOString(),
          rescheduleNote: rescheduleNote || null,
        }),
      });
      setRescheduleApt(null);
      setDetailApt(null);
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setRescheduling(false);
    }
  };

  const handleCancelReschedule = async (id: string) => {
    try {
      await fetch(`/api/dashboard/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_reschedule' }),
      });
      router.refresh();
    } catch {
      // silently fail
    }
  };

  const navigateWeek = (dir: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (dir * (calendarMode === 'week' ? 7 : 1)));
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  const isToday = (d: Date) => d.toDateString() === now.toDateString();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Appointments</h2>
          <p className="text-slate-500 mt-1">Manage your upcoming and past bookings.</p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView('calendar')}
            className={`p-2 rounded-md transition-colors ${
              view === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Calendar view"
          >
            <CalendarDays className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-md transition-colors ${
              view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ======================== CALENDAR VIEW ======================== */}
      {view === 'calendar' && (
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
          {/* Calendar header */}
          <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateWeek(-1)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateWeek(1)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-slate-900 ml-2">
                {calendarMode === 'week'
                  ? `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setCalendarMode('day')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  calendarMode === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setCalendarMode('week')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  calendarMode === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Week
              </button>
            </div>
          </div>

          {/* Week view */}
          {calendarMode === 'week' && (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-slate-100">
                  {weekDays.map((day, i) => (
                    <button
                      key={i}
                      onClick={() => { setCurrentDate(day); setCalendarMode('day'); }}
                      className={`py-3 text-center border-r border-slate-50 last:border-r-0 hover:bg-slate-50 transition-colors ${
                        isToday(day) ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <p className="text-xs text-slate-400 uppercase">
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className={`text-lg font-semibold mt-0.5 ${
                        isToday(day)
                          ? 'text-blue-600'
                          : 'text-slate-900'
                      }`}>
                        {day.getDate()}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Time grid */}
                <div className="relative">
                  {HOURS.map((hour) => (
                    <div key={hour} className="grid grid-cols-7 border-b border-slate-50" style={{ minHeight: '56px' }}>
                      {weekDays.map((day, dayIdx) => {
                        const dateKey = day.toDateString();
                        const dayApts = (aptsByDate[dateKey] || []).filter((apt) => {
                          const h = new Date(apt.startUtc).getHours();
                          return h === hour;
                        });

                        return (
                          <div
                            key={dayIdx}
                            className={`relative border-r border-slate-50 last:border-r-0 p-0.5 ${
                              isToday(day) ? 'bg-blue-50/30' : ''
                            }`}
                          >
                            {/* Hour label (only in first column) */}
                            {dayIdx === 0 && (
                              <span className="absolute -top-2.5 -left-0.5 text-[10px] text-slate-400 bg-white px-1 z-10">
                                {hour === 0 ? '12 AM' : hour <= 12 ? `${hour} ${hour < 12 ? 'AM' : 'PM'}` : `${hour - 12} PM`}
                              </span>
                            )}

                            {dayApts.map((apt) => (
                              <button
                                key={apt.id}
                                onClick={() => setDetailApt(apt)}
                                className={`w-full text-left px-1.5 py-1 rounded border-l-2 text-[11px] leading-tight mb-0.5 truncate hover:opacity-80 transition-opacity ${CALENDAR_COLORS[apt.status]}`}
                              >
                                <span className="font-medium block truncate">{apt.clientName || 'Client'}</span>
                                <span className="truncate block opacity-75">{apt.serviceName}</span>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Day view */}
          {calendarMode === 'day' && (
            <div>
              <div className="divide-y divide-slate-50">
                {HOURS.map((hour) => {
                  const dateKey = currentDate.toDateString();
                  const hourApts = (aptsByDate[dateKey] || []).filter((apt) => {
                    const h = new Date(apt.startUtc).getHours();
                    return h === hour;
                  });

                  return (
                    <div key={hour} className="flex" style={{ minHeight: '64px' }}>
                      <div className="w-16 sm:w-20 shrink-0 py-2 px-2 text-right">
                        <span className="text-xs text-slate-400">
                          {hour === 0 ? '12 AM' : hour <= 12 ? `${hour} ${hour < 12 ? 'AM' : 'PM'}` : `${hour - 12} PM`}
                        </span>
                      </div>
                      <div className={`flex-1 border-l border-slate-100 p-1 space-y-1 ${
                        isToday(currentDate) && hour === now.getHours() ? 'bg-blue-50/30' : ''
                      }`}>
                        {hourApts.map((apt) => (
                          <button
                            key={apt.id}
                            onClick={() => setDetailApt(apt)}
                            className={`w-full text-left px-3 py-2 rounded-lg border-l-3 text-sm hover:opacity-80 transition-opacity ${CALENDAR_COLORS[apt.status]}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="min-w-0">
                                <span className="font-medium block truncate">
                                  {apt.clientName || 'Client'} — {apt.serviceName}
                                </span>
                                <span className="text-xs opacity-75 block">
                                  {formatTime(apt.startUtc)} – {formatTime(apt.endUtc)}
                                  {apt.serviceDuration && ` · ${apt.serviceDuration} min`}
                                </span>
                              </div>
                              {apt.servicePriceCents && (
                                <span className="text-xs font-medium shrink-0 ml-2">
                                  {formatPrice(apt.servicePriceCents)}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================== LIST VIEW ======================== */}
      {view === 'list' && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-900 font-medium mb-1">No appointments</p>
              <p className="text-sm text-slate-500">
                {filter === 'all'
                  ? 'Appointments will appear here when clients book your services.'
                  : `No ${filter} appointments found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((apt) => {
                const statusConfig = STATUS_CONFIG[apt.status];
                const StatusIcon = statusConfig.icon;
                const isPast = new Date(apt.startUtc) < now;

                return (
                  <div
                    key={apt.id}
                    onClick={() => setSelected(selected === apt.id ? null : apt.id)}
                    className={`bg-white rounded-xl border border-slate-200/60 p-4 sm:p-5 cursor-pointer hover:shadow-md transition-all duration-200 ${
                      selected === apt.id ? 'ring-2 ring-blue-500/20 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900 truncate">
                            {apt.serviceName || 'Unknown Service'}
                          </h4>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bg}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(apt.startUtc)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(apt.startUtc)} — {formatTime(apt.endUtc)}
                          </span>
                          {apt.clientName && (
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" />
                              {apt.clientName}
                            </span>
                          )}
                          {apt.servicePriceCents && (
                            <span className="flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5" />
                              {formatPrice(apt.servicePriceCents)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {selected === apt.id && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                        {apt.clientEmail && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">{apt.clientEmail}</span>
                          </div>
                        )}
                        {apt.clientPhone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">{apt.clientPhone}</span>
                          </div>
                        )}
                        {apt.clientNotes && (
                          <div className="text-sm">
                            <p className="text-slate-400 text-xs font-medium mb-0.5">Client notes</p>
                            <p className="text-slate-600">{apt.clientNotes}</p>
                          </div>
                        )}

                        {/* Pending reschedule banner */}
                        {apt.proposedStartUtc && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-medium text-purple-800 flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" />
                                Reschedule proposed
                              </p>
                              <p className="text-xs text-purple-700 mt-0.5">
                                New time: {formatDate(apt.proposedStartUtc)} at {formatTime(apt.proposedStartUtc)}
                              </p>
                              {apt.rescheduleNote && (
                                <p className="text-xs text-purple-600 mt-0.5 italic">&quot;{apt.rescheduleNote}&quot;</p>
                              )}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCancelReschedule(apt.id); }}
                              className="text-xs text-purple-600 hover:text-purple-800 font-medium shrink-0"
                            >
                              Withdraw
                            </button>
                          </div>
                        )}

                        {!isPast && apt.status !== 'cancelled' && apt.status !== 'completed' && (
                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            {apt.status === 'pending' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(apt.id, 'confirmed'); }}
                                className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition-colors"
                              >
                                Confirm
                              </button>
                            )}
                            {(apt.status === 'pending' || apt.status === 'confirmed') && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(apt.id, 'completed'); }}
                                className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-md hover:bg-emerald-600 transition-colors"
                              >
                                Complete
                              </button>
                            )}
                            {!apt.proposedStartUtc && (
                              <button
                                onClick={(e) => { e.stopPropagation(); openRescheduleModal(apt); }}
                                className="px-3 py-1.5 bg-purple-500 text-white text-xs font-medium rounded-md hover:bg-purple-600 transition-colors flex items-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Propose New Time
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(apt.id, 'no_show'); }}
                              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-md hover:bg-slate-50 transition-colors"
                            >
                              No Show
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusUpdate(apt.id, 'cancelled'); }}
                              className="px-3 py-1.5 bg-white border border-slate-200 text-red-600 text-xs font-medium rounded-md hover:bg-red-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ======================== DETAIL MODAL (from calendar click) ======================== */}
      {detailApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setDetailApt(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {detailApt.serviceName || 'Appointment'}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${STATUS_CONFIG[detailApt.status].bg}`}>
                  {STATUS_CONFIG[detailApt.status].label}
                </span>
              </div>
              <button
                onClick={() => setDetailApt(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700">{formatDate(detailApt.startUtc)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700">
                  {formatTime(detailApt.startUtc)} – {formatTime(detailApt.endUtc)}
                  {detailApt.serviceDuration && ` · ${detailApt.serviceDuration} min`}
                </span>
              </div>
              {detailApt.clientName && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{detailApt.clientName}</span>
                </div>
              )}
              {detailApt.clientEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a href={`mailto:${detailApt.clientEmail}`} className="text-blue-600 hover:text-blue-700">
                    {detailApt.clientEmail}
                  </a>
                </div>
              )}
              {detailApt.clientPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${detailApt.clientPhone}`} className="text-blue-600 hover:text-blue-700">
                    {detailApt.clientPhone}
                  </a>
                </div>
              )}
              {detailApt.servicePriceCents && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 font-medium">
                    {formatPrice(detailApt.servicePriceCents)}
                  </span>
                  {detailApt.paymentStatus !== 'unpaid' && (
                    <span className="text-xs text-emerald-600 font-medium">
                      ({detailApt.paymentStatus})
                    </span>
                  )}
                </div>
              )}
              {detailApt.clientNotes && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-slate-500 mb-0.5">Client notes</p>
                  <p className="text-slate-700">{detailApt.clientNotes}</p>
                </div>
              )}
            </div>

            {/* Pending reschedule banner */}
            {detailApt.proposedStartUtc && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm font-medium text-purple-800 flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reschedule proposed
                </p>
                <p className="text-sm text-purple-700 mt-0.5">
                  New time: {formatDate(detailApt.proposedStartUtc)} at {formatTime(detailApt.proposedStartUtc)}
                </p>
                {detailApt.rescheduleNote && (
                  <p className="text-xs text-purple-600 mt-1 italic">&quot;{detailApt.rescheduleNote}&quot;</p>
                )}
                <p className="text-xs text-purple-500 mt-1.5">Waiting for client to accept or decline.</p>
                <button
                  onClick={() => { handleCancelReschedule(detailApt.id); setDetailApt(null); }}
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium mt-2"
                >
                  Withdraw proposal
                </button>
              </div>
            )}

            {/* Status actions */}
            {detailApt.status !== 'cancelled' && detailApt.status !== 'completed' && detailApt.status !== 'no_show' && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                {detailApt.status === 'pending' && (
                  <button
                    onClick={() => { handleStatusUpdate(detailApt.id, 'confirmed'); setDetailApt(null); }}
                    className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Confirm
                  </button>
                )}
                {(detailApt.status === 'pending' || detailApt.status === 'confirmed') && (
                  <button
                    onClick={() => { handleStatusUpdate(detailApt.id, 'completed'); setDetailApt(null); }}
                    className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Complete
                  </button>
                )}
                {!detailApt.proposedStartUtc && (
                  <button
                    onClick={() => openRescheduleModal(detailApt)}
                    className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Propose New Time
                  </button>
                )}
                <button
                  onClick={() => { handleStatusUpdate(detailApt.id, 'no_show'); setDetailApt(null); }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  No Show
                </button>
                <button
                  onClick={() => { handleStatusUpdate(detailApt.id, 'cancelled'); setDetailApt(null); }}
                  className="px-4 py-2 bg-white border border-slate-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================== RESCHEDULE MODAL ======================== */}
      {rescheduleApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setRescheduleApt(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Propose New Time</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {rescheduleApt.clientName || 'Client'} · {rescheduleApt.serviceName || 'Appointment'}
                </p>
              </div>
              <button
                onClick={() => setRescheduleApt(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current time */}
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-medium text-slate-500 mb-0.5">Current time</p>
              <p className="text-sm text-slate-700">
                {formatDate(rescheduleApt.startUtc)} at {formatTime(rescheduleApt.startUtc)} – {formatTime(rescheduleApt.endUtc)}
              </p>
            </div>

            {/* New date & time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Time</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Duration note */}
            <p className="text-xs text-slate-400">
              Duration will stay the same ({rescheduleApt.serviceDuration || 30} min). The client will be notified and can accept or decline.
            </p>

            {/* Optional note */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Note to client <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={rescheduleNote}
                onChange={(e) => setRescheduleNote(e.target.value)}
                placeholder="e.g. Running behind on that day, this time works better for me"
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleProposeReschedule}
                disabled={rescheduling || !rescheduleDate || !rescheduleTime}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${rescheduling ? 'animate-spin' : ''}`} />
                {rescheduling ? 'Sending...' : 'Send Proposal'}
              </button>
              <button
                onClick={() => setRescheduleApt(null)}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}