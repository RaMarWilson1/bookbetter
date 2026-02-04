import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import {
  users,
  tenants,
  categories,
  services,
  bookings,
  reviews,
  staffAccounts,
  paymentIntents,
  availabilityTemplates,
  availabilityExceptions,
  notifications,
} from '../db/schema';

// Select types (what comes from DB)
export type User = InferSelectModel<typeof users>;
export type Tenant = InferSelectModel<typeof tenants>;
export type Category = InferSelectModel<typeof categories>;
export type Service = InferSelectModel<typeof services>;
export type Booking = InferSelectModel<typeof bookings>;
export type Review = InferSelectModel<typeof reviews>;
export type StaffAccount = InferSelectModel<typeof staffAccounts>;
export type PaymentIntent = InferSelectModel<typeof paymentIntents>;
export type AvailabilityTemplate = InferSelectModel<typeof availabilityTemplates>;
export type AvailabilityException = InferSelectModel<typeof availabilityExceptions>;
export type Notification = InferSelectModel<typeof notifications>;

// Insert types (for creating new records)
export type NewUser = InferInsertModel<typeof users>;
export type NewTenant = InferInsertModel<typeof tenants>;
export type NewCategory = InferInsertModel<typeof categories>;
export type NewService = InferInsertModel<typeof services>;
export type NewBooking = InferInsertModel<typeof bookings>;
export type NewReview = InferInsertModel<typeof reviews>;
export type NewStaffAccount = InferInsertModel<typeof staffAccounts>;
export type NewPaymentIntent = InferInsertModel<typeof paymentIntents>;
export type NewAvailabilityTemplate = InferInsertModel<typeof availabilityTemplates>;
export type NewAvailabilityException = InferInsertModel<typeof availabilityExceptions>;
export type NewNotification = InferInsertModel<typeof notifications>;

// Enum types
export type UserRole = 'client' | 'pro' | 'staff';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type PaymentStatus = 'unpaid' | 'deposit' | 'paid' | 'refunded';
export type PaymentType = 'deposit' | 'full';
export type StaffRole = 'owner' | 'manager' | 'staff';
export type Plan = 'starter' | 'growth' | 'business';
export type NotificationType = 'email' | 'sms';
export type NotificationPurpose = 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'cancellation';
export type NotificationStatus = 'sent' | 'failed' | 'delivered' | 'bounced';

// Extended types with relations
export type BookingWithDetails = Booking & {
  client: User;
  service: Service;
  tenant: Tenant;
  staff?: User;
  review?: Review;
  paymentIntents: PaymentIntent[];
};

export type ServiceWithTenant = Service & {
  tenant: Tenant;
};

export type TenantWithServices = Tenant & {
  services: Service[];
  category?: Category;
};

export type ReviewWithDetails = Review & {
  client: User;
  booking: Booking;
  tenant: Tenant;
};

// API response types
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
};

// Form types
export type CreateBookingForm = {
  serviceId: string;
  startUtc: Date;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientNotes?: string;
};

export type CreateServiceForm = {
  name: string;
  description?: string;
  priceCents: number;
  durationMinutes: number;
  depositCents?: number;
  fullPayRequired: boolean;
  bufferMinutes?: number;
};

export type UpdateTenantForm = {
  name?: string;
  description?: string;
  categoryId?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  timeZone?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

// Search and filter types
export type ProSearchFilters = {
  category?: string;
  query?: string;
  latitude?: number;
  longitude?: number;
  maxDistance?: number; // in miles
  sortBy?: 'distance' | 'rating' | 'price' | 'name' | 'soonest';
  page?: number;
  pageSize?: number;
};

export type AvailabilitySlot = {
  startUtc: Date;
  endUtc: Date;
  available: boolean;
};

export type AvailabilityRequest = {
  tenantId: string;
  serviceId: string;
  staffId?: string;
  fromDate: Date;
  toDate: Date;
};

// Stripe types
export type StripeCheckoutSession = {
  sessionId: string;
  url: string;
};

export type StripePaymentMetadata = {
  bookingId: string;
  tenantId: string;
  serviceId: string;
  clientId: string;
  paymentType: PaymentType;
};

// Analytics types
export type BookingAnalytics = {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  noShows: number;
  totalRevenueCents: number;
  averageBookingValueCents: number;
  repeatClientRate: number;
  noShowRate: number;
};

export type DateRange = {
  from: Date;
  to: Date;
};