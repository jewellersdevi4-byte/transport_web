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
  Camera,
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

async function compressImageFile(file: File, maxWidth = 1000, maxHeight = 750, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new (window as any).Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(e.target?.result as string);
        ctx.drawImage(img, 0, 0, width, height);
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

  // Vehicle Option
  const [hasVehicle, setHasVehicle] = useState(true);
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<string>('Sedan');
  const [customVehicleType, setCustomVehicleType] = useState<string>('');
  const [vehicleCapacity, setVehicleCapacity] = useState('4');
  const [vehicleAc, setVehicleAc] = useState(true);
  const [vehicleImages, setVehicleImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remainingSlots = 5 - vehicleImages.length;
    if (remainingSlots <= 0) {
      setError('Maximum 5 photos allowed per vehicle.');
      return;
    }
    const toProcess = files.slice(0, remainingSlots);
    setUploadingImage(true);
    try {
      const compressedList = await Promise.all(toProcess.map((f) => compressImageFile(f)));
      setVehicleImages((prev) => [...prev, ...compressedList]);
    } catch (err) {
      setError('Failed to process image: ' + (err as Error).message);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  }

  function handleRemoveImage(index: number) {
    setVehicleImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSetCover(index: number) {
    if (index === 0) return;
    setVehicleImages((prev) => {
      const list = [...prev];
      const item = list[index];
      list.splice(index, 1);
      list.unshift(item);
      return list;
    });
  }

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
        vehicleImages: hasVehicle && vehicleImages.length > 0 ? vehicleImages : undefined,
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
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
            Welcome aboard, <strong>{name}</strong>! You are now registered and active as a driver partner with <strong>{submittedResult.entityName}</strong>.
          </p>

          {vehicleImages.length > 0 && (
            <div style={{ marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', height: '170px', border: '1px solid #e2e8f0', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              <img src={vehicleImages[0]} alt="Registered vehicle cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(15,23,42,0.85))', padding: '10px 14px', color: '#fff', fontSize: '13px', fontWeight: 700, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{vehicleModel} {vehicleNumber ? `(${vehicleNumber})` : ''}</span>
                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px' }}>{vehicleImages.length} Photo{vehicleImages.length > 1 ? 's' : ''} Attached</span>
              </div>
            </div>
          )}

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
    <div className="driver-reg-page" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        .driver-reg-page {
          padding: 36px 16px;
        }
        .driver-reg-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          padding: 32px 28px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
        }
        .driver-reg-title {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 10px;
          letter-spacing: -0.5px;
        }
        .driver-reg-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .driver-reg-model-plate-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 12px;
        }
        .driver-reg-specs-grid {
          display: grid;
          grid-template-columns: 1.4fr 0.8fr 1fr;
          gap: 12px;
        }
        .driver-reg-specs-class {
          grid-column: span 1;
        }
        .driver-reg-toggle-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 18px;
        }
        .driver-reg-vehicle-box {
          background: #f8fafc;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          padding: 18px 16px;
          display: grid;
          gap: 14px;
        }
        .driver-photos-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 16px 14px;
          margin-top: 6px;
        }
        .driver-upload-dropzone {
          border: 1.5px dashed #38bdf8;
          background: #f0f9ff;
          border-radius: 10px;
          padding: 18px 14px;
          text-align: center;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .driver-upload-dropzone:hover {
          background: #e0f2fe;
          border-color: #0284c7;
        }
        .driver-photos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }

        @media (max-width: 640px) {
          .driver-reg-page {
            padding: 16px 10px !important;
          }
          .driver-reg-card {
            padding: 20px 14px !important;
            border-radius: 16px !important;
          }
          .driver-reg-title {
            font-size: 24px !important;
          }
          .driver-reg-grid-2col {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .driver-reg-model-plate-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .driver-reg-specs-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .driver-reg-specs-class {
            grid-column: span 2 !important;
          }
          .driver-reg-toggle-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .driver-reg-vehicle-box {
            padding: 14px 12px !important;
            gap: 12px !important;
          }
          .driver-photos-card {
            padding: 14px 12px !important;
          }
          .driver-photos-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
          }
        }
        @media (max-width: 380px) {
          .driver-photos-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        {/* Header Banner */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '24px', padding: '6px 14px', color: '#1d4ed8', fontSize: '12px', fontWeight: 700, marginBottom: '14px' }}>
            <Sparkles size={14} /> Partner Driver Registration
          </div>
          <h1 className="driver-reg-title">
            Join As A Cab Driver
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Partner with top cab operators. Receive regular passenger bookings, guaranteed fares, and instant settlements.
          </p>
        </div>

        {/* Form Container */}
        <div className="driver-reg-card">
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

                <div className="driver-reg-grid-2col">
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
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a', boxSizing: 'border-box' }}
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
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a', boxSizing: 'border-box' }}
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
              <div className="driver-reg-toggle-grid">
                <button
                  type="button"
                  onClick={() => setHasVehicle(true)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '10px',
                    border: hasVehicle ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    background: hasVehicle ? '#f0f9ff' : '#ffffff',
                    color: hasVehicle ? '#0284c7' : '#475569',
                    fontWeight: 700,
                    fontSize: '13px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: hasVehicle ? '0 2px 6px rgba(2, 132, 199, 0.12)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>🚗</span>
                  <span>I Have My Own Cab</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHasVehicle(false)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '10px',
                    border: !hasVehicle ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    background: !hasVehicle ? '#f0f9ff' : '#ffffff',
                    color: !hasVehicle ? '#0284c7' : '#475569',
                    fontWeight: 700,
                    fontSize: '13px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: !hasVehicle ? '0 2px 6px rgba(2, 132, 199, 0.12)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>🏢</span>
                  <span>Need Company Cab</span>
                </button>
              </div>

              {hasVehicle && (
                <div className="driver-reg-vehicle-box">
                  <div className="driver-reg-model-plate-grid">
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
                        style={{ width: '100%', padding: '11px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
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
                        style={{ width: '100%', padding: '11px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div className="driver-reg-specs-grid">
                    <div className="driver-reg-specs-class">
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
                        style={{ width: '100%', padding: '11px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
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
                        style={{ width: '100%', padding: '11px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Air Conditioning
                      </label>
                      <select
                        value={vehicleAc ? 'yes' : 'no'}
                        onChange={(e) => setVehicleAc(e.target.value === 'yes')}
                        style={{ width: '100%', padding: '11px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
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
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #22c55e', fontSize: '13px', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
                      />
                      <span style={{ fontSize: '11px', color: '#15803d', lineHeight: 1.4 }}>
                        Enter your exact vehicle category or body type if it is not in the list above.
                      </span>
                    </div>
                  )}

                  {/* Vehicle Photos Upload Section */}
                  <div className="driver-photos-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Camera size={15} color="#0284c7" />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Vehicle Photos</div>
                          <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.2 }}>Front, sides, interior, rear</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: vehicleImages.length > 0 ? '#ecfdf5' : '#f1f5f9', color: vehicleImages.length > 0 ? '#047857' : '#64748b' }}>
                        {vehicleImages.length} / 5
                      </span>
                    </div>

                    {vehicleImages.length === 0 ? (
                      <label
                        className="driver-upload-dropzone"
                        style={{ cursor: uploadingImage ? 'not-allowed' : 'pointer' }}
                      >
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(2, 132, 199, 0.15)', marginBottom: '4px' }}>
                          <Camera size={18} color="#0284c7" />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>
                          {uploadingImage ? 'Compressing & Attaching Photos…' : 'Tap to Add Vehicle Photos'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Use Camera or Phone Gallery · Max 5 photos
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={uploadingImage}
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    ) : (
                      <div>
                        <div className="driver-photos-grid">
                          {vehicleImages.map((imgSrc, idx) => (
                            <div key={idx} style={{ position: 'relative', height: '84px', borderRadius: '8px', overflow: 'hidden', border: idx === 0 ? '2px solid #0284c7' : '1px solid #cbd5e1', background: '#0f172a' }}>
                              <img src={imgSrc} alt={`Vehicle photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              {idx === 0 && (
                                <span style={{ position: 'absolute', top: 4, left: 4, background: '#0284c7', color: '#ffffff', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px' }}>
                                  ★ Cover
                                </span>
                              )}
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleSetCover(idx)}
                                  title="Set as Main Cover Photo"
                                  style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(15,23,42,0.85)', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '2px 5px', fontSize: '9px', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Cover
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                title="Delete photo"
                                style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}

                          {vehicleImages.length < 5 && (
                            <label
                              style={{
                                height: '84px',
                                borderRadius: '8px',
                                border: '1.5px dashed #38bdf8',
                                background: '#f0f9ff',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                cursor: uploadingImage ? 'not-allowed' : 'pointer',
                                color: '#0284c7',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              <Camera size={18} />
                              <span>{uploadingImage ? '...' : '+ Add'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={uploadingImage}
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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
