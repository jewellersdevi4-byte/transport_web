import type {
  Booking,
  Customer,
  Driver,
  Vehicle,
  Pricing,
  Route,
  Notice,
  Settings,
  InvoiceData,
  BookingStatus,
  VehicleType,
  VehiclePackage,
  VehicleFeedback,
  VehicleFeedbackSummary,
  FeedbackStatus,
  AdminPermission,
  AdminRole,
  AdminUser,
} from '../../shared-types/src/index';

export const API_PREFIX = '/api/v1';

export const ENDPOINTS = {
  HEALTH: `${API_PREFIX}/health`,
  CONFIG: `${API_PREFIX}/public/config`,
  AUTH: {
    CUSTOMER_SEND_OTP: `${API_PREFIX}/auth/customer/send-otp`,
    CUSTOMER_VERIFY_OTP: `${API_PREFIX}/auth/customer/verify-otp`,
    ADMIN_LOGIN: `${API_PREFIX}/auth/admin/login`,
    REFRESH: `${API_PREFIX}/auth/refresh`,
    LOGOUT: `${API_PREFIX}/auth/logout`,
  },
  CUSTOMER: {
    PROFILE: `${API_PREFIX}/customer/profile`,
    ADDRESSES: `${API_PREFIX}/customer/addresses`,
    BOOKINGS: `${API_PREFIX}/customer/bookings`,
    BOOKING_BY_ID: (id: string) => `${API_PREFIX}/customer/bookings/${id}`,
    CANCEL_BOOKING: (id: string) => `${API_PREFIX}/customer/bookings/${id}/cancel`,
    INVOICE: (id: string) => `${API_PREFIX}/customer/bookings/${id}/invoice`,
    AVAILABLE_VEHICLES: `${API_PREFIX}/customer/vehicles/available`,
    VEHICLES_BY_PICKUP: `${API_PREFIX}/customer/vehicles/by-pickup`,
    FEEDBACK: `${API_PREFIX}/customer/feedback`,
    VEHICLE_FEEDBACK: (vehicleId: string) => `${API_PREFIX}/customer/vehicles/${vehicleId}/feedback`,
  },
  ADMIN: {
    DASHBOARD: `${API_PREFIX}/admin/dashboard`,
    BOOKINGS: `${API_PREFIX}/admin/bookings`,
    BOOKING_BY_ID: (id: string) => `${API_PREFIX}/admin/bookings/${id}`,
    UPDATE_STATUS: (id: string) => `${API_PREFIX}/admin/bookings/${id}/status`,
    ASSIGN_DRIVER: (id: string) => `${API_PREFIX}/admin/bookings/${id}/assign-driver`,
    CANCEL_BOOKING: (id: string) => `${API_PREFIX}/admin/bookings/${id}/cancel`,
    INVOICE: (id: string) => `${API_PREFIX}/admin/bookings/${id}/invoice`,
    DRIVERS: `${API_PREFIX}/admin/drivers`,
    DRIVER_BY_ID: (id: string) => `${API_PREFIX}/admin/drivers/${id}`,
    VEHICLES: `${API_PREFIX}/admin/vehicles`,
    VEHICLE_BY_ID: (id: string) => `${API_PREFIX}/admin/vehicles/${id}`,
    FEEDBACKS: `${API_PREFIX}/admin/feedback`,
    FEEDBACK_STATUS: (id: string) => `${API_PREFIX}/admin/feedback/${id}/status`,
    PRICING: `${API_PREFIX}/admin/pricing`,
    ROUTES: `${API_PREFIX}/admin/routes`,
    ROUTE_BY_ID: (id: string) => `${API_PREFIX}/admin/routes/${id}`,
    REPORTS: `${API_PREFIX}/admin/reports`,
    NOTIFICATIONS: `${API_PREFIX}/admin/notifications`,
    SETTINGS: `${API_PREFIX}/admin/settings`,
  },
  DRIVER: {
    ASSIGNMENT_RESPONSE: `${API_PREFIX}/driver/assignment-response`,
  },
  PAYMENTS: {
    CREATE_ORDER: `${API_PREFIX}/payments/create-order`,
    VERIFY: `${API_PREFIX}/payments/verify`,
  },
  WEBHOOKS: {
    RAZORPAY: `${API_PREFIX}/webhooks/razorpay`,
    WHATSAPP: `${API_PREFIX}/webhooks/whatsapp`,
  },
} as const;

export interface QuoteItem extends Vehicle {
  fare: number;
  packages?: VehiclePackage[];
  driverName?: string;
  driverRating?: number;
  driverTrips?: number;
  driverBaseLocation?: string;
}

export interface AvailableVehiclesResponse {
  distance: number;
  estimated: boolean;
  vehicles: QuoteItem[];
}

export interface PickupAvailabilityResponse {
  directVehicleBooking: boolean;
  vehicles: Array<Omit<QuoteItem, 'fare'>>;
}

export interface CustomerAuthResponse {
  token: string;
  customer: Customer;
}

export interface AdminAuthResponse {
  token: string;
  admin?: {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
    permissions: AdminPermission[];
  };
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminDashboardResponse {
  bookings: Booking[];
  notifications: Notice[];
  drivers: Driver[];
  vehicles: Vehicle[];
}

export interface PaymentOrderResponse {
  id: string;
  bookingId: string;
  orderId: string;
  amount: number;
  mock: boolean;
  keyId?: string;
}

export interface NotificationSendResponse {
  sent: number;
  mock: boolean;
}

export interface ConfigResponse {
  settings: Settings;
  routes: Route[];
  mockMode: boolean;
}

export interface CreateFeedbackInput {
  vehicleId: string;
  bookingId?: string;
  rating: number;
  message: string;
}

export interface UpdateFeedbackStatusInput {
  status: FeedbackStatus;
}

export interface AdminFeedbackListResponse {
  feedbacks: VehicleFeedback[];
  pendingCount: number;
}

