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

export function DriverRegisterView() {
  const [entities, setEntities] = useState<PublicEntity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(true);

  // Form State
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('');
  const [baseLocation, setBaseLocation] = useState('');
  const [serviceRadiusKm, setServiceRadiusKm] = useState('30');

  // Vehicle Option
  const [hasVehicle, setHasVehicle] = useState(true);
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<'Sedan' | 'SUV' | 'Tempo Traveller'>('Sedan');
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

    setSubmitting(true);
    try {
      const payload = {
        entityId: selectedEntityId,
        name: name.trim(),
        phone: cleanPhone,
        license: license.trim().toUpperCase(),
        baseLocation: baseLocation.trim(),
        serviceRadiusKm: Number(serviceRadiusKm) || 30,
        hasVehicle,
        vehicleModel: hasVehicle ? vehicleModel.trim() : undefined,
        vehicleNumber: hasVehicle && vehicleNumber.trim() ? vehicleNumber.trim().toUpperCase() : undefined,
        vehicleType,
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

          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>Application Submitted!</h2>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>
            Thank you, <strong>{name}</strong>. Your driver partner application has been submitted to <strong>{submittedResult.entityName}</strong> and is currently under admin verification.
          </p>

          <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px', textAlign: 'left', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ShieldCheck size={18} color="#0284c7" />
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>What happens next?</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#64748b', lineHeight: 1.7 }}>
              <li>The dispatch administrator at <strong>{submittedResult.entityName}</strong> will verify your driving license and vehicle registration.</li>
              <li>Once approved, you will receive an automated <strong>WhatsApp / SMS confirmation</strong> and your status will become active for trip assignments.</li>
              <li>You can start receiving passenger bookings directly on your WhatsApp.</li>
            </ul>
          </div>

          {selectedEntity?.contactPhone && (
            <div style={{ marginBottom: '28px', fontSize: '13px', color: '#475569' }}>
              Questions about your application?{' '}
              <a
                href={`https://wa.me/91${selectedEntity.contactPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello, I have submitted my driver application (Ref: ${submittedResult.driverId}) for ${submittedResult.entityName}. Please review and approve.`)}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Contact Dispatch WhatsApp <ExternalLink size={13} />
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
              Return to Home
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

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
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
                    <small style={{ fontSize: '11px', color: '#64748b' }}>Your primary city or home dispatch hub.</small>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Service Radius (km)
                    </label>
                    <select
                      value={serviceRadiusKm}
                      onChange={(e) => setServiceRadiusKm(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a', background: '#fff' }}
                    >
                      <option value="20">20 km</option>
                      <option value="30">30 km</option>
                      <option value="50">50 km</option>
                      <option value="100">100 km</option>
                    </select>
                  </div>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Vehicle Class
                      </label>
                      <select
                        value={vehicleType}
                        onChange={(e) => {
                          const vt = e.target.value as 'Sedan' | 'SUV' | 'Tempo Traveller';
                          setVehicleType(vt);
                          if (vt === 'Sedan') setVehicleCapacity('4');
                          if (vt === 'SUV') setVehicleCapacity('6');
                          if (vt === 'Tempo Traveller') setVehicleCapacity('12');
                        }}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#fff' }}
                      >
                        <option value="Sedan">Sedan (Dzire, Etios)</option>
                        <option value="SUV">SUV (Innova, Ertiga)</option>
                        <option value="Tempo Traveller">Tempo Traveller (Van)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Passenger Capacity
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
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
                </div>
              )}
            </div>

            {/* Declaration & Submit */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <ShieldCheck size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  By submitting this application, you declare that all provided driving license and vehicle information is genuine and valid under Indian transport regulations. Applications are subject to admin review prior to trip allocation.
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
              {submitting ? 'Submitting Application…' : (
                <>
                  Submit Application For Approval <ArrowRight size={18} />
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
