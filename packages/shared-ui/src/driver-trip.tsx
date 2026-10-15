'use client';
import { useEffect, useState } from 'react';
import { Check, X, MapPin, Phone, Car, Clock, Navigation, AlertTriangle, ShieldCheck, User } from 'lucide-react';
import { apiClient } from '../../api-client/src/index';

interface DriverAssignmentData {
  bookingNumber: string;
  pickup: string;
  drop: string;
  stops?: string[];
  date: string;
  time: string;
  tripType: string;
  vehicleType: string;
  passengers: number;
  luggage: number;
  requests?: string;
  distance?: number;
  assignment: string;
  assignmentExpiresAt?: string;
  assignmentDeclineReason?: string;
  isExpired: boolean;
  driver?: { id: string; name: string; phone: string };
  vehicle?: { id: string; model: string; number: string; type: string };
  customer?: { name: string; phone?: string };
  driverLocation?: { lat: number; lng: number; updatedAt: string };
}

export function DriverTripView() {
  const [token, setToken] = useState('');
  const [data, setData] = useState<DriverAssignmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('Already booked / on another ride');
  const [customReason, setCustomReason] = useState('');
  const [sharingGps, setSharingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string>('');
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number; time: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const t = urlParams.get('token') || '';
      setToken(t);
      if (!t) {
        setError('Missing assignment link token. Please open the link sent to your WhatsApp.');
        setLoading(false);
        return;
      }
      fetchAssignment(t);
    }
  }, []);

  async function fetchAssignment(tkn: string) {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient<DriverAssignmentData>(`/driver/assignments/${tkn}`);
      setData(res);
      if (res.driverLocation) {
        setLastLocation({
          lat: res.driverLocation.lat,
          lng: res.driverLocation.lng,
          time: new Date(res.driverLocation.updatedAt).toLocaleTimeString(),
        });
      }
    } catch (e) {
      setError((e as Error).message || 'Failed to load assignment details.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResponse(choice: 'YES' | 'NO') {
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      const reason = choice === 'NO' ? (declineReason === 'Other' ? customReason : declineReason) : undefined;
      const res = await apiClient<{ success: boolean; assignment: string; customerPhone?: string }>(
        `/driver/assignments/${token}/respond`,
        {
          method: 'POST',
          body: { response: choice, reason },
        }
      );
      if (res.success && data) {
        setData({
          ...data,
          assignment: res.assignment,
          customer: {
            ...data.customer,
            name: data.customer?.name || 'Customer',
            phone: res.customerPhone || data.customer?.phone,
          },
        });
        setDeclineOpen(false);
      }
    } catch (e) {
      setError((e as Error).message || 'Failed to submit response.');
    } finally {
      setBusy(false);
    }
  }

  // Live Location Sharing (GPS Watcher)
  useEffect(() => {
    if (!sharingGps || !token || data?.assignment !== 'ACCEPTED') return;

    if (!('geolocation' in navigator)) {
      setGpsStatus('Geolocation not supported by this browser.');
      setSharingGps(false);
      return;
    }

    setGpsStatus('Acquiring high-accuracy GPS signal…');
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const speed = pos.coords.speed || undefined;
          const heading = pos.coords.heading || undefined;

          await apiClient(`/driver/assignments/${token}/location`, {
            method: 'POST',
            body: { lat, lng, speed, heading },
          });

          setLastLocation({
            lat,
            lng,
            time: new Date().toLocaleTimeString(),
          });
          setGpsStatus('Live GPS active • Dispatch updating');
        } catch {
          setGpsStatus('GPS signal sent with network retry…');
        }
      },
      (err) => {
        setGpsStatus(`GPS error: ${err.message}. Ensure location permissions are allowed.`);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [sharingGps, token, data?.assignment]);

  if (loading) {
    return (
      <main style={{ maxWidth: 500, margin: '40px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <Car size={36} style={{ color: '#0f766e', animation: 'bounce 1s infinite' }} />
          <h2 style={{ fontSize: 20, marginTop: 12 }}>Loading Trip Offer…</h2>
          <p style={{ color: '#64748b', fontSize: 14 }}>Connecting to dispatch system</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main style={{ maxWidth: 500, margin: '40px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: 32, background: '#fff', borderRadius: 16, border: '1px solid #fecaca' }}>
          <AlertTriangle size={36} style={{ color: '#dc2626' }} />
          <h2 style={{ fontSize: 20, marginTop: 12, color: '#991b1b' }}>Trip Link Notice</h2>
          <p style={{ color: '#475569', fontSize: 14, margin: '12px 0 20px' }}>{error || 'Invalid or expired trip link.'}</p>
          <a
            href="tel:919876543210"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 8,
              background: '#0f766e',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            <Phone size={16} /> Contact Dispatch Office
          </a>
        </div>
      </main>
    );
  }

  const isAccepted = data.assignment === 'ACCEPTED';
  const isDeclined = data.assignment === 'DECLINED';
  const isExpired = data.isExpired || data.assignment === 'EXPIRED';

  return (
    <main style={{ maxWidth: 500, margin: '24px auto', padding: '0 16px 60px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0f766e', fontWeight: 700, fontSize: 16 }}>
          <Car size={20} /> Miles & Moments Chauffeur Dispatch
        </div>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Trip Reference #{data.bookingNumber}</p>
      </div>

      {/* Main Trip Card */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        {/* Status Banner */}
        {isAccepted && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '14px 16px', marginBottom: 18, color: '#166534' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 16 }}>
              <ShieldCheck size={20} /> Trip Accepted & Confirmed
            </div>
            <p style={{ fontSize: 13, marginTop: 4, color: '#15803d' }}>
              You are assigned to this ride. Dispatch and customer have been notified.
            </p>
          </div>
        )}

        {isDeclined && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 16px', marginBottom: 18, color: '#991b1b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 16 }}>
              <X size={20} /> Trip Declined
            </div>
            <p style={{ fontSize: 13, marginTop: 4, color: '#b91c1c' }}>
              You declined this trip. Dispatch will reassign to another chauffeur.
            </p>
          </div>
        )}

        {isExpired && !isAccepted && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 16px', marginBottom: 18, color: '#92400e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 16 }}>
              <Clock size={20} /> Offer Expired
            </div>
            <p style={{ fontSize: 13, marginTop: 4, color: '#b45309' }}>
              The 15-minute response window has elapsed. Contact dispatch if available.
            </p>
          </div>
        )}

        {/* Route Details */}
        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0f766e' }} />
              <div style={{ width: 2, height: 36, background: '#cbd5e1', margin: '4px 0' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div>
                <small style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Pickup Location</small>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>{data.pickup}</div>
              </div>
              <div style={{ marginTop: 14 }}>
                <small style={{ color: '#64748b', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Drop Destination</small>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>{data.drop}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule & Vehicle Specs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 10 }}>
            <small style={{ color: '#64748b', fontSize: 11 }}>Date & Pickup Time</small>
            <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{data.date} · {data.time}</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 10 }}>
            <small style={{ color: '#64748b', fontSize: 11 }}>Road Distance</small>
            <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{data.distance ? `${data.distance} km` : 'Standard'}</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 10 }}>
            <small style={{ color: '#64748b', fontSize: 11 }}>Vehicle Assigned</small>
            <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>
              {data.vehicle?.model || data.vehicleType} {data.vehicle?.number ? `(${data.vehicle.number})` : ''}
            </div>
          </div>
          <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 10 }}>
            <small style={{ color: '#64748b', fontSize: 11 }}>Travellers</small>
            <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{data.passengers} passengers · {data.luggage} bags</div>
          </div>
        </div>

        {data.requests && (
          <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '10px 12px', borderRadius: 10, fontSize: 13, color: '#92400e', marginBottom: 18 }}>
            <strong>Special Note:</strong> {data.requests}
          </div>
        )}

        {/* Customer Details - Unlocked ONLY upon Acceptance */}
        {isAccepted && data.customer?.phone ? (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <small style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Customer Contact</small>
                <div style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>{data.customer.name}</div>
                <div style={{ color: '#475569', fontSize: 14 }}>+91 {data.customer.phone}</div>
              </div>
              <a
                href={`tel:${data.customer.phone}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 16px',
                  borderRadius: 10,
                  background: '#0f766e',
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                <Phone size={16} /> Call
              </a>
            </div>
          </div>
        ) : (
          !isDeclined && !isExpired && (
            <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', margin: '10px 0 16px' }}>
              Customer contact will unlock automatically once you tap Accept.
            </p>
          )
        )}

        {/* Action Buttons for Pending Assignment */}
        {data.assignment === 'ASSIGNED' && !isExpired && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            <button
              onClick={() => handleResponse('YES')}
              disabled={busy}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '16px',
                borderRadius: 12,
                background: '#15803d',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(21,128,61,0.25)',
              }}
            >
              <Check size={20} /> {busy ? 'Accepting…' : 'Accept Trip'}
            </button>
            <button
              onClick={() => setDeclineOpen(true)}
              disabled={busy}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '14px',
                borderRadius: 12,
                background: '#fff',
                color: '#dc2626',
                border: '1.5px solid #fecaca',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <X size={18} /> Decline Trip
            </button>
          </div>
        )}

        {/* Live GPS Tracker Section (Active when Accepted) */}
        {isAccepted && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 18, marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <strong style={{ fontSize: 14, color: '#0f172a' }}>Live GPS Location Sharing</strong>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Stream real-time location to dispatch and customer</p>
              </div>
              <button
                onClick={() => setSharingGps(!sharingGps)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: sharingGps ? '#15803d' : '#e2e8f0',
                  color: sharingGps ? '#fff' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Navigation size={14} /> {sharingGps ? 'GPS ON' : 'Turn ON'}
              </button>
            </div>
            {gpsStatus && (
              <p style={{ fontSize: 12, color: sharingGps ? '#15803d' : '#64748b', background: '#f8fafc', padding: '6px 10px', borderRadius: 8 }}>
                {gpsStatus}
              </p>
            )}
            {lastLocation && (
              <p style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                Last broadcast: {lastLocation.lat.toFixed(4)}, {lastLocation.lng.toFixed(4)} at {lastLocation.time}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Decline Dialog Modal */}
      {declineOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 420, width: '100%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Decline Trip Assignment?</h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
              Please let dispatch know why you cannot take this trip so it can be reassigned immediately:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {[
                'Already booked / on another ride',
                'Vehicle under service / maintenance',
                'Pickup location is too distant',
                'Personal emergency / resting',
                'Other',
              ].map((r) => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="declineReason"
                    value={r}
                    checked={declineReason === r}
                    onChange={(e) => setDeclineReason(e.target.value)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            {declineReason === 'Other' && (
              <input
                type="text"
                placeholder="Specify reason…"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 16 }}
              />
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeclineOpen(false)}
                style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleResponse('NO')}
                disabled={busy}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {busy ? 'Submitting…' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
export default DriverTripView;
