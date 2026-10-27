'use client';

import { useState, useEffect } from 'react';
import {
  Car,
  User,
  Phone,
  FileText,
  MapPin,
  CheckCircle,
  AlertCircle,
  Building,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '../../api-client/src/index';

interface PublicEntity {
  id: string;
  name: string;
  slug: string;
  contactName: string;
  contactPhone: string;
  city?: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  driverId: string;
  entityName: string;
  status: string;
}

export const VEHICLE_CLASS_OPTIONS = [
  { value: 'Hatchback', label: 'Hatchback (WagonR, Swift, Tiago, i10)', defaultCapacity: '4' },
  { value: 'Sedan', label: 'Sedan (Dzire, Etios, Amaze, Aura)', defaultCapacity: '4' },
  { value: 'Premium Sedan', label: 'Premium Sedan (City, Verna, Ciaz)', defaultCapacity: '4' },
  { value: 'SUV', label: 'SUV (Ertiga, Carens, Bolero, Scorpio)', defaultCapacity: '6' },
  { value: 'Premium SUV', label: 'Premium SUV / MUV (Innova Crysta, Hycross, Fortuner)', defaultCapacity: '7' },
  { value: 'Tempo Traveller', label: 'Tempo Traveller / Minivan (12–20 Seater)', defaultCapacity: '12' },
  { value: 'Mini Bus', label: 'Mini Bus (21–33 Seater)', defaultCapacity: '25' },
  { value: 'Bus', label: 'Bus / Coach (34+ Seater)', defaultCapacity: '40' },
  { value: 'Luxury', label: 'Luxury (Mercedes, BMW, Audi, Camry)', defaultCapacity: '4' },
  { value: 'Electric Vehicle (EV)', label: 'Electric Vehicle - EV (Nexon, Tiago, ZS EV)', defaultCapacity: '4' },
  { value: 'Auto / Rickshaw', label: 'Auto / 3-Wheeler (Rickshaw, E-Rickshaw)', defaultCapacity: '3' },
  { value: 'Other', label: '✏️ Other (Type Custom Vehicle Class...)', defaultCapacity: '4' },
];

export function DriverRegisterView() {
  const [entities, setEntities] = useState<PublicEntity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(true);

  // Form State
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('');
  const [baseLocation, setBaseLocation] = useState('');

  // Vehicle Option
  const [hasVehicle, setHasVehicle] = useState(true);
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<string>('Sedan');
  const [customVehicleType, setCustomVehicleType] = useState<string>('');
  const [vehicleCapacity, setVehicleCapacity] = useState('4');
  const [vehicleAc, setVehicleAc] = useState(true);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedResult, setSubmittedResult] = useState<RegisterResponse | null>(null);

  useEffect(() => {
    fetchEntities();
  }, []);

  async function fetchEntities() {
    setLoadingEntities(true);
    try {
      const res = await apiClient<{ entities: PublicEntity[] }>('/public/entities');
      const list = res.entities || [];
      setEntities(list);
      if (list.length > 0) {
        setSelectedEntityId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load entities:', err);
      // Fallback entity
      const fallback: PublicEntity = {
        id: 'dj-cabs',
        name: 'DJ Cabs (Devi Jewellers Transport)',
        slug: 'dj-cabs',
        contactName: 'Operations Dispatch',
        contactPhone: '9845012345',
        city: 'Kaup, Udupi, Karnataka',
      };
      setEntities([fallback]);
      setSelectedEntityId(fallback.id);
    } finally {
      setLoadingEntities(false);
    }
  }

  const selectedEntity = entities.find((e) => e.id === selectedEntityId) || entities[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!selectedEntityId) {
      setError('Please select a cab entity to register with.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your full legal name as shown on your driving license.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!license.trim() || license.trim().length < 5) {
      setError('Please enter a valid Driving License number (minimum 5 characters).');
      return;
    }
    if (!baseLocation.trim()) {
      setError('Please enter your operating city or base location.');
      return;
    }
    if (hasVehicle && !vehicleModel.trim()) {
      setError('Please enter your vehicle model name (e.g., Maruti Dzire, Innova Crysta).');
      return;
    }

    const finalVehicleType = vehicleType === 'Other'
      ? customVehicleType.trim()
      : vehicleType;

    if (hasVehicle && vehicleType === 'Other' && (!customVehicleType.trim() || customVehicleType.trim().length < 2)) {
      setError('Please type your custom vehicle class (minimum 2 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        entityId: selectedEntityId,
        name: name.trim(),
        phone: cleanPhone,
        license: license.trim().toUpperCase(),
        baseLocation: baseLocation.trim(),
        hasVehicle,
        vehicleModel: hasVehicle ? vehicleModel.trim() : undefined,
        vehicleNumber: hasVehicle && vehicleNumber.trim() ? vehicleNumber.trim().toUpperCase() : undefined,
        vehicleType: finalVehicleType,
        vehicleCapacity: Number(vehicleCapacity) || 4,
        vehicleAc,
      };

      const res = await apiClient<RegisterResponse>('/public/drivers/register', {
        method: 'POST',
        body: payload,
      });

      setSubmittedResult(res);
    } catch (err) {
      setError((err as Error).message || 'Failed to submit driver registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedResult) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ maxWidth: '580px', width: '100%', background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '36px 28px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <CheckCircle size={36} />
          </div>

          <span style={{ display: 'inline-block', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, marginBottom: '12px' }}>
            ACTIVE DRIVER PARTNER
          </span>

          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>Registration Successful!</h2>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>
            Welcome aboard, <strong>{name}</strong>! You are now registered and active as a driver partner with <strong>{submittedResult.entityName}</strong>.
          </p>

          <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px', textAlign: 'left', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ShieldCheck size={18} color="#16a34a" />
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>You are ready to receive bookings</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#64748b', lineHeight: 1.7 }}>
              <li>Your driver profile has been activated with <strong>{submittedResult.entityName}</strong>.</li>
              {hasVehicle && vehicleModel && (
                <li>Your vehicle (<strong>{vehicleModel}</strong>{vehicleNumber ? ` - ${vehicleNumber}` : ''}) is added to the active fleet.</li>
              )}
              <li>Dispatch requests in your area will be sent directly to your WhatsApp at <strong>+91 {phone}</strong>.</li>
              <li>You can accept or decline trips directly via WhatsApp with 1 tap.</li>
            </ul>
          </div>

          {selectedEntity?.contactPhone && (
            <div style={{ marginBottom: '28px', fontSize: '13px', color: '#475569' }}>
              Have questions or want to check in with dispatch?{' '}
              <a
                href={`https://wa.me/91${selectedEntity.contactPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello, I have registered as a driver (${name}, Phone: +91 ${phone}) for ${submittedResult.entityName}. Please share upcoming trips.`)}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Message Dispatch on WhatsApp <ExternalLink size={13} />
              </a>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 24px',
                background: '#0284c7',
                color: '#ffffff',
                fontWeight: 700,
                borderRadius: '10px',
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              Return to Website
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 16px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        {/* Header Banner */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '24px', padding: '6px 14px', color: '#1d4ed8', fontSize: '12px', fontWeight: 700, marginBottom: '14px' }}>
            <Sparkles size={14} /> Partner Driver Registration
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px', letterSpacing: '-0.5px' }}>
            Join As A Cab Driver
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Partner with top cab operators. Receive regular passenger bookings, guaranteed fares, and instant settlements.
          </p>
        </div>

        {/* Form Container */}
        <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '32px 24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '14px', borderRadius: '10px', marginBottom: '24px', fontSize: '13px', fontWeight: 500 }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Entity Selection */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                <Building size={16} color="#0284c7" />
                Select Cab Operator / Branch to Register With:
              </label>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px' }}>
                Choose which cab company or regional branch you want to operate under.
              </p>

              {loadingEntities ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  Loading partner entities…
                </div>
              ) : entities.length === 0 ? (
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b' }}>
                  Defaulting to DJ Cabs
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {entities.map((e) => {
                    const isSelected = selectedEntityId === e.id;
                    return (
                      <div
                        key={e.id}
                        onClick={() => setSelectedEntityId(e.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          background: isSelected ? '#f0f9ff' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? '#0284c7' : '#0f172a' }}>
                            {e.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            📍 {e.city || 'Regional Hub'} {e.contactPhone ? ` · 📞 ${e.contactPhone}` : ''}
                          </div>
                        </div>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: isSelected ? '6px solid #0284c7' : '2px solid #cbd5e1', background: '#ffffff', flexShrink: 0 }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: '24px 0' }} />

            {/* Step 2: Personal Information */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="#0284c7" /> Chauffeur / Driver Details
              </h3>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Shetty"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a' }}
                  />
                  <small style={{ fontSize: '11px', color: '#64748b' }}>Must match your commercial driving license name.</small>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Mobile Phone (10 Digits) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9845012345"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a' }}
                    />
                    <small style={{ fontSize: '11px', color: '#64748b' }}>WhatsApp booking alerts will be sent here.</small>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Driving License Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. KA202021001234"
                      value={license}
                      onChange={(e) => setLicense(e.target.value.toUpperCase())}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a' }}
                    />
                    <small style={{ fontSize: '11px', color: '#64748b' }}>Transport / Commercial Badge License.</small>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Base Location / City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kaup, Udupi, Mangaluru, Kundapura"
                    value={baseLocation}
                    onChange={(e) => setBaseLocation(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a' }}
                  />
                  <small style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>Your primary city or home dispatch hub.</small>
                </div>
              </div>
            </div>

            <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: '24px 0' }} />

            {/* Step 3: Vehicle Ownership & Details */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={18} color="#0284c7" /> Vehicle Configuration
              </h3>

              {/* Vehicle Ownership Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => setHasVehicle(true)}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: hasVehicle ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    background: hasVehicle ? '#f0f9ff' : '#ffffff',
                    color: hasVehicle ? '#0284c7' : '#475569',
                    fontWeight: 700,
                    fontSize: '13px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  🚗 I Have My Own Cab
                </button>
                <button
                  type="button"
                  onClick={() => setHasVehicle(false)}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: !hasVehicle ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    background: !hasVehicle ? '#f0f9ff' : '#ffffff',
                    color: !hasVehicle ? '#0284c7' : '#475569',
                    fontWeight: 700,
                    fontSize: '13px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  🏢 Need Company Cab
                </button>
              </div>

              {hasVehicle && (
                <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px', display: 'grid', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Vehicle Model *
                      </label>
                      <input
                        type="text"
                        required={hasVehicle}
                        placeholder="e.g. Maruti Dzire / Innova Crysta"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#fff' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Registration / Number Plate
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. KA 20 AB 1234"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#fff' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Vehicle Class
                      </label>
                      <select
                        value={vehicleType}
                        onChange={(e) => {
                          const vt = e.target.value;
                          setVehicleType(vt);
                          const matched = VEHICLE_CLASS_OPTIONS.find((opt) => opt.value === vt);
                          if (matched && vt !== 'Other') {
                            setVehicleCapacity(matched.defaultCapacity);
                          }
                        }}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#fff' }}
                      >
                        {VEHICLE_CLASS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Passenger Capacity
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={vehicleCapacity}
                        onChange={(e) => setVehicleCapacity(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#fff' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Air Conditioning
                      </label>
                      <select
                        value={vehicleAc ? 'yes' : 'no'}
                        onChange={(e) => setVehicleAc(e.target.value === 'yes')}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#fff' }}
                      >
                        <option value="yes">❄️ AC Equipped</option>
                        <option value="no">Non-AC</option>
                      </select>
                    </div>
                  </div>

                  {vehicleType === 'Other' && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '14px 16px', display: 'grid', gap: '6px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#166534' }}>
                        Specify Custom Vehicle Class *
                      </label>
                      <input
                        type="text"
                        required={hasVehicle && vehicleType === 'Other'}
                        placeholder="e.g. Vintage Car, Force Cruiser, Ambulance, Mini Truck, 50-Seater Sleeper Coach"
                        value={customVehicleType}
                        onChange={(e) => setCustomVehicleType(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #22c55e', fontSize: '13px', color: '#0f172a', background: '#fff' }}
                      />
                      <span style={{ fontSize: '11px', color: '#15803d', lineHeight: 1.4 }}>
                        Enter your exact vehicle category or body type if it is not in the list above.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Declaration & Submit */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <ShieldCheck size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  By registering, you declare that all provided driving license and vehicle information is genuine and valid under Indian transport regulations. Your driver profile and vehicle will be activated immediately.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '14px',
                background: '#0284c7',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '15px',
                borderRadius: '10px',
                border: 0,
                cursor: submitting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              }}
            >
              {submitting ? 'Registering Driver Profile…' : (
                <>
                  Complete Registration & Activate Profile <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DriverRegisterView;
