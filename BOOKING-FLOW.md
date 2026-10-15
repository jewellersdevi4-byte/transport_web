# Booking flow — no advance payment

1. Customer opens the website at `/` or the customer app and signs in with mobile OTP.
2. Customer enters pickup, destination, date/time, and trip type.
3. Backend checks availability and calculates the fare; customer selects a vehicle category and enters passenger details.
4. Customer confirms. No payment selection, gateway, or deposit is required. Backend saves a CONFIRMED booking and booking number; driver assignment is still pending.
5. Admin opens `/admin` on the same web domain, or the admin app, and signs in. Admin reviews the booking and assigns a driver/vehicle.
6. Driver accepts the assignment through the configured driver communication workflow. Live WhatsApp/SMS delivery requires provider configuration; mock mode is not real delivery.
7. Admin starts the trip after acceptance, then marks it completed. Customer can view booking status and assigned driver details.
8. Customer settles the fare directly with the driver after the trip. No online payment is collected by this booking flow. CASH records the settlement method; it does not prove payment was collected.

All interfaces share the backend and its database. Customer and admin authentication remain separate. New ONLINE booking requests are rejected, and payment-order creation is disabled. Historical payment records and reconciliation handlers are retained without changing old balances or booking statuses.
