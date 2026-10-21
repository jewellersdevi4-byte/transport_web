export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'DRIVER_ASSIGNED'
  | 'TRIP_STARTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PAID'
  | 'FAILED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'CASH';

export type AssignmentStatus =
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'PENDING_RESPONSE'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';

export type VehicleType = 'Sedan' | 'SUV' | 'Tempo Traveller';

export type TripType = 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_CITY';

export type NotificationChannel = 'WhatsApp' | 'SMS' | 'Email' | 'Push';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  emailVerifiedAt?: string;
  language: string;
  addresses: Address[];
  createdAt?: string;
}

export interface EmailOtpRecord {
  id: string;
  email: string;
  hash: string;
  sentAt: number;
  expiresAt: number;
  attempts: number;
  used: boolean;
  delivered: boolean;
  code?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'DISPATCH_MANAGER' | 'OPERATIONS';
  active: boolean;
  createdAt?: string;
}

export interface Address {
  id: string;
  label: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface VehicleDriverContact {
  id?: string;
  name: string;
  phone: string;
  license?: string;
  rating?: number;
  trips?: number;
  baseLocation?: string;
  baseLocationPlaceId?: string;
  baseLatitude?: number;
  baseLongitude?: number;
  serviceRadiusKm?: number;
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  number?: string;
  model: string;
  capacity: number;
  ac: boolean;
  status: 'Available' | 'On Trip' | 'Maintenance' | 'Inactive';
  images?: string[];
  packages?: VehiclePackage[];
  driver?: VehicleDriverContact;
  rating?: number;
  reviewCount?: number;
}

export type FeedbackStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VehicleFeedback {
  id: string;
  vehicleId: string;
  vehicleModel?: string;
  bookingId?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  rating: number; // 1 to 5
  message: string;
  status: FeedbackStatus;
  createdAt: string;
  moderatedAt?: string;
  moderatedBy?: string;
}

export interface VehicleFeedbackSummary {
  vehicleId: string;
  averageRating: number;
  reviewCount: number;
  reviews: VehicleFeedback[];
}

export interface VehiclePackage {
  id: string;
  name: string;
  includedHours: number;
  includedKm: number;
  price: number;
  extraKmRate: number;
  extraHourRate: number;
  tollsParkingExtra: boolean;
  estimatedFare?: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  license: string;
  vehicleId: string;
  status: 'Available' | 'On Trip' | 'Inactive';
  rating: number;
  trips: number;
  baseLocation?: string;
  baseLocationPlaceId?: string;
  baseLatitude?: number;
  baseLongitude?: number;
  serviceRadiusKm?: number;
}

export interface Pricing {
  vehicleType: VehicleType;
  perKm: number;
  minimum: number;
  surge: number;
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  distance: number;
  fixedPrice: number;
  active: boolean;
}

export interface BookingLeg {
  id: string;
  bookingId: string;
  origin: string;
  destination: string;
  order: number;
  distanceKm: number;
}

export interface History {
  status: BookingStatus;
  at: string;
  by: string;
  reason?: string;
}

export interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  surgeMultiplier: number;
  additionalCharges: number;
  tax: number;
  total: number;
  currency: string;
  pricingVersion?: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  name: string;
  phone: string;
  email: string;
  pickup: string;
  drop: string;
  date: string;
  time: string;
  returnDate?: string;
  tripType: TripType;
  stops?: string[];
  passengers: number;
  luggage: number;
  requests: string;
  vehicleType: VehicleType;
  vehicleId: string;
  packageId?: string;
  packageName?: string;
  extraHours?: number;
  driverId: string | null;
  assignment: AssignmentStatus;
  assignmentExpiresAt?: string;
  assignmentToken?: string;
  assignmentDeclineReason?: string;
  driverLocation?: {
    lat: number;
    lng: number;
    updatedAt: string;
    speed?: number;
    heading?: number;
  };
  fare: number;
  fareBreakdown?: FareBreakdown;
  distance: number;
  paymentMethod: 'ONLINE' | 'CASH';
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  history: History[];
  createdAt: string;
  idempotencyKey: string;
  directBooking?: boolean;
}

export interface DriverAssignment {
  id: string;
  bookingId: string;
  driverId: string;
  vehicleId: string;
  status: AssignmentStatus;
  channel: NotificationChannel;
  messageId?: string;
  sentAt: string;
  expiresAt: string;
  respondedAt?: string;
  responseNote?: string;
}

export interface Notice {
  id: string;
  recipientType: 'customer' | 'driver' | 'admin';
  recipientId: string;
  bookingId?: string;
  channel: NotificationChannel;
  template: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  gateway: string;
  gatewayPaymentId?: string;
  createdAt?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  pickup: string;
  drop: string;
  stops?: string[];
  vehicleType: VehicleType;
  fare: number;
  tax: number;
  total: number;
  paymentMethod: 'ONLINE' | 'CASH';
  paymentStatus: PaymentStatus;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  issuedAt: string;
}

export interface Settings {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  cancellationHours: number;
  terms: string;
  privacy: string;
  apkUrl: string;
  apkVersion: string;
  apkSize: string;
  directVehicleBooking?: boolean;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface WhatsAppSession {
  connected: boolean;
  status: 'DISCONNECTED' | 'SCAN_QR' | 'CONNECTED';
  phone?: string;
  device?: string;
  connectedAt?: string;
  qr?: string;
  pairingCode?: string;
  lastError?: string;
  messagesSent: number;
  lastSentAt?: string;
}

export interface Store {
  customers: Customer[];
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: Booking[];
  pricing: Pricing[];
  routes: Route[];
  notifications: Notice[];
  payments: Payment[];
  settings: Settings;
  feedbacks?: VehicleFeedback[];
  adminUsers?: AdminUser[];
  emailOtps?: EmailOtpRecord[];
  whatsappSession?: WhatsAppSession;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  correlationId?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
