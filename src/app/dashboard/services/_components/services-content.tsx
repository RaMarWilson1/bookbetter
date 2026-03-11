// src/app/dashboard/services/_components/services-content.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Scissors,
  Clock,
  DollarSign,
  MoreVertical,
  Pencil,
  Trash2,
  GripVertical,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
  depositCents: number | null;
  fullPayRequired: boolean;
  bufferMinutes: number | null;
  advanceBookingDays: number | null;
  active: boolean;
  sortOrder: number | null;
}

interface ServicesContentProps {
  services: Service[];
  tenantId: string | undefined;
}

interface ServiceFormData {
  name: string;
  description: string;
  priceCents: number;
  durationMinutes: number;
  depositCents: number;
  fullPayRequired: boolean;
  bufferMinutes: number;
  active: boolean;
}

const emptyForm: ServiceFormData = {
  name: '',
  description: '',
  priceCents: 0,
  durationMinutes: 30,
  depositCents: 0,
  fullPayRequired: false,
  bufferMinutes: 0,
  active: true,
};

export function ServicesContent({ services, tenantId }: ServicesContentProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (service: Service) => {
    setForm({
      name: service.name,
      description: service.description || '',
      priceCents: service.priceCents,
      durationMinutes: service.durationMinutes,
      depositCents: service.depositCents || 0,
      fullPayRequired: service.fullPayRequired,
      bufferMinutes: service.bufferMinutes || 0,
      active: service.active,
    });
    setEditingId(service.id);
    setError('');
    setMenuOpen(null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Service name is required');
      return;
    }
    if (form.priceCents <= 0) {
      setError('Price must be greater than $0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = editingId
        ? `/api/dashboard/services/${editingId}`
        : '/api/dashboard/services';

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tenantId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      setShowModal(false);
      router.refresh();
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    setMenuOpen(null);

    try {
      const res = await fetch(`/api/dashboard/services/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) router.refresh();
    } catch {
      // silently fail
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setMenuOpen(null);
    try {
      await fetch(`/api/dashboard/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      router.refresh();
    } catch {
      // silently fail
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}min` : `${h}h`;
  };

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Services</h2>
          <p className="text-slate-500 mt-1">Manage your service offerings and pricing.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-slate-900 font-medium mb-1">Set up your business first</p>
          <p className="text-sm text-slate-500">
            You need to create your business profile before adding services.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Services</h2>
          <p className="text-slate-500 mt-1">
            {services.length} service{services.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-900 font-medium mb-1">No services yet</p>
          <p className="text-sm text-slate-500 mb-4">
            Add your first service so clients can start booking.
          </p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add your first service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-xl border p-5 transition-all duration-200 hover:shadow-md ${
                service.active
                  ? 'border-slate-200/60'
                  : 'border-slate-200/40 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                  <h3 className="font-semibold text-slate-900">{service.name}</h3>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === service.id ? null : service.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen === service.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                      <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                        <button
                          onClick={() => openEdit(service)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(service.id, service.active)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {service.active ? (
                            <><ToggleLeft className="w-3.5 h-3.5" /> Deactivate</>
                          ) : (
                            <><ToggleRight className="w-3.5 h-3.5" /> Activate</>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {service.description && (
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                  {service.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  {formatPrice(service.priceCents)}
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formatDuration(service.durationMinutes)}
                </span>
              </div>

              {!service.active && (
                <span className="inline-block mt-3 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  Inactive
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? 'Edit Service' : 'Add New Service'}
              </h3>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Classic Haircut"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the service"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={(form.priceCents / 100).toFixed(2)}
                      onChange={(e) => setForm({ ...form, priceCents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                      className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Duration *
                  </label>
                  <select
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {[15, 30, 45, 60, 75, 90, 120, 150, 180].map((m) => (
                      <option key={m} value={m}>
                        {m < 60 ? `${m} min` : `${m / 60}h${m % 60 ? ` ${m % 60}min` : ''}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Deposit Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={(form.depositCents / 100).toFixed(2)}
                      onChange={(e) => setForm({ ...form, depositCents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                      className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Leave at $0 for no deposit</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Buffer Time
                  </label>
                  <select
                    value={form.bufferMinutes}
                    onChange={(e) => setForm({ ...form, bufferMinutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {[0, 5, 10, 15, 30, 45, 60].map((m) => (
                      <option key={m} value={m}>
                        {m === 0 ? 'No buffer' : `${m} min`}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">Break between bookings</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700">Active</p>
                  <p className="text-xs text-slate-500">Visible to clients for booking</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.active ? 'bg-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      form.active ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingId ? 'Save Changes' : 'Add Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}