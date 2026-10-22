'use client';
import { LocationInput } from './location-input';
import { apiClient } from '../../api-client/src/index';
import { useEffect, useState } from 'react';
import {
  Car,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  ShieldCheck,
  Clock,
  Smartphone,
  Check,
  Users,
  Luggage,
  Wind,
  ChevronLeft,
  Route as RouteIcon,
  QrCode,
  User,
  FileText,
  Phone,
  Search as SearchIcon,
  Compass,
  Download,
  Calendar,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Camera,
  Star,
} from 'lucide-react';
import type { Booking, Customer, Route, Settings, Vehicle, VehicleFeedbackSummary } from '../../shared-types/src/index';
import {
  Auth,
  Badge,
  BookingCard,
  BookingInfo,
  Empty,
  ErrorBox,
  Invoice,
  Loading,
  Modal,
  api,
  money,
  label,
  useResource,
  useSession,
  type DetailBooking,
} from './common';

type Search = {
  pickupPlaceId?: string;
  dropPlaceId?: string;
  stopPlaceIds?: string[];
  pickup: string;
  drop: string;
  date: string;
  time: string;
  tripType: 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_CITY';
  returnDate: string;
  stops: string[];
};

type Quote = Vehicle & {
  fare?: number;
  driverName?: string;
  driverRating?: number;
  driverTrips?: number;
  driverBaseLocation?: string;
};

export default function CustomerApp() {
  const session = useSession('customer');
  const [page, setPage] = useState('home');
  const [activeTab, setActiveTab] = useState<'book' | 'track'>('book');
  const [auth, setAuth] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [success, setSuccess] = useState(false);
  const [entitySlug, setEntitySlug] = useState<string>('');
  const [entityInfo, setEntityInfo] = useState<{ id: string; name: string; slug: string; city?: string; contactPhone?: string } | null>(null);
  const config = useResource<{ settings: Settings; routes: Route[]; mockMode: boolean }>('/public/config');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/download') setPage('download');
      else if (path === '/track') setPage('track');

      const urlParams = new URLSearchParams(window.location.search);
      const ent = (urlParams.get('entity') || '').trim();
      if (ent) {
        setEntitySlug(ent);
        api<{ id: string; name: string; slug: string; city?: string; contactPhone?: string }>(`/customer/entity/${ent}`)
          .then((info) => {
            if (info?.id) setEntityInfo(info);
          })
          .catch(() => {});
      }
    }
  }, []);

  function navigate(p: string) {
    setPage(p);
    setSuccess(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <>
      {/* Mobile Top Smart Banner: Direct APK Download First */}
      <div className="mobile-smart-banner">
        <div className="mobile-smart-banner-info">
          <img src="/brand/icon.png" alt="DJ Cabs" className="mobile-smart-banner-icon" />
          <div className="mobile-smart-banner-text">
            <strong>DJ Cabs Mobile App</strong>
            <span>Instant booking & live tracking</span>
          </div>
        </div>
        <a
          href="/downloads/customer-app-latest.apk"
          download="dj-cabs-v1.0.2.apk"
          className="mobile-smart-banner-cta"
        >
          <Download size={14} /> Download APK
        </a>
      </div>

      <header className="customer-header">
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('home');
          }}
        >
          <img className="brand-logo" src="/brand/dj-cabs-logo.png" alt="DJ Cabs" />
        </a>

        <nav>
          <button className={page === 'home' && activeTab === 'book' ? 'active' : ''} onClick={() => { setActiveTab('book'); navigate('home'); }}>
            Book a ride
          </button>
          <button className={page === 'track' || (page === 'home' && activeTab === 'track') ? 'active' : ''} onClick={() => { setActiveTab('track'); navigate('track'); }}>
            <SearchIcon size={15} style={{ verticalAlign: 'text-bottom' }} /> Track trip
          </button>
          <button className={page === 'routes' ? 'active' : ''} onClick={() => navigate('routes')}>
            <Compass size={15} style={{ verticalAlign: 'text-bottom' }} /> Popular routes
          </button>
          <button className={page === 'bookings' ? 'active' : ''} onClick={() => { navigate('bookings'); if (!session.token) setAuth(true); }}>
            My bookings
          </button>
          <button className={page === 'download' ? 'active' : ''} onClick={() => navigate('download')}>
            <Smartphone size={15} style={{ verticalAlign: 'text-bottom' }} /> Android App
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="secondary small" onClick={() => (session.token ? navigate('profile') : setAuth(true))}>
            {session.token ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <User size={15} /> My account
              </span>
            ) : (
              'Sign in'
            )}
            <ArrowUpRight size={15} />
          </button>
        </div>
      </header>

      <main>
        {page === 'home' && (
          <>
            <section className="hero">
              <div className="hero-copy">
                {/* Mobile Hero App Card: The very first visual card mobile users see */}
                <div className="mobile-hero-app-card">
                  <div className="mobile-hero-app-badge">
                    <ShieldCheck size={13} /> OFFICIAL ANDROID APP • v1.0.2
                  </div>
                  <div className="mobile-hero-app-content">
                    <img src="/brand/icon.png" alt="DJ Cabs" className="mobile-hero-app-icon" />
                    <div className="mobile-hero-app-title-group">
                      <h3>Get the DJ Cabs App</h3>
                      <p>Instant cab booking, live driver status & WhatsApp confirmations on your phone.</p>
                    </div>
                  </div>
                  <a
                    href="/downloads/customer-app-latest.apk"
                    download="dj-cabs-v1.0.2.apk"
                    className="primary full mobile-hero-download-btn"
                  >
                    <Download size={17} /> Download Android App (APK • 63 MB)
                  </a>
                  <div className="mobile-hero-app-meta">
                    <span>✓ 100% Free & Verified</span>
                    <span>✓ Fast 1-Tap Download</span>
                  </div>
                </div>

                <div className="prod-hero-badge">
                  <span className="green-dot" /> PREMIUM CHAUFFEUR & OUTSTATION SERVICE
                </div>
                <h1>
                  Good roads.<br />
                  Great <em>memories.</em>
                </h1>
                <p>
                  Airport transfers, weekend getaways, and intercity travel across Karnataka.<br className="desktop" />
                  Clean sanitised vehicles, verified drivers, and seamless private chauffeur travel.
                </p>
                <div className="hero-proof">
                  <span><ShieldCheck size={16} /> Verified chauffeurs</span>
                  <span><Check size={16} /> Sanitized luxury cabs</span>
                  <span><Clock size={16} /> 24/7 Dispatch support</span>
                </div>
              </div>
              <div className="hero-art" aria-label="Scenic Karnataka highway illustration">
                <div className="sun" />
                <div className="hill hill-back" />
                <div className="hill hill-front" />
                <div className="road" />
                <div className="road-line" />
                <div className="destination-pin">
                  <MapPin size={26} />
                </div>
                <div className="art-car">
                  <Car size={110} strokeWidth={1.4} />
                </div>
                <div className="floating-card">
                  <span className="green-dot" /> Karnataka & South India
                  <small>Udupi, Mangaluru, Bengaluru, Mysuru, Coorg</small>
                </div>
              </div>
            </section>

            <section id="book" className="booking-panel">
              {entityInfo && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge" style={{ background: '#2563eb', color: '#fff', fontWeight: 800 }}>OPERATOR</span>
                    <strong style={{ color: '#1e40af', fontSize: '0.98rem' }}>{entityInfo.name}</strong>
                    {entityInfo.city && <span style={{ color: '#64748b', fontSize: '0.85rem' }}>• {entityInfo.city}</span>}
                  </div>
                  {entityInfo.contactPhone && (
                    <a href={`tel:${entityInfo.contactPhone}`} style={{ color: '#1d4ed8', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
                      📞 {entityInfo.contactPhone}
                    </a>
                  )}
                </div>
              )}

              <div className="tab-switcher">
                <button className={activeTab === 'book' ? 'active' : ''} onClick={() => setActiveTab('book')}>
                  <Car size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Book a new journey
                </button>
                <button className={activeTab === 'track' ? 'active' : ''} onClick={() => setActiveTab('track')}>
                  <SearchIcon size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Track booking by ID
                </button>
              </div>

              {activeTab === 'book' ? (
                <BookingWizard
                  token={session.token}
                  onLogin={() => setAuth(true)}
                  onLoginToken={session.login}
                  routes={config.data?.routes || []}
                  entitySlug={entitySlug}
                  onBooked={(b) => {
                    setSelectedId(b.id);
                    setSuccess(true);
                    setPage('detail');
                  }}
                />
              ) : (
                <TrackTripInline onOpenBooking={(id) => { setSelectedId(id); setPage('detail'); }} />
              )}
            </section>

            <section className="content-section">
              <div className="section-title">
                <div>
                  <p className="eyebrow">POPULAR OUTSTATION ESCAPES</p>
                  <h2>Familiar routes. Pure comfort.</h2>
                </div>
                <span className="muted">Direct intercity private cabs across Karnataka & South India</span>
              </div>
              <div className="route-cards">
                {(config.data?.routes || []).map((r, i) => (
                  <button
                    key={r.id}
                    className={`route-card route-${i}`}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('choose-route', { detail: r }));
                      setActiveTab('book');
                      document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <div className="route-art">
                      <span><Car size={42} strokeWidth={1.5} /></span>
                      <p>{['AIRPORT RUNWAY EXPRESS', 'HERITAGE HIGHWAY', 'SCENIC HILL ESCAPE'][i % 3]}</p>
                    </div>
                    <div className="route-body">
                      <h3>{r.origin} <ArrowRight size={17} /> {r.destination}</h3>
                      {(() => {
                        const ratePerKm = Math.round(r.fixedPrice / Math.max(1, r.distance));
                        return (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0 10px', flexWrap: 'wrap' }}>
                              <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700 }}>
                                ₹{ratePerKm} / km
                              </span>
                              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                                {r.distance} km by road
                              </span>
                            </div>
                            <div className="section-title" style={{ marginTop: 'auto', paddingTop: 6, alignItems: 'flex-end' }}>
                              <div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                                  Fixed All-Inclusive Fare
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                                  {money(r.fixedPrice)}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>
                                  ({r.distance} km × ₹{ratePerKm}/km)
                                </div>
                              </div>
                              <span style={{ background: '#f1f5f9', padding: '7px', borderRadius: 8, display: 'inline-flex', color: '#1d5f59' }}>
                                <ArrowUpRight size={18} />
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="benefits content-section">
              <div>
                <p className="eyebrow">THE DJ CABS STANDARD</p>
                <h2>A superior journey,<br />from the first tap.</h2>
                <p className="muted">Every vehicle and driver is strictly verified for safety and comfort.</p>
              </div>
              {[
                [ShieldCheck, 'Verified Chauffeurs', 'Background-checked, courteous drivers with commercial badges.'],
                [Car, 'Well-Maintained Fleet', 'Sedans, SUVs, and luxury Tempo Travellers with cold AC.'],
                [Clock, 'Verified Reliable Dispatch', 'Round-the-clock chauffeur tracking, vehicle sanitization, and customer care.'],
              ].map(([Icon, title, copy]) => {
                const I = Icon as typeof Car;
                return (
                  <div key={String(title)}>
                    <I className="feature-icon" />
                    <h3>{String(title)}</h3>
                    <p className="muted">{String(copy)}</p>
                  </div>
                );
              })}
            </section>

            <section className="how content-section">
              <p className="eyebrow">EFFORTLESS 3-STEP RESERVATION</p>
              <h2>Seamless travel, start to finish.</h2>
              <div className="grid-three">
                {[
                  ['01', 'Choose Route & Date', 'Select one-way, round trip, or multi-city with intermediate stops.'],
                  ['02', 'Pick Your Vehicle', 'Select Sedans, SUVs, or luxury Tempo Travellers tailored to your group.'],
                  ['03', 'Chauffeur Assigned', 'Receive instant SMS and WhatsApp confirmation with driver details.'],
                ].map(([n, t, c]) => (
                  <div key={n}>
                    <span className="step-number">{n}</span>
                    <h3>{t}</h3>
                    <p className="muted">{c}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="app-banner content-section">
              <div>
                <span className="security-badge"><ShieldCheck size={14} /> Official Android Release</span>
                <h2>Travel with our companion Android app.</h2>
                <p>Install the lightweight Android APK directly onto your phone for 1-tap bookings and offline driver contacts.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a
                  className="primary"
                  href="/downloads/customer-app-latest.apk"
                  download="dj-cabs-v1.0.2.apk"
                >
                  <Download size={18} /> Download Android APK (63 MB)
                </a>
                <button className="secondary" onClick={() => navigate('download')}>
                  Installation guide & QR code <ArrowRight size={16} />
                </button>
              </div>
            </section>
          </>
        )}

        {page === 'track' && (
          <div className="page narrow">
            <TrackTripPage onOpenBooking={(id) => { setSelectedId(id); setPage('detail'); }} />
          </div>
        )}

        {page === 'routes' && (
          <div className="page">
            <p className="eyebrow">EXPLORE SOUTH INDIA</p>
            <h1>Popular Outstation Routes</h1>
            <p className="muted">Transparent, all-inclusive pricing for top outstation journeys.</p>
            <div className="route-cards" style={{ marginTop: 28 }}>
              {(config.data?.routes || []).map((r, i) => (
                <div key={r.id} className={`route-card route-${i}`}>
                  <div className="route-art">
                    <span><Car size={42} strokeWidth={1.5} /></span>
                    <p>{r.origin.toUpperCase()} → {r.destination.toUpperCase()}</p>
                  </div>
                  <div className="route-body">
                    <h3>{r.origin} <ArrowRight size={17} /> {r.destination}</h3>
                    {(() => {
                      const ratePerKm = Math.round(r.fixedPrice / Math.max(1, r.distance));
                      return (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0 10px', flexWrap: 'wrap' }}>
                            <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700 }}>
                              ₹{ratePerKm} / km
                            </span>
                            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                              {r.distance} km by road
                            </span>
                          </div>
                          <div className="section-title" style={{ marginTop: 'auto', paddingTop: 6, alignItems: 'flex-end' }}>
                            <div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                                All-Inclusive Fixed Fare
                              </div>
                              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                                {money(r.fixedPrice)}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>
                                ({r.distance} km × ₹{ratePerKm}/km)
                              </div>
                            </div>
                            <button
                              className="primary small"
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('choose-route', { detail: r }));
                                setActiveTab('book');
                                navigate('home');
                              }}
                            >
                              Book for {money(r.fixedPrice)}
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'download' && (
          <DownloadPage settings={config.data?.settings} onHome={() => navigate('home')} />
        )}

        {page === 'bookings' && (
          session.token ? (
            <MyBookings token={session.token} onOpen={(id) => { setSelectedId(id); setPage('detail'); }} />
          ) : (
            <div className="page narrow">
              <Auth onLogin={(t) => { session.login(t); setAuth(false); }} />
            </div>
          )
        )}

        {page === 'detail' && (
          <CustomerDetail id={selectedId} token={session.token} success={success} onBack={() => navigate('bookings')} />
        )}

        {page === 'profile' && (
          session.token ? (
            <Profile token={session.token} logout={() => { session.logout(); navigate('home'); }} />
          ) : (
            <div className="page narrow">
              <Auth onLogin={session.login} />
            </div>
          )
        )}
      </main>

      <footer>
        <div className="brand"><img className="brand-logo footer-brand-logo" src="/brand/dj-cabs-logo.png" alt="DJ Cabs" /></div>
        <p>Premium cab booking & outstation journeys across Karnataka and South India.</p>
        <div>
          <button onClick={() => navigate('home')}>Book on web</button>
          <button onClick={() => navigate('track')}>Track a ride</button>
          <button onClick={() => navigate('routes')}>Popular routes</button>
          <button onClick={() => navigate('download')}>Download APK</button>
          <a href={`tel:${config.data?.settings.phone || '+918047123456'}`}>Support</a>
          <a href="/admin" target="_blank" rel="noreferrer">
            Admin Portal <ExternalLink size={12} style={{ verticalAlign: 'middle' }} />
          </a>
        </div>
        <small>© {new Date().getFullYear()} Miles & Moments Travel Technologies Pvt Ltd · Kaup, Udupi, India</small>
      </footer>

      {auth && (
        <Modal title="Sign in with Email" onClose={() => setAuth(false)}>
          <Auth onLogin={(t) => { session.login(t); setAuth(false); }} />
        </Modal>
      )}
    </>
  );
}

function BookingWizard({
  token,
  onLogin,
  onLoginToken,
  routes,
  onBooked,
  entitySlug,
}: {
  token: string;
  onLogin: () => void;
  onLoginToken: (token: string) => void;
  routes: Route[];
  onBooked: (b: Booking) => void;
  entitySlug?: string;
}) {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [search, setSearch] = useState<Search>({
    pickup: '',
    drop: '',
    date: tomorrow,
    time: '09:00',
    tripType: 'ONE_WAY',
    returnDate: tomorrow,
    stops: [],
  });
  const [searchMode, setSearchMode] = useState<'route' | 'pickup'>('route');
  const [pickupOnlyResults, setPickupOnlyResults] = useState(false);
  const [preferredVehicleId, setPreferredVehicleId] = useState('');
  const [packageSelections, setPackageSelections] = useState<Record<string, string>>({});
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [extraHours, setExtraHours] = useState(0);
  const [step, setStep] = useState(0);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [directBooking, setDirectBooking] = useState(true);
  const [estimated, setEstimated] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [details, setDetails] = useState({
    name: '',
    phone: '',
    email: '',
    passengers: 2,
    luggage: 1,
    requests: '',
    paymentMethod: 'CASH' as const,
  });
  const [otpModal, setOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpHint, setOtpHint] = useState('');
  const [galleryModal, setGalleryModal] = useState<Quote | null>(null);
  const [reviewsModalVehicle, setReviewsModalVehicle] = useState<Quote | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((n) => n - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);
  const [distance, setDistance] = useState<number | null>(null);
  const [distanceError, setDistanceError] = useState('');
  const [calculating, setCalculating] = useState(false);
  const routeReady = Boolean(
    (searchMode === 'pickup' ? search.pickupPlaceId : (search.pickupPlaceId || search.pickup.trim().length >= 3)) &&
    (searchMode === 'pickup' || (
      (search.dropPlaceId || search.drop.trim().length >= 3) &&
      (search.tripType !== 'MULTI_CITY' || (search.stops.length > 0 && search.stops.every((s) => s.trim().length >= 3)))
    ))
  );
  const routeRequest = JSON.stringify(search);
  useEffect(() => {
    setDistance(null); setDistanceError(''); setCalculating(false); setQuotes([]); setQuote(null);
    if (!routeReady || searchMode === 'pickup') return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setCalculating(true);
      const req = JSON.parse(routeRequest);
      req.pickupPlaceId = req.pickupPlaceId || 'place_pk_' + encodeURIComponent(req.pickup.trim().toLowerCase()).slice(0, 20);
      req.dropPlaceId = req.dropPlaceId || 'place_dp_' + encodeURIComponent(req.drop.trim().toLowerCase()).slice(0, 20);
      apiClient<{ distance: number }>('/maps/distance', { method: 'POST', body: req, signal: controller.signal })
        .then(r => { if (!controller.signal.aborted) setDistance(r.distance); })
        .catch(e => { if (!controller.signal.aborted) setDistanceError(e.message); })
        .finally(() => { if (!controller.signal.aborted) setCalculating(false); });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [routeRequest, routeReady, searchMode]);
  const [key, setKey] = useState('');

  useEffect(() => {
    setKey(crypto.randomUUID());
    const handler = (e: Event) => {
      const r = (e as CustomEvent<Route>).detail;
      setSearch((s) => ({ ...s, pickup: r.origin, drop: r.destination, tripType: 'ONE_WAY', stops: [], pickupPlaceId: '', dropPlaceId: '', stopPlaceIds: [] }));
      setStep(0);
    };
    window.addEventListener('choose-route', handler);
    return () => window.removeEventListener('choose-route', handler);
  }, []);

  useEffect(() => {
    if (token) {
      api<Customer>('/customer/profile', { token })
        .then((c) => {
          const email = c.email?.trim().toLowerCase() || '';
          setVerifiedEmail(c.emailVerifiedAt ? email : '');
          setDetails((d) => ({ ...d, name: c.name || d.name, phone: c.phone || d.phone, email: c.email || d.email }));
        })
        .catch(() => {});
    }
  }, [token]);

  async function find(e: React.FormEvent) {
    e.preventDefault();
    if (!routeReady) { setError(searchMode === 'pickup' ? 'Please select a pickup location from the suggestions.' : 'Please enter or select pickup and destination locations.'); return; }
    setBusy(true);
    setError('');
    try {
      if (searchMode === 'pickup') {
        const params = new URLSearchParams({ pickup: search.pickup, pickupPlaceId: search.pickupPlaceId || '', date: search.date, time: search.time });
        if (entitySlug) params.set('entity', entitySlug);
        const result = await api<{ vehicles: Quote[]; directVehicleBooking: boolean }>(`/customer/vehicles/by-pickup?${params.toString()}`);
        setQuotes(result.vehicles);
        setDirectBooking(result.directVehicleBooking);
        setDistance(null);
        setPickupOnlyResults(true);
        setStep(1);
        return;
      }
      const pId = search.pickupPlaceId || 'place_pk_' + encodeURIComponent(search.pickup.trim().toLowerCase()).slice(0, 20);
      const dId = search.dropPlaceId || 'place_dp_' + encodeURIComponent(search.drop.trim().toLowerCase()).slice(0, 20);
      const params = new URLSearchParams({
        pickupPlaceId: pId,
        dropPlaceId: dId,
        pickup: search.pickup,
        drop: search.drop,
        date: search.date,
        time: search.time,
        tripType: search.tripType,
      });
      if (entitySlug) params.set('entity', entitySlug);
      if (search.tripType === 'ROUND_TRIP' && search.returnDate) params.set('returnDate', search.returnDate);
      if (search.tripType === 'MULTI_CITY') {
        const validStops = search.stops.map((s) => s.trim()).filter(Boolean);
        params.set('stops', JSON.stringify(validStops));
        params.set('stopPlaceIds', JSON.stringify(search.stopPlaceIds || []));
      }
      const r = await api<{ vehicles: Quote[]; estimated: boolean; distance: number; directVehicleBooking?: boolean }>(`/customer/vehicles/available?${params.toString()}`);
      setQuotes(r.vehicles);
      setQuote(r.vehicles.find((vehicle) => vehicle.id === preferredVehicleId) || null);
      if (preferredVehicleId && !r.vehicles.some((vehicle) => vehicle.id === preferredVehicleId)) {
        setError('That car is not available for this full route and time. Please choose another car.');
      }
      setPreferredVehicleId('');
      setPickupOnlyResults(false);
      setEstimated(r.estimated);
      setDistance(r.distance);
      if (typeof r.directVehicleBooking === 'boolean') {
        setDirectBooking(r.directVehicleBooking);
      }
      setStep(1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function executeBooking(authToken: string) {
    setBusy(true);
    setError('');
    try {
      const b = await api<Booking>('/customer/bookings', {
        method: 'POST',
        token: authToken,
        body: {
          ...search,
          pickupPlaceId: search.pickupPlaceId || undefined,
          dropPlaceId: search.dropPlaceId || undefined,
          stopPlaceIds: search.stopPlaceIds?.filter(Boolean).length ? search.stopPlaceIds : undefined,
          stops: search.tripType === 'MULTI_CITY' ? search.stops.filter((s) => s.trim().length > 0) : undefined,
          ...details,
          vehicleType: quote?.type,
          vehicleId: quote?.id,
          packageId: selectedPackageId || undefined,
          extraHours: selectedPackageId ? extraHours : undefined,
          idempotencyKey: key,
        },
      });
      setKey(crypto.randomUUID());
      setOtpModal(false);
      onBooked(b);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function book(e: React.FormEvent) {
    e.preventDefault();
    if (!details.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    const cleanPhone = details.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit contact number for your trip.');
      return;
    }
    const cleanEmail = details.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Enter a valid email address to receive your verification code.');
      return;
    }

    if (token && verifiedEmail === cleanEmail) {
      await executeBooking(token);
      return;
    }

    setBusy(true);
    setError('');
    try {
      const otpRes = await api<{ message?: string; code?: string; mockCode?: string; retryAfterSeconds?: number }>(
        '/auth/customer/send-otp',
        {
          method: 'POST',
          body: {
            email: cleanEmail,
          },
        }
      );
      setOtpCountdown(otpRes.retryAfterSeconds || 30);
      const codeHint = otpRes.code || otpRes.mockCode;
      setOtpHint(
        codeHint
          ? `Verification code: ${codeHint}`
          : `We sent a 6-digit verification code to ${cleanEmail}.`
      );
      setOtpCode(codeHint || '');
      setOtpError('');
      setOtpModal(true);
    } catch (err) {
      setError((err as Error).message || 'Failed to send verification code. Please check your email address.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyAndBook(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setOtpError('Please enter a valid 6-digit verification code.');
      return;
    }
    setOtpBusy(true);
    setOtpError('');
    try {
      const authRes = await api<{ token: string; customer: any }>('/auth/customer/verify-otp', {
        method: 'POST',
        body: {
          email: details.email.trim().toLowerCase(),
          code: otpCode.trim(),
        },
      });
      setVerifiedEmail(details.email.trim().toLowerCase());
      onLoginToken(authRes.token);
      await executeBooking(authRes.token);
    } catch (err) {
      setOtpError((err as Error).message || 'Invalid or expired code. Please try again.');
    } finally {
      setOtpBusy(false);
    }
  }

  async function resendOtp() {
    setOtpBusy(true);
    setOtpError('');
    try {
      const cleanEmail = details.email.trim().toLowerCase();
      const otpRes = await api<{ message?: string; code?: string; mockCode?: string; retryAfterSeconds?: number }>(
        '/auth/customer/send-otp',
        {
          method: 'POST',
          body: {
            email: cleanEmail,
          },
        }
      );
      setOtpCountdown(otpRes.retryAfterSeconds || 30);
      const codeHint = otpRes.code || otpRes.mockCode;
      setOtpHint(
        codeHint
          ? `New verification code: ${codeHint}`
          : `We resent the verification code to ${cleanEmail}.`
      );
      if (codeHint) setOtpCode(codeHint);
    } catch (err) {
      setOtpError((err as Error).message || 'Failed to resend code.');
    } finally {
      setOtpBusy(false);
    }
  }

  return (
    <>
      <div className="section-title">
        <h2>{step === 0 ? (searchMode === 'pickup' ? 'Find cars near your pickup.' : 'Where would you like to travel?') : step === 1 ? 'Select your preferred vehicle.' : 'Enter passenger details.'}</h2>
        <span className="muted">{step + 1} of 3 · Search → Fleet → Confirm</span>
      </div>
      {error && <ErrorBox message={error} />}
      <div className="steps">
        <span className={step === 0 ? 'current' : ''}>01 Route & Schedule</span>
        <span className={step === 1 ? 'current' : ''}>02 Vehicle Choice</span>
        <span className={step === 2 ? 'current' : ''}>03 Passenger Details</span>
      </div>

      {step === 0 && (
        <form onSubmit={find}>
          <div className="segmented search-mode-switch" aria-label="Vehicle search type">
            <button type="button" className={searchMode === 'route' ? 'selected' : ''} onClick={() => { setSearchMode('route'); setPickupOnlyResults(false); setQuotes([]); }}>
              Book a trip
            </button>
            <button type="button" className={searchMode === 'pickup' ? 'selected' : ''} onClick={() => { setSearchMode('pickup'); setPickupOnlyResults(false); setQuotes([]); }}>
              Find cars by pickup
            </button>
          </div>
          {searchMode === 'pickup' && <p className="muted pickup-search-hint">Choose a pickup point and time to see available cars and nearby chauffeurs. Add a destination later to book.</p>}
          {searchMode === 'route' && <>
          <div className="segmented">
            {(['ONE_WAY', 'ROUND_TRIP', 'MULTI_CITY'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={search.tripType === t ? 'selected' : ''}
                onClick={() => {
                  setSearch({
                    ...search,
                    tripType: t,
                    stops: t === 'MULTI_CITY' ? (search.stops.length ? search.stops : ['']) : [],
                  });
                }}
              >
                {t === 'ONE_WAY' ? 'One way' : t === 'ROUND_TRIP' ? 'Round trip' : 'Multi-city'}
              </button>
            ))}
          </div>
          </>}

          <div className="search-grid">
            <label>
              <span><MapPin size={15} /> Pickup location</span>
              <LocationInput value={search.pickup} placeId={search.pickupPlaceId} placeholder="Search pickup address or paste Google Maps link"
                onChange={(value, placeId) => setSearch({ ...search, pickup: value, pickupPlaceId: placeId })} />
            </label>

            {searchMode === 'route' && <label>
              <span><MapPin size={15} /> Destination</span>
              <LocationInput value={search.drop} placeId={search.dropPlaceId} placeholder="Search destination address or paste Google Maps link"
                onChange={(value, placeId) => setSearch({ ...search, drop: value, dropPlaceId: placeId })} />
            </label>}

            <label>
              Departure date
              <input
                required
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={search.date}
                onChange={(e) => setSearch({ ...search, date: e.target.value })}
              />
            </label>

            <label>
              Pickup time
              <input
                required
                type="time"
                value={search.time}
                onChange={(e) => setSearch({ ...search, time: e.target.value })}
              />
            </label>

            {searchMode === 'route' && search.tripType === 'ROUND_TRIP' && (
              <label>
                Return date
                <input
                  type="date"
                  required
                  min={search.date}
                  value={search.returnDate}
                  onChange={(e) => setSearch({ ...search, returnDate: e.target.value })}
                />
              </label>
            )}

            <button className="primary" disabled={busy || !routeReady || (calculating && searchMode === 'route')}>
              {busy ? 'Searching available cars…' : searchMode === 'pickup' ? 'Search cars at pickup' : 'Find rides'} <ArrowRight size={18} />
            </button>
          </div>

          {searchMode === 'route' && search.tripType === 'MULTI_CITY' && (
            <div className="multi-city-stops">
              <p className="eyebrow">INTERMEDIATE STOPS</p>
              {search.stops.map((stop, i) => (
                <div key={i} className="stop-input-row">
                  <label>
                    <span><MapPin size={15} /> Stop {i + 1}</span>
                    <LocationInput value={stop} placeId={search.stopPlaceIds?.[i]} placeholder={`Search stop ${i + 1} or paste Google Maps link`}
                      onChange={(value, placeId) => { const stops = [...search.stops]; const ids = [...(search.stopPlaceIds || [])]; stops[i] = value; ids[i] = placeId; setSearch({...search, stops, stopPlaceIds: ids}); }} />
                  </label>
                  {search.stops.length > 1 && (
                    <button
                      type="button"
                      className="text-button remove-stop"
                      onClick={() => setSearch({ ...search, stops: search.stops.filter((_, n) => n !== i), stopPlaceIds: search.stopPlaceIds?.filter((_, n) => n !== i) })}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {search.stops.length < 5 && (
                <button
                  type="button"
                  className="secondary small add-stop-btn"
                  onClick={() => setSearch({ ...search, stops: [...search.stops, ''], stopPlaceIds: [...(search.stopPlaceIds || []), ''] })}
                >
                  + Add intermediate stop
                </button>
              )}
            </div>
          )}

          {searchMode === 'route' && <div className="route-distance" role="status">
            {calculating ? 'Calculating driving distance…' : distanceError || (distance !== null ? `${distance} km by road${search.tripType === 'ROUND_TRIP' ? ' · includes return journey' : ''}` : 'Select locations from the suggestions to calculate driving distance.')}
            {distance !== null && <span className="google-attribution" translate="no">Google Maps</span>}
          </div>}
          <div className="booking-footnote">
            <ShieldCheck size={14} /> Verified commercial chauffeurs • Sanitized air-conditioned fleet • 24/7 journey support
          </div>
        </form>
      )}

      {step === 1 && (
        <>
          {pickupOnlyResults ? <p className="notice">Cars serving {search.pickup} on {search.date} at {search.time}. Fare is shown after you add a destination.</p> : <p className="notice">{distance} km by road{search.tripType === 'ROUND_TRIP' ? ' · includes return journey' : ''}</p>}
          {(() => {
            const pNorm = (search.pickup || '').trim().toLowerCase();
            const dNorm = (search.drop || '').trim().toLowerCase();
            const matchedRoute = (routes || []).find(
              (r) => r.active &&
                (r.origin.toLowerCase() === pNorm || pNorm.includes(r.origin.toLowerCase())) &&
                (r.destination.toLowerCase() === dNorm || dNorm.includes(r.destination.toLowerCase()))
            );
            if (!matchedRoute) return null;
            const ratePerKm = Math.round(matchedRoute.fixedPrice / Math.max(1, matchedRoute.distance));
            return (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px', margin: '10px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#166534', fontWeight: 700, fontSize: '0.92rem' }}>
                    <Star size={16} fill="#16a34a" color="#16a34a" /> Popular Familiar Route: {matchedRoute.origin} → {matchedRoute.destination}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#15803d', marginTop: 3 }}>
                    Calculated at <strong>₹{ratePerKm}/km</strong> for {matchedRoute.distance} km = <strong>{money(matchedRoute.fixedPrice)}</strong> all-inclusive fixed fare for Sedan.
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534' }}>
                    {money(matchedRoute.fixedPrice)}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 600 }}>
                    ({matchedRoute.distance} km × ₹{ratePerKm}/km)
                  </div>
                </div>
              </div>
            );
          })()}
          <button className="text-button" onClick={() => setStep(0)}>
            <ChevronLeft size={16} /> {pickupOnlyResults ? 'Edit pickup & time' : 'Edit trip route & time'}
          </button>
          {!pickupOnlyResults && <p className="muted">
            {search.pickup} {search.stops.length > 0 ? `via ${search.stops.filter(Boolean).join(' → ')} ` : ''}→ {search.drop} · {search.date} at {search.time}
          </p>}
          <div className="grid-three">
            {quotes.map((v) => (
              <div
                key={v.id}
                className={`vehicle-card ${quote?.id === v.id ? 'selected' : ''}`}
                style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', textAlign: 'left' }}
              >
                <div style={{ position: 'relative', height: 160, width: '100%', background: '#0f172a' }}>
                  {v.images && v.images.length > 0 ? (
                    <img
                      src={v.images[0]}
                      alt={v.model}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#94a3b8' }}>
                      <Car size={56} strokeWidth={1.2} />
                    </div>
                  )}
                  {v.images && v.images.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGalleryModal(v);
                        setActivePhotoIdx(0);
                      }}
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        background: 'rgba(15,23,42,0.85)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.3)',
                        padding: '4px 10px',
                        borderRadius: 14,
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Camera size={13} /> {v.images.length} Photos
                    </button>
                  )}
                </div>

                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div className="section-title">
                    <h3>{directBooking ? v.model : v.type}</h3>
                    <Badge value="Available" />
                  </div>
                  <p className="muted">
                    {directBooking ? `${v.type}${v.number ? ` · Reg: ${v.number}` : ''}` : `${v.model} or verified equivalent`}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 10px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700 }}>
                      <Star size={13} fill="#f59e0b" color="#f59e0b" /> {(v.rating ?? 5.0).toFixed(1)}
                    </span>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#1d5f59', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline', padding: 0, fontWeight: 600 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setReviewsModalVehicle(v);
                      }}
                    >
                      {v.reviewCount ? `${v.reviewCount} verified ${v.reviewCount === 1 ? 'review' : 'reviews'}` : 'View reviews'}
                    </button>
                  </div>
                  <div className="vehicle-features">
                    <span><Users size={15} /> {v.capacity} passenger seats</span>
                    <span><Wind size={15} /> {v.ac ? 'Climate Controlled AC' : 'Non-AC'}</span>
                    <span><Luggage size={15} /> Luggage boot</span>
                    {directBooking && v.driverName && (
                      <div style={{ color: '#047857', fontWeight: 600, display: 'grid', gap: 3 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={14} /> Chauffeur: {v.driverName}</span>
                        <small style={{ color: '#64748b', fontWeight: 500 }}>★ {v.driverRating || 5} · {v.driverTrips || 0} completed trips{v.driverBaseLocation ? ` · Based in ${v.driverBaseLocation}` : ''}</small>
                      </div>
                    )}
                  </div>
                  {v.packages && v.packages.length > 0 && <div className="vehicle-packages">
                    <p className="eyebrow">BOOKING PACKAGES</p>
                    {v.packages.map((pkg) => <button key={pkg.id} type="button" className={`package-option ${packageSelections[v.id] === pkg.id ? 'selected' : ''}`} onClick={() => setPackageSelections({ ...packageSelections, [v.id]: pkg.id })}>
                      <strong>{pkg.name}</strong><span>{pkg.includedHours} hr · {pkg.includedKm} km</span><b>{money(pkg.estimatedFare ?? pkg.price)}</b>
                      <small>Extra km {money(pkg.extraKmRate)}/km · extra hour {money(pkg.extraHourRate)}/hr{pkg.tollsParkingExtra ? ' · tolls & parking extra' : ''}</small>
                    </button>)}
                  </div>}
                  <div className="section-title" style={{ marginTop: 'auto', paddingTop: 12 }}>
                    <button
                      type="button"
                      className="primary small"
                      style={{ width: '100%', justifyContent: 'center' }}
                      disabled={!pickupOnlyResults && Boolean(v.packages?.length) && !packageSelections[v.id]}
                      onClick={() => {
                        if (pickupOnlyResults) {
                          setPreferredVehicleId(v.id);
                          setSelectedPackageId(packageSelections[v.id] || v.packages?.[0]?.id || '');
                          setSearch((current) => ({ ...current, drop: '', dropPlaceId: '', tripType: 'ONE_WAY', stops: [], stopPlaceIds: [] }));
                          setSearchMode('route');
                          setPickupOnlyResults(false);
                          setQuotes([]);
                          setStep(0);
                        } else {
                          setQuote(v);
                          setSelectedPackageId(packageSelections[v.id] || '');
                          setExtraHours(0);
                          setStep(2);
                        }
                      }}
                    >
                      {pickupOnlyResults ? 'Use this car' : v.packages?.length && !packageSelections[v.id] ? 'Choose a package' : 'Select ride'} <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {quotes.length === 0 && (
            <Empty title="No vehicles available for the requested time.">
              <p>No available driver is based within their service radius of this pickup. Try another pickup location or date, or contact dispatch.</p>
              <button className="primary" onClick={() => setStep(0)}>
                Change search
              </button>
            </Empty>
          )}

          {galleryModal && (
            <Modal title={`${galleryModal.model} (${galleryModal.images?.length || 0} Photos)`} onClose={() => setGalleryModal(null)}>
              <div style={{ textAlign: 'center' }}>
                {galleryModal.images && galleryModal.images.length > 0 && (
                  <>
                    <div style={{ height: 320, width: '100%', background: '#0f172a', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                      <img
                        src={galleryModal.images[activePhotoIdx]}
                        alt={`Vehicle photo ${activePhotoIdx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', overflowX: 'auto', paddingBottom: 8 }}>
                      {galleryModal.images.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActivePhotoIdx(i)}
                          style={{
                            padding: 0,
                            border: i === activePhotoIdx ? '2px solid #2563eb' : '2px solid transparent',
                            borderRadius: 6,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            width: 64,
                            height: 48,
                            background: '#0f172a',
                            flexShrink: 0,
                          }}
                        >
                          <img src={img} alt={`Thumb ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="muted" style={{ fontSize: '0.86rem' }}>
                        Photo {activePhotoIdx + 1} of {galleryModal.images.length}
                      </span>
                      <button
                        type="button"
                        className="primary"
                        onClick={() => {
                          setQuote(galleryModal);
                          setGalleryModal(null);
                          setStep(2);
                        }}
                      >
                        Select this Vehicle <ArrowRight size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </Modal>
          )}

          {reviewsModalVehicle && (
            <VehicleReviewsModal vehicle={reviewsModalVehicle} onClose={() => setReviewsModalVehicle(null)} />
          )}
        </>
      )}

      {step === 2 && quote && (
        <form onSubmit={book}>
          {(() => {
            const pkg = quote.packages?.find((item) => item.id === selectedPackageId);
            return pkg ? <div className="package-booking-summary">
              <strong>{pkg.name}: {pkg.includedHours} hours · {pkg.includedKm} km</strong>
              <span>Package {money(pkg.estimatedFare ?? pkg.price)}{distance && distance > pkg.includedKm ? ` · ${distance - pkg.includedKm} extra km` : ''}</span>
              <span>Extra km {money(pkg.extraKmRate)}/km · extra hour {money(pkg.extraHourRate)}/hour · tolls and parking extra</span>
              <label>Additional hours requested (optional)<input type="number" min={0} max={48} value={extraHours} onChange={(e) => setExtraHours(Number(e.target.value))} /></label>
              <strong>Estimated total: {money((pkg.estimatedFare ?? pkg.price) + extraHours * pkg.extraHourRate)}</strong>
            </div> : null;
          })()}
          <button type="button" className="text-button" onClick={() => setStep(1)}>
            <ChevronLeft size={16} /> Choose a different vehicle
          </button>
          <div className="booking-details-grid">
            <div className="form-grid">
              <label>
                Full Name
                <input required minLength={2} value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
              </label>
              <label>
                Contact Phone Number
                <input required pattern="[6-9][0-9]{9}" type="tel" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} />
              </label>
              <label>
                Email Address (verification code & trip updates)
                <input required type="email" readOnly={Boolean(token && verifiedEmail && verifiedEmail === details.email.trim().toLowerCase())} value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
              </label>
              <label>
                Passenger Count
                <input required type="number" min={1} max={quote.capacity} value={details.passengers} onChange={(e) => setDetails({ ...details, passengers: Number(e.target.value) })} />
              </label>
              <label>
                Luggage Pieces
                <input required type="number" min={0} max={20} value={details.luggage} onChange={(e) => setDetails({ ...details, luggage: Number(e.target.value) })} />
              </label>
              <label>
                Special Pickup Requests (optional)
                <textarea maxLength={500} value={details.requests} onChange={(e) => setDetails({ ...details, requests: e.target.value })} placeholder="Flight/Train number, terminal pickup, child seat…" />
              </label>
            </div>
            <aside className="fare-summary">
              <p className="eyebrow">TRIP SUMMARY</p>
              <h3>
                {search.pickup} {search.stops.length > 0 ? `via ${search.stops.filter(Boolean).join(', ')} ` : ''}→ {search.drop}
              </h3>
              <p>{search.date} · {search.time}</p>
              {distance && <p>{distance} km by road {search.tripType === 'ROUND_TRIP' ? '· includes return journey' : ''}</p>}
              {(() => {
                const pNorm = (search.pickup || '').trim().toLowerCase();
                const dNorm = (search.drop || '').trim().toLowerCase();
                const matchedRoute = (routes || []).find(
                  (r) => r.active &&
                    (r.origin.toLowerCase() === pNorm || pNorm.includes(r.origin.toLowerCase())) &&
                    (r.destination.toLowerCase() === dNorm || dNorm.includes(r.destination.toLowerCase()))
                );
                if (!matchedRoute) return null;
                const ratePerKm = Math.round(matchedRoute.fixedPrice / Math.max(1, matchedRoute.distance));
                return (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', margin: '8px 0', fontSize: '0.84rem', color: '#166534' }}>
                    ✓ <strong>Familiar Route Rate:</strong> {matchedRoute.distance} km × ₹{ratePerKm}/km = <strong>{money(matchedRoute.fixedPrice)}</strong>
                  </div>
                );
              })()}
              <p>{directBooking ? `${quote.model}${quote.number ? ` (${quote.number})` : ''} · ${quote.type}` : `${quote.type} (${quote.model})`} · {details.passengers} passenger(s)</p>
              <hr />
              <p className="notice">Instant reservation confirmation. Chauffeur and vehicle details will be dispatched prior to pickup.</p>
              <button className="primary full" disabled={busy}>
                {busy ? 'Securing reservation…' : 'Confirm Booking'} <ArrowRight size={17} />
              </button>
            </aside>
          </div>
        </form>
      )}

      {otpModal && (
        <Modal title="Verify email & confirm booking" onClose={() => setOtpModal(false)}>
          <form onSubmit={verifyAndBook}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}>
                <ShieldCheck size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: 17 }}>Email Verification</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                We sent a sign-in code to <strong>{details.email}</strong>. Verify it to confirm your reservation.
              </p>
            </div>

            {otpError && <ErrorBox message={otpError} />}
            {otpHint && (
              <p className="notice" style={{ fontSize: 13, textAlign: 'center', marginBottom: 14 }}>
                {otpHint}
              </p>
            )}

            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Enter 6-Digit Verification Code
              </span>
              <input
                required
                autoFocus
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                style={{
                  fontSize: 22,
                  letterSpacing: 6,
                  textAlign: 'center',
                  fontWeight: 700,
                  padding: '12px 16px',
                }}
              />
            </label>

            <button type="submit" className="primary full" disabled={otpBusy || busy || otpCode.length !== 6}>
              {otpBusy || busy ? 'Verifying & Confirming…' : 'Verify & Confirm Booking'} <ArrowRight size={17} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <button
                type="button"
                className="text-button"
                disabled={otpBusy || otpCountdown > 0}
                onClick={resendOtp}
                style={{ fontSize: 13 }}
              >
                {otpCountdown > 0 ? `Resend code in ${otpCountdown}s` : 'Resend code'}
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => setOtpModal(false)}
                style={{ fontSize: 13, color: 'var(--muted)' }}
              >
                Change email address
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function TrackTripInline({ onOpenBooking }: { onOpenBooking: (id: string) => void }) {
  const [bookingNumber, setBookingNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trip, setTrip] = useState<DetailBooking | null>(null);

  useEffect(() => {
    if (!trip || ['COMPLETED', 'CANCELLED'].includes(trip.status)) return;
    const interval = setInterval(async () => {
      try {
        const res = await api<DetailBooking>(`/public/track?bookingNumber=${encodeURIComponent(bookingNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`);
        setTrip(res);
      } catch {}
    }, 6000);
    return () => clearInterval(interval);
  }, [trip?.status, bookingNumber, phone]);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTrip(null);
    try {
      const res = await api<DetailBooking>(`/public/track?bookingNumber=${encodeURIComponent(bookingNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`);
      setTrip(res);
    } catch (err) {
      setError((err as Error).message || 'No booking found. Please check your Booking Reference and phone number.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '10px 0' }}>
      <div className="track-hero">
        <p className="eyebrow">REAL-TIME JOURNEY DISPATCH STATUS</p>
        <h2>Track your booking instantly</h2>
        <p className="muted">Enter your Booking Reference (e.g. TRV-1024) and registered 10-digit mobile number.</p>
      </div>

      <form onSubmit={handleTrack} className="track-form-grid">
        <label style={{ margin: 0 }}>
          <span>Booking Reference</span>
          <input
            required
            placeholder="e.g. TRV-1024"
            value={bookingNumber}
            onChange={(e) => setBookingNumber(e.target.value)}
          />
        </label>
        <label style={{ margin: 0 }}>
          <span>Registered Mobile Number</span>
          <input
            required
            type="tel"
            pattern="[0-9]{10}"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <button className="primary" disabled={loading} style={{ height: 45 }}>
          {loading ? 'Searching…' : 'Track Ride'} <SearchIcon size={16} />
        </button>
      </form>

      {error && <ErrorBox message={error} />}

      {trip && (
        <div className="card" style={{ padding: 24, marginTop: 24, background: '#f8fafc', borderColor: '#cbd5e1' }}>
          <div className="track-result-header">
            <div>
              <span className="eyebrow">BOOKING REF #{trip.bookingNumber}</span>
              <h3 style={{ margin: '4px 0', fontSize: 20 }}>{trip.pickup} → {trip.drop}</h3>
              <p className="muted" style={{ margin: 0 }}>{trip.date} at {trip.time} · {trip.vehicleType}</p>
            </div>
            <Badge value={trip.status} />
          </div>

          {trip.status === 'TRIP_STARTED' && (
            <div style={{ background: '#ecfdf5', border: '1.5px solid #34d399', borderRadius: 12, padding: '14px 16px', margin: '14px 0', color: '#065f46' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 0 3px #a7f3d0' }} />
                Ride in progress <span aria-hidden="true">·</span> Chauffeur en route
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#047857' }}>
                Your chauffeur {trip.driver?.name} has started the trip towards <strong>{trip.drop}</strong>. Settle the fare directly with the driver after drop-off.
              </p>
            </div>
          )}

          {trip.status === 'COMPLETED' && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '14px 16px', margin: '14px 0', color: '#166534' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
                <Check size={18} /> Trip completed <span aria-hidden="true">·</span> Safely dropped off
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#15803d' }}>
                You have arrived at your destination. Thank you for traveling with DJ Cabs!
              </p>
            </div>
          )}

          {trip.driverLocation && trip.status === 'TRIP_STARTED' && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', margin: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: '#1e40af' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={16} style={{ color: '#2563eb' }} />
                <span>Chauffeur live GPS updating • Last seen {new Date(trip.driverLocation.updatedAt).toLocaleTimeString()}</span>
              </div>
              <a
                href={`https://www.google.com/maps?q=${trip.driverLocation.lat},${trip.driverLocation.lng}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}
              >
                View on Map →
              </a>
            </div>
          )}

          {trip.driver ? (
            <div className="driver-dispatch-box">
              <div className="driver-dispatch-avatar">
                {trip.driver.name[0]}
              </div>
              <div>
                <strong style={{ fontSize: 16 }}>{trip.driver.name}</strong>
                <p style={{ margin: '2px 0', color: '#166534', fontWeight: 600 }}>
                  Assigned Driver · ★ {trip.driver.rating} ({trip.driver.trips} trips)
                </p>
                <small style={{ color: 'var(--muted)' }}>
                  Vehicle: {trip.vehicle?.model} ({trip.vehicle?.number})
                </small>
              </div>
              <div className="driver-dispatch-actions">
                <a className="primary small" href={`tel:${trip.driver.phone}`}>
                  <Phone size={14} /> Call Chauffeur
                </a>
                <a
                  className="secondary small"
                  href={`https://wa.me/91${trip.driver.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${trip.driver.name}, I am following up on booking #${trip.bookingNumber} (${trip.pickup} to ${trip.drop}).`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: 16, borderRadius: 10, margin: '16px 0' }}>
              <strong style={{ color: '#92400e', display: 'block' }}>Chauffeur Assignment in Progress</strong>
              <small style={{ color: '#b45309' }}>
                Our 24/7 dispatch team is assigning an experienced driver for your {trip.vehicleType}. You will receive a WhatsApp notification shortly.
              </small>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 18, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
            <button className="primary small" onClick={() => onOpenBooking(trip.id)}>
              View Full Trip Summary & Invoice <ArrowRight size={14} />
            </button>
            <a
              className="secondary small"
              href={`https://wa.me/?text=${encodeURIComponent(`Track my trip #${trip.bookingNumber}: ${trip.pickup} to ${trip.drop} on ${trip.date} at ${trip.time}. Status: ${trip.status}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              Share via WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function TrackTripPage({ onOpenBooking }: { onOpenBooking: (id: string) => void }) {
  return (
    <div className="track-card">
      <TrackTripInline onOpenBooking={onOpenBooking} />
    </div>
  );
}

function MyBookings({ token, onOpen }: { token: string; onOpen: (id: string) => void }) {
  const r = useResource<Booking[]>('/customer/bookings', token);
  const [tab, setTab] = useState('Upcoming');

  return (
    <div className="page">
      <p className="eyebrow">YOUR JOURNEY DASHBOARD</p>
      <h1>My Bookings</h1>
      <div className="segmented">
        {['Upcoming', 'Completed', 'Cancelled'].map((t) => (
          <button key={t} className={tab === t ? 'selected' : ''} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      {r.loading ? (
        <Loading />
      ) : r.error ? (
        <ErrorBox message={r.error} retry={r.reload} />
      ) : (
        <div className="grid-two">
          {r.data
            ?.filter((b) =>
              tab === 'Completed'
                ? b.status === 'COMPLETED'
                : tab === 'Cancelled'
                ? b.status === 'CANCELLED'
                : !['COMPLETED', 'CANCELLED'].includes(b.status)
            )
            .map((b) => (
              <BookingCard key={b.id} booking={b} onClick={() => onOpen(b.id)} />
            ))}
        </div>
      )}
      {!r.loading &&
        r.data?.filter((b) =>
          tab === 'Completed'
            ? b.status === 'COMPLETED'
            : tab === 'Cancelled'
            ? b.status === 'CANCELLED'
            : !['COMPLETED', 'CANCELLED'].includes(b.status)
        ).length === 0 && (
          <Empty title={`No ${tab.toLowerCase()} journeys`}>
            <p>Your confirmed and historical bookings will appear here.</p>
          </Empty>
        )}
    </div>
  );
}

function VehicleReviewsModal({ vehicle, onClose }: { vehicle: Quote; onClose: () => void }) {
  const r = useResource<VehicleFeedbackSummary>(`/customer/vehicles/${vehicle.id}/feedback`);

  return (
    <Modal title={`${vehicle.model} — Reviews & Ratings`} onClose={onClose}>
      {r.loading ? (
        <Loading />
      ) : r.error ? (
        <ErrorBox message={r.error} retry={r.reload} />
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#f8fafc', padding: '16px 20px', borderRadius: 12, marginBottom: 18, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
              {(r.data?.averageRating ?? 5.0).toFixed(1)}
            </div>
            <div>
              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    fill={star <= Math.round(r.data?.averageRating ?? 5) ? '#f59e0b' : 'none'}
                    color={star <= Math.round(r.data?.averageRating ?? 5) ? '#f59e0b' : '#cbd5e1'}
                  />
                ))}
              </div>
              <div style={{ fontSize: '0.86rem', color: '#64748b', marginTop: 4, fontWeight: 500 }}>
                Based on {r.data?.reviewCount ?? 0} verified customer {r.data?.reviewCount === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </div>

          {!r.data?.reviews || r.data.reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: '#64748b' }}>
              <p style={{ fontWeight: 600, fontSize: '1rem', color: '#0f172a', marginBottom: 4 }}>No reviews published yet</p>
              <p style={{ fontSize: '0.88rem' }}>This vehicle maintains high quality standards. Customer feedback will appear here once approved by our moderation team.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
              {r.data.reviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 14,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{rev.customerName}</strong>
                      <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.7rem', padding: '1px 6px' }}>Verified Rider</span>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          fill={star <= rev.rating ? '#f59e0b' : 'none'}
                          color={star <= rev.rating ? '#f59e0b' : '#cbd5e1'}
                        />
                      ))}
                    </div>
                  </div>
                  <p style={{ margin: '4px 0 6px', fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                    "{rev.message}"
                  </p>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function CustomerFeedbackCard({ booking, token }: { booking: DetailBooking; token: string }) {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 3) {
      setError('Please provide feedback message of at least 3 characters.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/customer/feedback', {
        token,
        method: 'POST',
        body: {
          vehicleId: booking.vehicleId,
          bookingId: booking.id,
          rating,
          message: message.trim(),
        },
      });
      setSubmitted(true);
    } catch (err) {
      setError((err as Error).message || 'Failed to submit feedback.');
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <section className="card detail-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
            <Check size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#15803d' }}>Thank you for your rating!</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#166534' }}>
              Your {rating}-star rating and feedback for <strong>{booking.vehicle?.model || booking.vehicleType}</strong> has been submitted. It will be displayed publicly after admin approval.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="card detail-card" style={{ marginTop: 14 }}>
      <div className="section-title">
        <div>
          <h3 style={{ fontSize: '1.1rem', color: '#0f172a' }}>Rate Your Trip & Vehicle</h3>
          <p className="muted" style={{ fontSize: '0.88rem', margin: '4px 0 0' }}>
            Share your feedback about the {booking.vehicle?.model || booking.vehicleType} and chauffeur service.
          </p>
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
            Overall Rating
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
                onClick={() => setRating(star)}
              >
                <Star
                  size={28}
                  fill={star <= rating ? '#f59e0b' : 'none'}
                  color={star <= rating ? '#f59e0b' : '#cbd5e1'}
                />
              </button>
            ))}
            <strong style={{ marginLeft: 8, color: '#b45309', fontSize: '0.98rem' }}>
              {rating === 5 ? 'Excellent (5.0)' : rating === 4 ? 'Very Good (4.0)' : rating === 3 ? 'Good (3.0)' : rating === 2 ? 'Fair (2.0)' : 'Poor (1.0)'}
            </strong>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
            Your Feedback
          </label>
          <textarea
            required
            rows={3}
            placeholder="Tell us about vehicle cleanliness, ride comfort, or chauffeur punctuality…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              width: '100%',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              padding: '10px 12px',
              fontSize: '0.92rem',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button type="submit" disabled={busy} className="primary small" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={15} /> {busy ? 'Submitting…' : 'Submit Review for Approval'}
        </button>
      </form>
    </section>
  );
}

function CustomerDetail({
  id,
  token,
  success,
  onBack,
}: {
  id: string;
  token: string;
  success: boolean;
  onBack: () => void;
}) {
  const r = useResource<DetailBooking>(`/customer/bookings/${id}`, token);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setInterval(r.reload, 12000);
    return () => clearInterval(t);
  }, [id]);

  if (r.loading && !r.data) return <Loading />;
  if (r.error) return <ErrorBox message={r.error} retry={r.reload} />;
  const b = r.data;
  if (!b) return null;

  return (
    <div className="page narrow">
      <button className="text-button" onClick={onBack}>
        <ChevronLeft size={16} /> Return to bookings
      </button>
      {success && (
        <div className="success-banner">
          <Check />
          <h2>Booking Confirmed!</h2>
          <p>
            Your journey reference is <strong>#{b.bookingNumber}</strong>. We have dispatched this to our driver fleet.
          </p>
        </div>
      )}
      <section className="card detail-card">
        <BookingInfo b={b} />
        {error && <ErrorBox message={error} />}
        <div className="actions">
          <a
            className="secondary"
            href={`https://wa.me/?text=${encodeURIComponent(`DJ Cabs Journey #${b.bookingNumber}: ${b.pickup} → ${b.drop} on ${b.date} at ${b.time}. Vehicle: ${b.vehicleType}`)}`}
            target="_blank"
            rel="noreferrer"
          >
            Share on WhatsApp
          </a>
          <a
            className="secondary"
            href={`sms:?body=${encodeURIComponent(`Booking #${b.bookingNumber}: ${b.pickup} to ${b.drop}, ${b.date} ${b.time}`)}`}
          >
            Share by SMS
          </a>
          {['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED'].includes(b.status) && (
            <button className="danger-button" onClick={() => setConfirm(true)}>
              Cancel booking
            </button>
          )}
        </div>
      </section>

      {b.status === 'COMPLETED' && (
        <CustomerFeedbackCard booking={b} token={token} />
      )}
      {confirm && (
        <Modal title="Cancel this reservation?" onClose={() => setConfirm(false)}>
          <p>
            Your reservation #{b.bookingNumber} will be cancelled in the dispatch system. No advance payment is required for new bookings. Contact support about any historical payment.
          </p>
          <div className="actions">
            <button className="secondary" onClick={() => setConfirm(false)}>
              Keep journey
            </button>
            <button
              className="danger-button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api(`/customer/bookings/${id}/cancel`, { token, method: 'POST' });
                  setConfirm(false);
                  r.reload();
                } catch (e) {
                  setError((e as Error).message);
                  setConfirm(false);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? 'Processing cancellation…' : 'Confirm Cancellation'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Profile({ token, logout }: { token: string; logout: () => void }) {
  const r = useResource<Customer>('/customer/profile', token);
  const [profile, setProfile] = useState<Customer | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (r.data) setProfile(r.data);
  }, [r.data]);

  if (!profile) return r.error ? <ErrorBox message={r.error} retry={r.reload} /> : <Loading />;

  return (
    <div className="page narrow">
      <p className="eyebrow">YOUR ACCOUNT PREFERENCES</p>
      <h1>Customer Profile</h1>
      <form
        className="card detail-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          try {
            await api('/customer/profile', { method: 'PUT', token, body: profile });
            setMessage('Profile updated successfully.');
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        {error && <ErrorBox message={error} />}
        <div className="form-grid">
          <label>
            Full Name
            <input required minLength={2} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </label>
          <label>
            Contact Mobile Number
            <input type="tel" pattern="[6-9][0-9]{9}" value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})} />
          </label>
          <label>
            Email Address (Verified)
            <input type="email" value={profile.email || ''} readOnly />
          </label>
          <label>
            Preferred Communication Language
            <select value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })}>
              {['English', 'Kannada', 'Hindi'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
        <h3>Saved Travel Locations</h3>
        {profile.addresses.map((a, i) => (
          <div className="address-row" key={a.id}>
            <select
              aria-label="Address label"
              value={a.label}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  addresses: profile.addresses.map((v, n) => (n === i ? { ...v, label: e.target.value } : v)),
                })
              }
            >
              {['Home', 'Work', 'Other'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <input
              required
              minLength={3}
              aria-label="Address"
              value={a.address}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  addresses: profile.addresses.map((v, n) => (n === i ? { ...v, address: e.target.value } : v)),
                })
              }
            />
            <button
              type="button"
              className="text-button"
              onClick={() =>
                setProfile({
                  ...profile,
                  addresses: profile.addresses.filter((_, n) => n !== i),
                })
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="secondary"
          onClick={() =>
            setProfile({
              ...profile,
              addresses: [...profile.addresses, { id: crypto.randomUUID(), label: 'Home', address: '' }],
            })
          }
        >
          + Add Saved Address
        </button>
        <div className="actions">
          <button className="primary">Save Changes</button>
          <button type="button" className="secondary" onClick={logout}>
            Sign Out
          </button>
        </div>
        {message && <p role="status" className="notice">{message}</p>}
      </form>
    </div>
  );
}

const GOOGLE_DRIVE_APK_URL = 'https://drive.usercontent.google.com/download?id=1MoQLR6XmFy_B9uAF1okhc87vrH8CqJat&export=download&confirm=t';

function getDirectDownloadUrl(rawUrl?: string): string {
  if (!rawUrl || rawUrl.startsWith('/downloads/')) {
    return GOOGLE_DRIVE_APK_URL;
  }
  const driveMatch = rawUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/i);
  if (driveMatch) {
    return `https://drive.usercontent.google.com/download?id=${driveMatch[1]}&export=download&confirm=t`;
  }
  return rawUrl;
}

function DownloadPage({
  settings,
  onHome,
}: {
  settings?: Settings;
  onHome: () => void;
}) {
  const downloadUrl = '/downloads/customer-app-latest.apk';
  const apkVersion = settings?.apkVersion || '1.0.2';
  const apkSize = settings?.apkSize && settings?.apkSize !== '24.8 MB' && settings?.apkSize !== '121 MB' ? settings.apkSize : '63 MB';
  const downloadFileName = `dj-cabs-v${apkVersion}.apk`;

  return (
    <div className="page download-page">
      <div>
        <span className="security-badge">
          <ShieldCheck size={14} /> Official Private Release • Verified Android APK
        </span>
        <h1>
          Your journey.<br />
          Always in your pocket.
        </h1>
        <p className="muted">
          Download our native Android app directly from our secure HTTPS distribution server.
          Experience fluid animations, direct chauffeur calls, and real-time offline status tracking.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', margin: '24px 0 16px' }}>
          <a
            className="primary"
            href={downloadUrl}
            download={downloadFileName}
          >
            <Download size={18} /> Download Official Android APK ({apkSize})
          </a>
        </div>

        <div className="apk-spec-grid">
          <div className="apk-spec-item">
            <strong>Release Version</strong>
            <span>v{apkVersion} (Stable Production Release)</span>
          </div>
          <div className="apk-spec-item">
            <strong>Package Name</strong>
            <span>com.djcabs.customer</span>
          </div>
          <div className="apk-spec-item">
            <strong>File Size</strong>
            <span>{apkSize}</span>
          </div>
          <div className="apk-spec-item">
            <strong>OS Requirement</strong>
            <span>Android 8.0 (Oreo) and above</span>
          </div>
        </div>

        <div className="qr-container">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="120" rx="8" fill="#F8FAFC" />
            <rect x="10" y="10" width="30" height="30" rx="4" stroke="#0F172A" strokeWidth="4" />
            <rect x="18" y="18" width="14" height="14" rx="2" fill="#2563EB" />
            <rect x="80" y="10" width="30" height="30" rx="4" stroke="#0F172A" strokeWidth="4" />
            <rect x="88" y="18" width="14" height="14" rx="2" fill="#2563EB" />
            <rect x="10" y="80" width="30" height="30" rx="4" stroke="#0F172A" strokeWidth="4" />
            <rect x="18" y="88" width="14" height="14" rx="2" fill="#2563EB" />
            <rect x="52" y="16" width="16" height="6" fill="#0F172A" />
            <rect x="52" y="28" width="8" height="12" fill="#0F172A" />
            <rect x="16" y="52" width="14" height="8" fill="#0F172A" />
            <rect x="36" y="52" width="20" height="6" fill="#0F172A" />
            <rect x="64" y="52" width="18" height="18" fill="#2563EB" />
            <rect x="90" y="52" width="18" height="6" fill="#0F172A" />
            <rect x="52" y="80" width="12" height="16" fill="#0F172A" />
            <rect x="72" y="80" width="14" height="8" fill="#0F172A" />
            <rect x="92" y="74" width="16" height="14" fill="#0F172A" />
            <rect x="72" y="96" width="36" height="12" fill="#2563EB" />
          </svg>
          <small><QrCode size={12} style={{ marginRight: 4 }} /> Point mobile camera to download APK</small>
        </div>

        <h3>Quick 3-Step Installation</h3>
        <ol className="install-steps">
          <li>Download the APK file to your Android phone from the secure link above.</li>
          <li>When Android displays the standard browser security warning, tap &quot;Settings&quot; and enable &quot;Allow installation from this source&quot;.</li>
          <li>Tap the downloaded file and choose &quot;Install&quot;. Open the app and log in with your 10-digit mobile number.</li>
        </ol>

        <p className="muted">
          Note: You are never required to install the Android app. Our complete booking experience, trip tracking, and GST invoice download are always accessible right here on our website.
        </p>
        <button className="secondary" onClick={onHome}>
          Continue booking on website <ArrowRight size={16} />
        </button>
      </div>

      <div className="download-card-prod">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="avatar" style={{ width: 64, height: 64, margin: '0 auto 12px', background: '#eff6ff', color: 'var(--blue)' }}>
            <Smartphone size={32} />
          </div>
          <h2 style={{ fontSize: 24, margin: '6px 0' }}>Native Android APK</h2>
          <span className="badge" style={{ background: '#dcfce7', color: '#166534', fontSize: 11, padding: '4px 10px' }}>
            Production Build Signed
          </span>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 20, background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <ShieldCheck size={20} color="#16a34a" />
            <div>
              <strong style={{ fontSize: 13 }}>Malware & Virus Free</strong>
              <small style={{ display: 'block', color: 'var(--muted)' }}>Compiled directly from verified source</small>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Check size={20} color="#2563eb" />
            <div>
              <strong style={{ fontSize: 13 }}>Instant Journey Sync</strong>
              <small style={{ display: 'block', color: 'var(--muted)' }}>Unified bookings & live updates across Web & App</small>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <RouteIcon size={20} color="#f97316" />
            <div>
              <strong style={{ fontSize: 13 }}>Offline Chauffeur Contacts</strong>
              <small style={{ display: 'block', color: 'var(--muted)' }}>Direct phone & WhatsApp dialer support</small>
            </div>
          </div>
        </div>

        <a
          className="primary full"
          href={downloadUrl}
          download={downloadFileName}
        >
          <Download size={18} /> Download APK ({apkSize})
        </a>
      </div>
    </div>
  );
}
