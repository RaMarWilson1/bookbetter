// src/app/dashboard/clients/_components/clients-content.tsx
'use client';

import { useState } from 'react';
import { Users, Search, Mail, Phone, Calendar, Hash } from 'lucide-react';

interface Client {
  clientId: string;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  totalBookings: number;
  lastBooking: Date;
  totalSpentCents: number;
}

export function ClientsContent({ clients }: { clients: Client[] }) {
  const [search, setSearch] = useState('');

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.clientName?.toLowerCase().includes(q) ||
      c.clientEmail?.toLowerCase().includes(q) ||
      c.clientPhone?.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Clients</h2>
        <p className="text-slate-500 mt-1">
          {clients.length} client{clients.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {clients.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-900 font-medium mb-1">
            {clients.length === 0 ? 'No clients yet' : 'No clients found'}
          </p>
          <p className="text-sm text-slate-500">
            {clients.length === 0
              ? 'Clients will appear here after they book with you.'
              : 'Try adjusting your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client) => {
            const initials = client.clientName
              ? client.clientName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
              : '?';

            return (
              <div
                key={client.clientId}
                className="bg-white rounded-xl border border-slate-200/60 p-5 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {client.clientName || 'Unknown'}
                    </p>
                    {client.clientEmail && (
                      <p className="text-xs text-slate-500 truncate">{client.clientEmail}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {client.clientPhone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {client.clientPhone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    {client.totalBookings} booking{client.totalBookings !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Last: {new Date(client.lastBooking).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}