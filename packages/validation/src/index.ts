import { z } from 'zod';

export const phoneRegex = /^[6-9]\d{9}$/;
export const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
export const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const tripSearchSchema = z
  .object({
    pickup: z.string().trim().min(3, 'Pickup location must be at least 3 characters').max(200),
    drop: z.string().trim().min(3, 'Destination must be at least 3 characters').max(200),
    date: z.string().regex(dateRegex, 'Date must be formatted as YYYY-MM-DD'),
    time: z.string().regex(timeRegex, 'Time must be formatted as HH:mm'),
    tripType: z.enum(['ONE_WAY', 'ROUND_TRIP', 'MULTI_CITY']).default('ONE_WAY'),
    returnDate: z.string().optional(),
    stops: z
      .preprocess(v => {
        if (!v) return undefined;
        if (Array.isArray(v)) return v.map(s => String(s).trim()).filter(Boolean);
        if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
        return v;
      }, z.array(z.string().min(2)).optional())
      .optional(),
  })
  .superRefine((v, c) => {
    if (v.pickup.toLowerCase() === v.drop.toLowerCase() && v.tripType !== 'ROUND_TRIP') {
      c.addIssue({ code: 'custom', message: 'Pickup and destination must differ.' });
    }
    const start = new Date(`${v.date}T${v.time}:00+05:30`);
    if (!Number.isFinite(start.getTime()) || start.getTime() < Date.now()) {
      c.addIssue({ code: 'custom', message: 'Choose a future pickup date and time.' });
    }
    if (v.tripType === 'ROUND_TRIP' && (!v.returnDate || v.returnDate < v.date)) {
      c.addIssue({ code: 'custom', message: 'Choose a return date on or after pickup.' });
    }
    if (v.tripType === 'MULTI_CITY' && (!v.stops || v.stops.length === 0)) {
      c.addIssue({ code: 'custom', message: 'Add at least one intermediate stop for multi-city trips.' });
    }
  });

export const bookingCreateSchema = z.object({
  pickup: z.string().trim().min(3, 'Pickup is required'),
  drop: z.string().trim().min(3, 'Drop destination is required'),
  date: z.string().regex(dateRegex, 'Valid date is required'),
  time: z.string().regex(timeRegex, 'Valid time is required'),
  tripType: z.enum(['ONE_WAY', 'ROUND_TRIP', 'MULTI_CITY']),
  returnDate: z.string().optional(),
  stops: z.array(z.string()).optional(),
  vehicleType: z.enum(['Sedan', 'SUV', 'Tempo Traveller']),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().regex(phoneRegex, 'Enter a valid 10-digit Indian mobile number'),
  email: z.union([z.email('Enter a valid email address'), z.literal('')]).optional().default(''),
  passengers: z.coerce.number().int().min(1, 'At least 1 passenger is required').max(12),
  luggage: z.coerce.number().int().min(0).max(20).default(0),
  requests: z.string().max(500).default(''),
  paymentMethod: z.literal('CASH').default('CASH'),
  idempotencyKey: z.string().min(8).max(100),
});

export const customerSendOtpSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Enter a valid 10-digit Indian mobile number'),
});

export const customerVerifyOtpSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Enter a valid 10-digit Indian mobile number'),
  code: z.string().length(6, 'Enter the 6-digit OTP'),
});

export const adminLoginSchema = z.object({
  login: z.string().min(3, 'Enter your email or username'),
  password: z.string().min(6, 'Password is required'),
});

export const customerProfileUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.union([z.email('Enter a valid email address'), z.literal('')]).optional().default(''),
  language: z.enum(['English', 'Kannada', 'Hindi']).default('English'),
  addresses: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().min(1),
        address: z.string().min(3),
      })
    )
    .max(20)
    .default([]),
});

export const driverSchema = z.object({
  name: z.string().trim().min(2, 'Driver name is required'),
  phone: z.string().regex(phoneRegex, 'Valid 10-digit mobile number required'),
  license: z.string().min(5, 'Valid driver license number is required'),
  vehicleId: z.string().min(1, 'Assigned vehicle is required'),
  status: z.enum(['Available', 'On Trip', 'Inactive']).default('Available'),
  rating: z.coerce.number().min(0).max(5).default(5),
  trips: z.coerce.number().int().min(0).default(0),
});

export const vehicleSchema = z.object({
  type: z.enum(['Sedan', 'SUV', 'Tempo Traveller']),
  number: z.string().trim().min(5, 'Vehicle registration number is required'),
  model: z.string().trim().min(2, 'Model name is required'),
  capacity: z.coerce.number().int().min(1).max(50),
  ac: z.boolean().default(true),
  status: z.enum(['Available', 'On Trip', 'Maintenance', 'Inactive']).default('Available'),
});

export const pricingRuleSchema = z.object({
  vehicleType: z.enum(['Sedan', 'SUV', 'Tempo Traveller']),
  perKm: z.coerce.number().positive('Per-km rate must be positive'),
  minimum: z.coerce.number().positive('Minimum fare must be positive'),
  surge: z.coerce.number().min(1).max(5).default(1),
});

export const routeSchema = z.object({
  origin: z.string().trim().min(3, 'Origin is required'),
  destination: z.string().trim().min(3, 'Destination is required'),
  distance: z.coerce.number().positive('Distance must be positive'),
  fixedPrice: z.coerce.number().positive('Fixed price must be positive'),
  active: z.boolean().default(true),
});

export const driverAssignmentSchema = z.object({
  driverId: z.string().min(1, 'Driver ID is required'),
});

export const driverResponseSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  response: z.enum(['YES', 'NO']),
  driverPhone: z.string().optional(),
});

export const notificationComposerSchema = z.object({
  recipientType: z.enum(['customer', 'driver']),
  recipientId: z.string().min(1, 'Recipient ID or all is required'),
  channel: z.enum(['WhatsApp', 'SMS', 'Email', 'Push']),
  template: z.string().min(1, 'Template name is required'),
  message: z.string().min(1, 'Message is required').max(2000),
});

export const paymentOrderSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
});

export const paymentVerifySchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  orderId: z.string().min(1, 'Order ID is required'),
  outcome: z.enum(['success', 'failed', 'cancelled']).default('success'),
  paymentId: z.string().optional(),
  signature: z.string().optional(),
});

export const settingsUpdateSchema = z.object({
  businessName: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  email: z.string().email(),
  address: z.string().trim().min(3),
  cancellationHours: z.coerce.number().min(0).max(168),
  terms: z.string().min(10),
  privacy: z.string().min(10),
  apkUrl: z.union([z.url(), z.literal('')]).default(''),
  apkVersion: z.string().default('1.0.0'),
  apkSize: z.string().default('24.8 MB'),
});
