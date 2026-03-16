// src/lib/help-articles.ts

export interface HelpArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  content: string; // Markdown-ish plain text
}

export interface HelpCategory {
  slug: string;
  name: string;
  description: string;
  icon: string;
}

export const HELP_CATEGORIES: HelpCategory[] = [
  { slug: 'getting-started', name: 'Getting Started', description: 'Set up your account and booking page', icon: '🚀' },
  { slug: 'booking-page', name: 'Your Booking Page', description: 'Customize and share your booking link', icon: '📱' },
  { slug: 'services', name: 'Services & Pricing', description: 'Add, edit, and manage your service menu', icon: '✂️' },
  { slug: 'scheduling', name: 'Scheduling & Availability', description: 'Set your hours, block time off, manage appointments', icon: '📅' },
  { slug: 'payments', name: 'Payments & Deposits', description: 'Get paid, collect deposits, and manage refunds', icon: '💳' },
  { slug: 'billing', name: 'Plans & Billing', description: 'Upgrade, downgrade, and manage your subscription', icon: '📊' },
  { slug: 'team', name: 'Team & Staff', description: 'Invite staff, assign roles, manage your team', icon: '👥' },
  { slug: 'clients', name: 'Clients & Reviews', description: 'Manage your client list and reviews', icon: '⭐' },
  { slug: 'branding', name: 'Branding & White-Label', description: 'Customize colors, logo, and remove BookBetter branding', icon: '🎨' },
  { slug: 'account', name: 'Account & Security', description: 'Update your profile, password, and security settings', icon: '🔒' },
];

export const HELP_ARTICLES: HelpArticle[] = [
  // Getting Started
  {
    slug: 'create-your-account',
    title: 'How to create your BookBetter account',
    description: 'Sign up with Google or email in under a minute.',
    category: 'getting-started',
    content: `You can create a BookBetter account two ways:

**Sign up with Google** — Click "Get Started" and choose "Continue with Google." This is the fastest option and automatically pulls in your name and profile photo.

**Sign up with email** — Click "Get Started," enter your name, email, and a password. You'll be taken straight to onboarding.

After signing up, you'll go through a quick 4-step onboarding where you set your business name, choose a category, add your location, and optionally create your first service.

That's it — your booking page is live and you can start sharing your link.`,
  },
  {
    slug: 'set-up-booking-page',
    title: 'Setting up your booking page',
    description: 'The 5-minute setup to start getting booked.',
    category: 'getting-started',
    content: `After creating your account, here's how to get your booking page ready:

**Step 1: Add your services** — Go to Dashboard → Services → Add Service. Enter a name, description, price, and duration for each service you offer.

**Step 2: Set your availability** — Go to Dashboard → Availability. Set your working hours for each day of the week. You can also add exceptions for days off or special hours.

**Step 3: Customize your branding** — Go to Settings → Branding. Upload your logo, pick your brand color, and preview how your booking page looks.

**Step 4: Share your link** — Your booking link is shown on the dashboard overview and in Settings. Copy it and add it to your Instagram bio, send it to clients, or put it on your website.

Your page is live at thebookbetter.com/book/your-slug — clients can start booking right away.`,
  },
  {
    slug: 'share-booking-link',
    title: 'How to share your booking link',
    description: 'Get your link in front of clients.',
    category: 'getting-started',
    content: `Your booking link is available in two places:

1. **Dashboard overview** — The dark card on the right side shows your booking URL with a "Set up booking page" link.
2. **Settings page** — The booking link card at the top lets you copy the full URL.

Your link format is: thebookbetter.com/book/your-slug

You can change the slug (the part after /book/) in Settings by clicking "Edit link."

**Where to share it:**
- Instagram or TikTok bio
- Text messages to regular clients
- Your website or portfolio
- Business cards (consider a QR code)
- Facebook or Google Business Profile
- Email signature`,
  },

  // Booking Page
  {
    slug: 'customize-booking-page',
    title: 'Customizing your booking page',
    description: 'Brand colors, logo, and more.',
    category: 'booking-page',
    content: `Your booking page is what clients see when they visit your link. You can customize it in Settings → Branding:

**Logo** — Upload your logo (JPG, PNG, WebP, or SVG, max 2MB). Drag and drop or click to browse. If you don't upload one, your initials will show in your brand color.

**Brand color** — Pick from 8 presets or enter a custom hex code. This color is used for the header bar, buttons, and accents on your booking page.

**Accent color** — Used for success states and secondary elements.

**Preview** — The live preview at the bottom shows how your booking page header and "Book Now" button will look.

On the Growth plan, your booking page shows "Powered by BookBetter" at the bottom. On Business, this is removed (full white-label).`,
  },
  {
    slug: 'edit-booking-link',
    title: 'How to change your booking link',
    description: 'Customize the URL slug for your page.',
    category: 'booking-page',
    content: `Your booking link defaults to your business name when you sign up, but you can change it anytime:

1. Go to **Settings**
2. Find the **Your Booking Link** card at the top
3. Click **Edit link**
4. Type your desired slug (letters, numbers, and hyphens only)
5. Click **Save**

Rules:
- Minimum 3 characters
- Only lowercase letters, numbers, and hyphens
- Can't use reserved words like "admin," "api," "auth," etc.
- Must be unique — if someone else has it, you'll see an error

If you change your slug, your old link will stop working immediately. Make sure to update it everywhere you've shared it.`,
  },

  // Services
  {
    slug: 'add-services',
    title: 'Adding and managing services',
    description: 'Create your service menu with prices and durations.',
    category: 'services',
    content: `Services are what clients book. To add one:

1. Go to **Dashboard → Services**
2. Click **Add Service**
3. Fill in the details:
   - **Name** — What clients see (e.g., "Men's Haircut")
   - **Description** — Optional details about what's included
   - **Price** — In dollars. Clients see this on your booking page.
   - **Duration** — In minutes. This determines time slot length.
   - **Active** — Toggle off to temporarily hide a service without deleting it.

You can edit or delete services anytime. Existing bookings for a service won't be affected if you update it.

On the Starter plan, you can have up to 10 services. Growth and Business plans have unlimited services.`,
  },

  // Scheduling
  {
    slug: 'set-availability',
    title: 'Setting your availability',
    description: 'Configure your working hours and days off.',
    category: 'scheduling',
    content: `Your availability determines when clients can book you:

**Regular hours** — Go to Dashboard → Availability. Set your start and end time for each day of the week. Leave a day unchecked to mark it as a day off.

**Exceptions** — Need to block a specific date? Add an availability exception:
- Click "Add Exception"
- Choose the date
- Set as "Day off" (no bookings) or set custom hours for that day
- Great for holidays, vacations, or one-time schedule changes

**How booking slots work** — BookBetter generates available time slots based on your hours and the service duration. If a client books a 30-minute service at 2:00 PM, the 2:00-2:30 slot is blocked. No double-bookings.

**Time zone** — Set your time zone in Settings → Profile. All times shown to clients will be in your local time.`,
  },
  {
    slug: 'manage-appointments',
    title: 'Managing your appointments',
    description: 'Confirm, complete, or cancel bookings.',
    category: 'scheduling',
    content: `All your bookings appear in Dashboard → Appointments:

**Appointment statuses:**
- **Pending** — Client just booked. You can confirm or cancel.
- **Confirmed** — You've accepted the booking.
- **Completed** — The appointment happened. Mark it done after.
- **Cancelled** — Either you or the client cancelled.
- **No Show** — Client didn't show up.

**To change a status:** Click the appointment and use the status dropdown.

**Cancellation:** When you cancel a booking, the client's spot opens back up. If you have a cancellation policy with a late fee, the client will see the fee when they try to cancel within the window. Note: fee collection requires Stripe to be set up.`,
  },

  // Payments
  {
    slug: 'accepting-payments',
    title: 'How payments work',
    description: 'Deposits, full payments, and Stripe setup.',
    category: 'payments',
    content: `BookBetter uses Stripe to process payments. Here's how it works:

**Setting up Stripe** — In Settings, you'll connect your Stripe account. This is where client payments go. BookBetter never holds your money — it goes directly to your Stripe account.

**Payment options** (Growth and Business plans):
- **Deposit at booking** — Collect a percentage or flat amount when the client books. Collect the rest at the appointment.
- **Full payment at booking** — Client pays the full service price upfront.
- **Pay at appointment** — No online payment. Client pays when they arrive.

**Stripe fees** — Stripe charges standard processing fees (2.9% + 30¢ per transaction). BookBetter does not add any additional markup or platform fee.

**Refunds** — If you need to refund a client, you can do this through your Stripe Dashboard at dashboard.stripe.com.`,
  },

  // Billing
  {
    slug: 'plans-overview',
    title: 'Understanding BookBetter plans',
    description: 'What each plan includes and costs.',
    category: 'billing',
    content: `BookBetter has three plans:

**Starter (Free)**
- Up to 15 bookings per month
- Directory listing so clients can find you
- Email reminders
- .ics calendar sends
- Basic analytics

**Growth ($19/month)**
- Everything in Starter
- Unlimited bookings
- Collect deposits or full payments at booking
- Basic CRM to track client history
- 50 SMS reminders per month
- Logo and brand colors on your page
- Priority email support

**Business ($79/month)**
- Everything in Growth
- Up to 5 staff members (+$10/mo per extra staff)
- Individual staff calendars
- Roles & permissions (Owner, Manager, Staff)
- Advanced analytics
- Full white-label (remove "Powered by BookBetter")
- Custom domain support
- Branded emails and SMS
- 200 SMS/month included
- Priority chat support

**Annual billing** saves you 2 months — Growth is $190/year and Business is $790/year.`,
  },
  {
    slug: 'upgrade-plan',
    title: 'How to upgrade or downgrade your plan',
    description: 'Change your subscription anytime.',
    category: 'billing',
    content: `To change your plan:

1. Go to **Settings** → click **Manage Plan** (or go directly to Settings → Billing)
2. Choose Monthly or Annual billing
3. Click **Upgrade** on the plan you want
4. You'll be taken to Stripe Checkout to enter payment info
5. After payment, your new plan is active immediately

**To downgrade or cancel:**
1. Go to Settings → Billing
2. Click **Manage billing** (top right)
3. This opens the Stripe Customer Portal where you can:
   - Switch to a lower plan
   - Cancel your subscription
   - Update your payment method

When you downgrade, the change takes effect at the end of your current billing period. You keep access to your current plan features until then.

Only the business owner can manage billing. Managers and staff cannot change plans.`,
  },
  {
    slug: 'founding-pro',
    title: 'Founding Pro offer',
    description: 'Special pricing for early adopters.',
    category: 'billing',
    content: `The Founding Pro offer is available to the first 100 professionals who sign up for a paid plan:

**What you get:**
- 50% off your subscription for the first 6 months
- Price lock for 2 years (your rate won't increase)

This applies to both Growth and Business plans, monthly or annual. The discount is automatically applied at checkout if spots are still available.

This is our way of saying thanks to the pros who believe in BookBetter early on. Once 100 spots are claimed, the offer closes permanently.`,
  },

  // Team
  {
    slug: 'invite-team-members',
    title: 'How to invite team members',
    description: 'Add staff to your business.',
    category: 'team',
    content: `Team management is available on the Business plan. To invite someone:

1. Go to **Dashboard → Team**
2. Click **Invite**
3. Enter their email address
4. Choose a role: **Staff** or **Manager**
5. Click **Send Invite**

They'll receive an invite link (valid for 7 days). When they click it:
- If they have a BookBetter account, they sign in and accept
- If they don't, they'll create an account first, then accept

Once accepted, they appear in your team list and can access the dashboard based on their role permissions.

**Limits:** Business plan includes 5 staff members. Each additional staff member is $10/month.`,
  },
  {
    slug: 'team-roles',
    title: 'Understanding team roles',
    description: 'What each role can and can\'t do.',
    category: 'team',
    content: `There are three roles in BookBetter:

**Owner**
- Full access to everything
- Change billing and subscription
- Delete the business
- Invite and remove any team member
- Manage services, settings, branding
- View all appointments and clients

**Manager**
- Invite and remove staff members
- Manage services and settings
- View all appointments and clients
- Respond to reviews
- Cannot change billing or delete the business

**Staff**
- View their own appointments only
- Manage their own availability
- Cannot see other staff members' appointments
- Cannot change services, settings, or billing

Only the business owner can promote someone to Manager or demote them to Staff. The owner role cannot be transferred.`,
  },

  // Clients & Reviews
  {
    slug: 'manage-reviews',
    title: 'Managing client reviews',
    description: 'View and respond to reviews.',
    category: 'clients',
    content: `Reviews help new clients trust you. Here's how they work:

**Collecting reviews** — After a completed appointment, clients can leave a review on your booking page. They rate 1-5 stars and write an optional comment.

**Viewing reviews** — Go to Dashboard → Reviews to see all reviews. You can see the client name, rating, comment, and date.

**Responding** — Click on a review to write a public response. This shows on your booking page underneath the review. Be professional — potential clients will see it.

**Your rating** — Your overall rating is the average of all reviews and appears on your booking page and in search results.

Reviews cannot be deleted by the business owner. If you believe a review is fraudulent or abusive, contact support.`,
  },

  // Branding
  {
    slug: 'white-label',
    title: 'White-label branding (Business plan)',
    description: 'Remove BookBetter branding from your page.',
    category: 'branding',
    content: `White-label features are available on the Business plan:

**What's included:**
- Remove "Powered by BookBetter" from your booking page footer
- Custom domain support (e.g., book.yourbusiness.com)
- Branded email notifications (your business name as the sender)
- Branded SMS notifications

**Logo & colors** are available on Growth and Business plans. Go to Settings → Branding to upload your logo and set your brand color.

**Custom domain setup:**
1. Go to Settings → Branding
2. Enter your desired domain (e.g., book.yourbusiness.com)
3. Add a CNAME record pointing to thebookbetter.com in your DNS provider
4. We'll verify the domain and issue an SSL certificate automatically

Note: Custom domain setup may take up to 24 hours for DNS to propagate.`,
  },

  // Account
  {
    slug: 'update-profile',
    title: 'Updating your profile and photo',
    description: 'Change your name, photo, and time zone.',
    category: 'account',
    content: `Your profile settings are in Dashboard → Settings:

**Profile photo** — Click your current photo (or the letter avatar) and upload a new image. Supported formats: JPG, PNG, WebP. Max 2MB. This photo appears in the dashboard sidebar and may show on your booking page.

**Name** — Update your display name in the Profile section.

**Time zone** — Set your time zone so appointment times are displayed correctly for you. Clients see times in your time zone.

**Email** — Your email address cannot be changed as it's linked to your authentication. If you need to change it, contact support.

If you signed in with Google, your profile photo is automatically pulled from your Google account. You can replace it with a custom upload anytime.`,
  },
  {
    slug: 'cancellation-policy',
    title: 'Setting up a cancellation policy',
    description: 'Protect against late cancellations and no-shows.',
    category: 'account',
    content: `You can set a cancellation policy in Settings → Cancellation Policy:

**Free cancellation window** — Choose how far in advance clients must cancel for free: 0, 2, 6, 12, 24, or 48 hours before the appointment.

**Late cancellation fee** — Set a flat dollar amount charged when clients cancel inside the window.

**Custom policy text** — Write a short message explaining your policy. This is shown to clients before they confirm a booking and on the cancellation page.

**How it works for clients:**
- Every booking confirmation includes a cancellation link
- When they click it, they verify their email
- If they're outside the free window, cancellation is free
- If they're inside the window, they see the fee warning before confirming

Note: Collecting cancellation fees requires Stripe to be connected. Without Stripe, the policy text is shown but no fee is charged.`,
  },
];

export function getArticlesByCategory(categorySlug: string): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.category === categorySlug);
}

export function getArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}

export function getCategory(slug: string): HelpCategory | undefined {
  return HELP_CATEGORIES.find((c) => c.slug === slug);
}

export function searchArticles(query: string): HelpArticle[] {
  const lower = query.toLowerCase();
  return HELP_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(lower) ||
      a.description.toLowerCase().includes(lower) ||
      a.content.toLowerCase().includes(lower)
  );
}