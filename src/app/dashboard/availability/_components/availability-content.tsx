// src/app/dashboard/availability/_components/availability-content.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

interface Template {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

interface Exception {
  id: string;
  startUtc: Date;
  endUtc: Date;
  reason: string | null;
}

interface AvailabilityContentProps {
  tenantId: string | null;
  templates: Template[];
  exceptions: Exception[];
}

export function AvailabilityContent({ tenantId, templates, exceptions }: AvailabilityContentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showTimeOff, setShowTimeOff] = useState(false);
  const [timeOffForm, setTimeOffForm] = useState({ startDate: '', endDate: '', reason: '' });

  const templatesByDay = DAYS.map((_, i) =>
    templates.filter((t) => t.dayOfWeek === i).sort((a, b) => a.startTime.localeCompare(b.startTime))
  );

  const handleAddSlot = async (dayOfWeek: number) => {
    if (!tenantId) return;
    setLoading(true);
    try {
      await fetch('/api/dashboard/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          dayOfWeek,
          startTime: '09:00',
          endTime: '17:00',
        }),
      });
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSlot = async (id: string, field: 'startTime' | 'endTime', value: string) => {
    try {
      await fetch(`/api/dashboard/availability/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      router.refresh();
    } catch {
      // silently fail
    }
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      await fetch(`/api/dashboard/availability/${id}`, { method: 'DELETE' });
      router.refresh();
    } catch {
      // silently fail
    }
  };

  const handleAddTimeOff = async () => {
    if (!tenantId || !timeOffForm.startDate || !timeOffForm.endDate) return;
    setLoading(true);
    try {
      await fetch('/api/dashboard/availability/exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          startUtc: new Date(timeOffForm.startDate).toISOString(),
          endUtc: new Date(timeOffForm.endDate).toISOString(),
          reason: timeOffForm.reason || null,
        }),
      });
      setShowTimeOff(false);
      setTimeOffForm({ startDate: '', endDate: '', reason: '' });
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteException = async (id: string) => {
    try {
      await fetch(`/api/dashboard/availability/exceptions/${id}`, { method: 'DELETE' });
      router.refresh();
    } catch {
      // silently fail
    }
  };

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Availability</h2>
          <p className="text-slate-500 mt-1">Set your working hours.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-slate-900 font-medium mb-1">Set up your business first</p>
          <p className="text-sm text-slate-500">
            You need to create your business profile before setting availability.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Availability</h2>
          <p className="text-slate-500 mt-1">Set your regular working hours and time off.</p>
        </div>
        <button
          onClick={() => setShowTimeOff(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Add Time Off
        </button>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white rounded-xl border border-slate-200/60">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Weekly Schedule</h3>
          <p className="text-sm text-slate-500 mt-0.5">Set your regular working hours for each day.</p>
        </div>

        <div className="divide-y divide-slate-100">
          {DAYS.map((day, dayIndex) => {
            const slots = templatesByDay[dayIndex];
            return (
              <div key={day} className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-sm font-medium text-slate-900 w-24">
                      {day}
                    </span>
                    <span className="sm:hidden text-sm font-medium text-slate-900 w-10">
                      {DAYS_SHORT[dayIndex]}
                    </span>
                    {slots.length === 0 && (
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        Closed
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddSlot(dayIndex)}
                    disabled={loading}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add hours
                  </button>
                </div>

                {slots.length > 0 && (
                  <div className="space-y-2">
                    {slots.map((slot) => (
                      <div key={slot.id} className="flex items-center gap-2">
                        <select
                          value={slot.startTime}
                          onChange={(e) => handleUpdateSlot(slot.id, 'startTime', e.target.value)}
                          className="px-2 py-1.5 rounded-md border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>{formatTime(t)}</option>
                          ))}
                        </select>
                        <span className="text-slate-400 text-sm">to</span>
                        <select
                          value={slot.endTime}
                          onChange={(e) => handleUpdateSlot(slot.id, 'endTime', e.target.value)}
                          className="px-2 py-1.5 rounded-md border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>{formatTime(t)}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Time Off / Exceptions */}
      {exceptions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/60">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Upcoming Time Off</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {exceptions.map((exc) => (
              <div key={exc.id} className="p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(exc.startUtc).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' — '}
                    {new Date(exc.endUtc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {exc.reason && (
                    <p className="text-sm text-slate-500 mt-0.5">{exc.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteException(exc.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Off Modal */}
      {showTimeOff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTimeOff(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Add Time Off</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={timeOffForm.startDate}
                    onChange={(e) => setTimeOffForm({ ...timeOffForm, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={timeOffForm.endDate}
                    onChange={(e) => setTimeOffForm({ ...timeOffForm, endDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason (optional)</label>
                <input
                  type="text"
                  value={timeOffForm.reason}
                  onChange={(e) => setTimeOffForm({ ...timeOffForm, reason: e.target.value })}
                  placeholder="e.g. Vacation, Personal day"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={() => setShowTimeOff(false)} className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleAddTimeOff} disabled={loading} className="px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50">
                {loading ? 'Adding...' : 'Add Time Off'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}