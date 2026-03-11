// src/app/dashboard/appointments/_components/appointments-content.tsx
'use client';

import { useState } from 'react';
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
  Filter,
} from 'lucide-react';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

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
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle },
  confirmed: { label: 'Confirmed', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  no_show: { label: 'No Show', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle },
};

const FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export function AppointmentsContent({ appointments }: { appointments: Appointment[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);

  const now = new Date();

  const filtered = appointments.filter((apt) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return new Date(apt.startUtc) > now && apt.status !== 'cancelled';
    return apt.status === filter;
  });

  const selectedApt = appointments.find((a) => a.id === selected);

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

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Appointments</h2>
        <p className="text-slate-500 mt-1">Manage your upcoming and past bookings.</p>
      </div>

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
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
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

                {/* Expanded details */}
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

                    {/* Actions */}
                    {!isPast && apt.status !== 'cancelled' && apt.status !== 'completed' && (
                      <div className="flex items-center gap-2 pt-2">
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
    </div>
  );
}