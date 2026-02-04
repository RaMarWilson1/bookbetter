import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  pgEnum,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['client', 'pro', 'staff']);
export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'unpaid',
  'deposit',
  'paid',
  'refunded',
]);
export const paymentTypeEnum = pgEnum('payment_type', ['deposit', 'full']);
export const staffRoleEnum = pgEnum('staff_role', ['owner', 'manager', 'staff']);
export const planEnum = pgEnum('plan', ['starter', 'growth', 'business']);

// Users table
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    role: userRoleEnum('role').notNull().default('client'),
    name: varchar('name', { length: 255 }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: timestamp('email_verified', { mode: 'date' }),
    image: text('image'),
    password: text('password'), // bcrypt hash, optional (for magic link users)
    timeZone: varchar('time_zone', { length: 100 }).default('America/New_York'),
    locale: varchar('locale', { length: 10 }).default('en'),
    // Location data for clients
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),
    postalCode: varchar('postal_code', { length: 20 }),
    // Metadata
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    roleIdx: index('users_role_idx').on(table.role),
  })
);

// NextAuth required tables
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  idToken: text('id_token'),
  sessionState: varchar('session_state', { length: 255 }),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (table) => ({
    compoundKey: unique().on(table.identifier, table.token),
  })
);

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  sortOrder: integer('sort_order').default(0),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Tenants/Businesses table
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  categoryId: uuid('category_id').references(() => categories.id),
  
  // Contact & Location
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 100 }).default('US'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  
  // Business Settings
  timeZone: varchar('time_zone', { length: 100 }).default('America/New_York'),
  currencyCode: varchar('currency_code', { length: 3 }).default('USD'),
  locale: varchar('locale', { length: 10 }).default('en'),
  
  // Subscription
  plan: planEnum('plan').default('starter').notNull(),
  planStartedAt: timestamp('plan_started_at', { mode: 'date' }),
  planEndsAt: timestamp('plan_ends_at', { mode: 'date' }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  
  // White-label settings (Business tier)
  customDomain: varchar('custom_domain', { length: 255 }),
  logo: text('logo'),
  primaryColor: varchar('primary_color', { length: 7 }).default('#3B82F6'),
  secondaryColor: varchar('secondary_color', { length: 7 }).default('#10B981'),
  
  // Communication branding
  smsFromName: varchar('sms_from_name', { length: 50 }),
  emailFromName: varchar('email_from_name', { length: 100 }),
  emailFromAddress: varchar('email_from_address', { length: 255 }),
  
  // Features & limits
  smsQuota: integer('sms_quota').default(0),
  smsUsed: integer('sms_used').default(0),
  bookingsQuota: integer('bookings_quota').default(15), // Starter: 15
  
  // Stripe Connect (for pros who want to collect payments)
  stripeAccountId: varchar('stripe_account_id', { length: 255 }),
  stripeOnboardingComplete: boolean('stripe_onboarding_complete').default(false),
  
  // Status
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('tenants_slug_idx').on(table.slug),
  categoryIdx: index('tenants_category_idx').on(table.categoryId),
}));

// Staff Accounts (for Business tier multi-staff)
export const staffAccounts = pgTable('staff_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: staffRoleEnum('role').notNull().default('staff'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  tenantUserUnique: unique().on(table.tenantId, table.userId),
  tenantIdx: index('staff_tenant_idx').on(table.tenantId),
  userIdx: index('staff_user_idx').on(table.userId),
}));

// Services table
export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  priceCents: integer('price_cents').notNull(), // Store in cents
  durationMinutes: integer('duration_minutes').notNull(),
  
  // Payment settings (per service)
  depositCents: integer('deposit_cents'), // null = no deposit required
  fullPayRequired: boolean('full_pay_required').default(false).notNull(),
  
  // Availability
  bufferMinutes: integer('buffer_minutes').default(0), // Time between bookings
  advanceBookingDays: integer('advance_booking_days').default(30),
  
  // Status
  active: boolean('active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('services_tenant_idx').on(table.tenantId),
  activeIdx: index('services_active_idx').on(table.active),
}));

// Availability templates (working hours)
export const availabilityTemplates = pgTable('availability_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  staffId: uuid('staff_id').references(() => users.id), // null = applies to all staff
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Sunday, 6 = Saturday
  startTime: varchar('start_time', { length: 5 }).notNull(), // HH:MM format
  endTime: varchar('end_time', { length: 5 }).notNull(), // HH:MM format
  active: boolean('active').default(true).notNull(),
}, (table) => ({
  tenantDayIdx: index('availability_tenant_day_idx').on(table.tenantId, table.dayOfWeek),
}));

// Availability exceptions (blocks, time off)
export const availabilityExceptions = pgTable('availability_exceptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  staffId: uuid('staff_id').references(() => users.id),
  startUtc: timestamp('start_utc', { mode: 'date' }).notNull(),
  endUtc: timestamp('end_utc', { mode: 'date' }).notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  tenantTimeIdx: index('exceptions_tenant_time_idx').on(table.tenantId, table.startUtc),
}));

// Bookings table
export const bookings = pgTable('bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // References
  clientId: uuid('client_id')
    .notNull()
    .references(() => users.id),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id')
    .notNull()
    .references(() => services.id),
  staffId: uuid('staff_id').references(() => users.id), // Who's performing the service
  
  // Timing (all in UTC)
  startUtc: timestamp('start_utc', { mode: 'date' }).notNull(),
  endUtc: timestamp('end_utc', { mode: 'date' }).notNull(),
  
  // Status
  status: bookingStatusEnum('status').notNull().default('pending'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('unpaid'),
  
  // Client info (snapshot at booking time)
  clientName: varchar('client_name', { length: 255 }),
  clientEmail: varchar('client_email', { length: 255 }),
  clientPhone: varchar('client_phone', { length: 50 }),
  clientNotes: text('client_notes'),
  
  // Internal notes
  internalNotes: text('internal_notes'),
  
  // Cancellation
  cancelledAt: timestamp('cancelled_at', { mode: 'date' }),
  cancellationReason: text('cancellation_reason'),
  
  // Reminders sent
  reminderSent24h: boolean('reminder_sent_24h').default(false),
  reminderSent2h: boolean('reminder_sent_2h').default(false),
  
  // Metadata
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  clientIdx: index('bookings_client_idx').on(table.clientId),
  tenantIdx: index('bookings_tenant_idx').on(table.tenantId),
  serviceIdx: index('bookings_service_idx').on(table.serviceId),
  staffIdx: index('bookings_staff_idx').on(table.staffId),
  timeIdx: index('bookings_time_idx').on(table.startUtc),
  statusIdx: index('bookings_status_idx').on(table.status),
}));

// Payment Intents (Stripe)
export const paymentIntents = pgTable('payment_intents', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'cascade' }),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }).notNull().unique(),
  amountCents: integer('amount_cents').notNull(),
  type: paymentTypeEnum('type').notNull(),
  status: varchar('status', { length: 50 }).notNull(), // Stripe status
  
  // Metadata
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  receiptUrl: text('receipt_url'),
  
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  bookingIdx: index('payment_intents_booking_idx').on(table.bookingId),
  stripeIdx: index('payment_intents_stripe_idx').on(table.stripePaymentIntentId),
}));

// Reviews table
export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'cascade' })
    .unique(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id')
    .notNull()
    .references(() => users.id),
  
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  
  // Response
  response: text('response'),
  respondedAt: timestamp('responded_at', { mode: 'date' }),
  
  // Moderation
  flagged: boolean('flagged').default(false),
  approved: boolean('approved').default(true),
  
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('reviews_tenant_idx').on(table.tenantId),
  ratingIdx: index('reviews_rating_idx').on(table.rating),
}));

// Notifications log
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'cascade' }),
  
  type: varchar('type', { length: 50 }).notNull(), // 'email' | 'sms'
  purpose: varchar('purpose', { length: 50 }).notNull(), // 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'cancellation'
  
  // Contact info used
  recipient: varchar('recipient', { length: 255 }).notNull(),
  
  // Status
  status: varchar('status', { length: 50 }).notNull(), // 'sent' | 'failed' | 'delivered' | 'bounced'
  externalId: varchar('external_id', { length: 255 }),
  errorMessage: text('error_message'),
  
  sentAt: timestamp('sent_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('notifications_user_idx').on(table.userId),
  bookingIdx: index('notifications_booking_idx').on(table.bookingId),
  typeIdx: index('notifications_type_idx').on(table.type),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  bookingsAsClient: many(bookings, { relationName: 'clientBookings' }),
  bookingsAsStaff: many(bookings, { relationName: 'staffBookings' }),
  staffAccounts: many(staffAccounts),
  reviews: many(reviews),
  notifications: many(notifications),
}));

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  category: one(categories, {
    fields: [tenants.categoryId],
    references: [categories.id],
  }),
  services: many(services),
  staffAccounts: many(staffAccounts),
  bookings: many(bookings),
  reviews: many(reviews),
  availabilityTemplates: many(availabilityTemplates),
  availabilityExceptions: many(availabilityExceptions),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [services.tenantId],
    references: [tenants.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  client: one(users, {
    fields: [bookings.clientId],
    references: [users.id],
    relationName: 'clientBookings',
  }),
  tenant: one(tenants, {
    fields: [bookings.tenantId],
    references: [tenants.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
  staff: one(users, {
    fields: [bookings.staffId],
    references: [users.id],
    relationName: 'staffBookings',
  }),
  paymentIntents: many(paymentIntents),
  review: one(reviews),
  notifications: many(notifications),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
  tenant: one(tenants, {
    fields: [reviews.tenantId],
    references: [tenants.id],
  }),
  client: one(users, {
    fields: [reviews.clientId],
    references: [users.id],
  }),
}));