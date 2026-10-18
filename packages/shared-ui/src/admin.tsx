'use client';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Car,
  Tag,
  ChartNoAxesCombined,
  Bell,
  Settings as SettingsIcon,
  Route as RouteIcon,
  Search,
  ArrowUpRight,
  ArrowRight,
  Plus,
  LogOut,
  Menu,
  Check,
  Clock,
  IndianRupee,
  Download,
  Smartphone,
  X,
  Phone,
  RefreshCw,
  FileText,
  Navigation,
  Share2,
  Copy,
  MessageSquare,
  QrCode,
  CheckCircle2,
  Send,
  Wifi,
  WifiOff,
  Camera,
} from 'lucide-react';
import type { Booking, Driver, Vehicle, Pricing, Route, Notice, Settings, Customer, Store, WhatsAppSession } from '../../shared-types/src/index';
import { transitions } from '../../shared-utils/src/index';
import {
  Auth,
  Badge,
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
  type DetailBooking
} from './common';

const navigation = [
  ['Dashboard', LayoutDashboard],
  ['Bookings', CalendarDays],
  ['Fleet', Car],
  ['Pricing', Tag],
  ['Reports', ChartNoAxesCombined],
  ['WhatsApp', MessageSquare],
  ['Notifications', Bell],
  ['Settings', SettingsIcon],
] as const;

export default function AdminApp() {
  const session = useSession('admin');
  const [page, setPage] = useState('Dashboard');
  const [booking, setBooking] = useState('');
  const [menu, setMenu] = useState(false);
  const [version, setVersion] = useState(0);

  if (!session.ready) return <Loading />;
  if (!session.token) {
    return (
      <div className="admin-login">
        <div className="login-story">
          <div className="brand">
            <RouteIcon /> miles&moments <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 800 }}>DISPATCH CONSOLE</span>
          </div>
          <p className="eyebrow">CENTRAL OPERATIONS PORTAL</p>
          <h1>Real-time fleet.<br />Every mile in control.</h1>
          <p>
            Central operations management console. Dispatch verified chauffeurs, monitor journeys in real time, and oversee fleet readiness.
          </p>
        </div>
        <Auth admin onLogin={session.login} />
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <a className="brand" href="/admin" onClick={(e) => { e.preventDefault(); setPage('Dashboard'); setBooking(''); }}>
          <span className="brand-icon"><RouteIcon /></span>
          <span>miles&moments<small>OPERATIONS HUB</small></span>
        </a>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {navigation.map(([name, Icon]) => (
            <button
              className={page === name && !booking ? 'active' : ''}
              key={name}
              onClick={() => {
                setPage(name);
                setBooking('');
                setMenu(false);
              }}
            >
              <Icon size={18} />
              {name}
              {name === 'Bookings' && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-mark">
            <span className="badge" style={{ background: '#ecfdf5', color: '#065f46', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /> System Active
            </span>
            <strong>Bengaluru Dispatch Hub</strong>
            <small>Fleet & Operations Center</small>
          </div>
          <button onClick={session.logout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <button className="mobile icon-button" onClick={() => setMenu(!menu)} aria-label="Toggle navigation">
            <Menu />
          </button>
          <span className="muted">
            Workspace <span className="breadcrumb">/</span> <strong>{booking ? 'Booking Details' : page}</strong>
          </span>

          <div className="header-right">
            <span className="badge" style={{ background: '#ecfdf5', color: '#065f46', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /> Live Operations
            </span>
            <button className="icon-button" aria-label="Notifications" onClick={() => setPage('Notifications')}>
              <Bell size={18} />
            </button>
            <span className="avatar small-avatar">OP</span>
            <span className="desktop">
              Operations Lead<small>Bengaluru Dispatch</small>
            </span>
          </div>
        </header>

        <main className="admin-content" key={version}>
          {booking ? (
            <AdminBooking
              id={booking}
              token={session.token}
              onBack={() => {
                setBooking('');
                setVersion((v) => v + 1);
              }}
            />
          ) : page === 'Dashboard' ? (
            <Dashboard token={session.token} open={setBooking} goBookings={() => setPage('Bookings')} />
          ) : page === 'Bookings' ? (
            <Bookings token={session.token} open={setBooking} />
          ) : page === 'Fleet' || page === 'Drivers' || page === 'Vehicles' ? (
            <Fleet token={session.token} />
          ) : page === 'Pricing' ? (
            <PricingPage token={session.token} />
          ) : page === 'Reports' ? (
            <Reports token={session.token} />
          ) : page === 'WhatsApp' ? (
            <WhatsAppGatewayPage token={session.token} />
          ) : page === 'Notifications' ? (
            <Notifications token={session.token} />
          ) : (
            <SettingsPage token={session.token} />
          )}
        </main>
      </div>
    </div>
  );
}

function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Stat({
  title,
  value,
  sub,
  icon: Icon = CalendarDays,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  sub: string;
  icon?: typeof CalendarDays;
  color?: string;
}) {
  return (
    <div className="stat-card card">
      <div className="section-title">
        <span>{title}</span>
        <span className={`stat-icon ${color}`}>
          <Icon size={19} />
        </span>
      </div>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}

function Dashboard({
  token,
  open,
  goBookings,
}: {
  token: string;
  open: (id: string) => void;
  goBookings: () => void;
}) {
  const r = useResource<{
    bookings: Booking[];
    notifications: Notice[];
    drivers: Driver[];
    vehicles: Vehicle[];
  }>('/admin/dashboard', token);

  if (r.loading) return <Loading />;
  if (r.error || !r.data) return <ErrorBox message={r.error} retry={r.reload} />;
  const d = r.data;
  const pending = d.bookings.filter((b) => b.status === 'CONFIRMED' && !b.driverId);
  const activeTrips = d.bookings.filter((b) => b.status === 'TRIP_STARTED' || b.status === 'DRIVER_ASSIGNED');
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const revenue = (days: number) =>
    d.bookings
      .filter((b) => b.paymentStatus === 'PAID' && new Date(b.createdAt).getTime() >= Date.now() - days * 86400000)
      .reduce((s, b) => s + b.fare, 0);

  return (
    <>
      <Heading
        eyebrow="LIVE DISPATCH METRICS"
        title="Operations Dashboard"
        description="Real-time booking dispatch, chauffeur availability, and revenue telemetry."
        action={
          <span className="date-chip">
            <CalendarDays size={16} />
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        }
      />

      <div className="stats-grid">
        <Stat
          title="Today's bookings"
          value={d.bookings.filter((b) => b.date === today).length}
          sub={`${d.bookings.length} total bookings recorded`}
        />
        <Stat
          title="Pending dispatch"
          value={pending.length}
          sub="Requires chauffeur assignment"
          icon={Users}
          color="orange"
        />
        <Stat
          title="Trips on road"
          value={activeTrips.length}
          sub={`${d.drivers.filter((dr) => dr.status === 'Available').length} drivers currently available`}
          icon={Car}
          color="green"
        />
        <Stat
          title="Today's collections"
          value={money(revenue(1))}
          sub="Verified online & cash bookings"
          icon={IndianRupee}
        />
      </div>

      <div className="dashboard-grid">
        <section className="card panel">
          <div className="section-title">
            <div>
              <h2>Pending Chauffeur Assignments <span className="count">{pending.length}</span></h2>
              <p className="muted">Bookings confirmed by customer awaiting driver dispatch.</p>
            </div>
            {pending.length > 0 && <span className="orange-label">DISPATCH NEEDED</span>}
          </div>

          {pending.length ? (
            pending.slice(0, 5).map((b) => (
              <div className="assignment-row" key={b.id}>
                <span className="vehicle-icon">
                  <Car size={22} />
                </span>
                <div>
                  <strong>{b.pickup} <ArrowRight size={14} /> {b.drop}</strong>
                  <p className="muted">
                    #{b.bookingNumber} · {b.date} · {b.time} · {b.vehicleType} · {money(b.fare)}
                  </p>
                </div>
                <button className="primary small" onClick={() => open(b.id)}>
                  Assign Chauffeur <ArrowUpRight size={14} />
                </button>
              </div>
            ))
          ) : (
            <Empty title="Dispatch Queue Clear">
              <p>Every active booking has been assigned a driver.</p>
            </Empty>
          )}
        </section>

        <section className="card panel fleet-overview">
          <h2>Fleet Status Overview</h2>
          <div className="fleet-ring">
            <div>
              <strong>{d.vehicles.length}</strong>
              <small>total vehicles</small>
            </div>
          </div>
          {['Available', 'On Trip', 'Maintenance', 'Inactive'].map((s, i) => (
            <div className="section-title fleet-legend" key={s}>
              <span>
                <i style={{ background: ['#2563eb', '#10b981', '#f97316', '#94a3b8'][i] }} />
                {s}
              </span>
              <strong>{d.vehicles.filter((v) => v.status === s).length}</strong>
            </div>
          ))}
        </section>
      </div>

      <div className="grid-two">
        <section className="card panel">
          <div className="section-title">
            <h2>Revenue Velocity</h2>
            <Badge value="INR (₹)" />
          </div>
          <RevenueChart bookings={d.bookings} />
          <div className="section-title" style={{ marginTop: 12 }}>
            <span>Last 7 Days: <strong>{money(revenue(7))}</strong></span>
            <span>Last 30 Days: <strong>{money(revenue(30))}</strong></span>
          </div>
        </section>

        <section className="card panel">
          <h2>Live Dispatch Alerts</h2>
          <div className="mini-stats">
            <div>
              <strong>{d.bookings.filter((b) => b.status === 'CONFIRMED').length}</strong>
              <span>Confirmed</span>
            </div>
            <div>
              <strong>{d.bookings.filter((b) => b.status === 'COMPLETED').length}</strong>
              <span>Completed</span>
            </div>
          </div>
          {d.notifications.slice(0, 4).map((n) => (
            <div className="notification-row" key={n.id}>
              <span className="pulse-icon">
                <Bell size={16} />
              </span>
              <div>
                <p>{n.message}</p>
                <small className="muted">
                  {new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            </div>
          ))}
          {!d.notifications.length && <p className="muted">No recent dispatch alerts.</p>}
        </section>
      </div>

      <section className="card panel">
        <div className="section-title">
          <h2>Recent Bookings</h2>
          <button className="text-button" onClick={goBookings}>
            View all bookings <ArrowRight size={16} />
          </button>
        </div>
        <BookingTable bookings={d.bookings.slice(0, 6)} open={open} />
      </section>
    </>
  );
}

function RevenueChart({ bookings }: { bookings: Booking[] }) {
  const series = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(Date.now() - (6 - i) * 86400000);
    const date = day.toISOString().slice(0, 10);
    return {
      label: day.toLocaleDateString('en-IN', { weekday: 'short' }),
      value: bookings
        .filter((b) => b.createdAt.slice(0, 10) === date && b.paymentStatus === 'PAID')
        .reduce((a, b) => a + b.fare, 0),
    };
  });
  const max = Math.max(1, ...series.map((s) => s.value));

  return (
    <div className="bar-chart" role="img" aria-label="Collections over the last seven days">
      {series.map((s, i) => (
        <div key={i}>
          <small>{money(s.value)}</small>
          <span style={{ height: `${Math.max(4, (s.value / max) * 125)}px` }} />
          <small>{s.label}</small>
        </div>
      ))}
    </div>
  );
}

function BookingTable({ bookings, open }: { bookings: Booking[]; open: (id: string) => void }) {
  return bookings.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {['Booking ID', 'Customer / Phone', 'Route', 'Date & Time', 'Vehicle', 'Fare & Payment', 'Chauffeur', 'Status', ''].map(
              (h, i) => (
                <th key={i}>{h}</th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>
                <button className="table-link" onClick={() => open(b.id)}>
                  #{b.bookingNumber}
                </button>
                {b.directBooking && (
                  <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.68rem', display: 'block', width: 'fit-content', marginTop: 2, fontWeight: 700 }}>
                    ⚡ Direct
                  </span>
                )}
              </td>
              <td>
                <strong>{b.name}</strong>
                <small>{b.phone}</small>
              </td>
              <td className="route-cell">
                {b.pickup}
                <small>→ {b.drop}</small>
              </td>
              <td>
                {b.date}
                <small>{b.time}</small>
              </td>
              <td>{b.vehicleType}</td>
              <td>
                <strong>{money(b.fare)}</strong>
                <Badge value={b.paymentStatus} />
              </td>
              <td>
                {b.driverId ? <Badge value={b.assignment} /> : <span className="muted">Unassigned</span>}
              </td>
              <td>
                <Badge value={b.status} />
              </td>
              <td>
                <button className="icon-button" aria-label={`View ${b.bookingNumber}`} onClick={() => open(b.id)}>
                  <ArrowUpRight size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty title="No bookings matched the criteria">
      <p>Adjust your search filters.</p>
    </Empty>
  );
}

function Bookings({ token, open }: { token: string; open: (id: string) => void }) {
  const [filters, setFilters] = useState({ search: '', date: '', status: '', vehicle: '', payment: '', driver: '' });
  const r = useResource<Booking[]>(`/admin/bookings?${new URLSearchParams(filters)}`, token);
  const drivers = useResource<Driver[]>('/admin/drivers', token);

  return (
    <>
      <Heading
        title="Fleet Bookings Registry"
        description="Filter, inspect, and dispatch trips with real-time operations overview."
      />
      <section className="card panel">
        <div className="filters">
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Search bookings"
              placeholder="Search by ID, customer name, mobile number…"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </label>
          <input
            aria-label="Pickup date"
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
          {(['status', 'vehicle', 'payment'] as const).map((f) => (
            <select
              aria-label={f}
              key={f}
              value={filters[f]}
              onChange={(e) => setFilters({ ...filters, [f]: e.target.value })}
            >
              <option value="">{f === 'status' ? 'All Statuses' : f === 'vehicle' ? 'All Vehicles' : 'All Payments'}</option>
              {(f === 'status'
                ? Object.keys(transitions)
                : f === 'vehicle'
                ? ['Sedan', 'SUV', 'Tempo Traveller']
                : ['PAID', 'PENDING', 'FAILED', 'CASH']
              ).map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          ))}
          <select
            aria-label="Driver"
            value={filters.driver}
            onChange={(e) => setFilters({ ...filters, driver: e.target.value })}
          >
            <option value="">All Chauffeurs</option>
            {drivers.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.status})
              </option>
            ))}
          </select>
          <button
            className="text-button"
            onClick={() => setFilters({ search: '', date: '', status: '', vehicle: '', payment: '', driver: '' })}
          >
            Clear Filters
          </button>
        </div>

        {r.loading ? <Loading /> : r.error ? <ErrorBox message={r.error} retry={r.reload} /> : <BookingTable bookings={r.data || []} open={open} />}
      </section>
    </>
  );
}

function AdminBooking({ id, token, onBack }: { id: string; token: string; onBack: () => void }) {
  const r = useResource<DetailBooking>(`/admin/bookings/${id}`, token);
  const drivers = useResource<Driver[]>('/admin/drivers', token);
  const vehicles = useResource<Vehicle[]>('/admin/vehicles', token);
  const [assign, setAssign] = useState(false);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [messageChannel, setMessageChannel] = useState<'WhatsApp' | 'SMS'>('WhatsApp');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [waModal, setWaModal] = useState<{
    driverName?: string;
    driverPhone?: string;
    vehicleModel?: string;
    vehicleNumber?: string;
    message?: string;
    link?: string;
    waUrl?: string;
    deliveryStatus?: 'QUEUED' | 'FAILED' | 'NOT_CONFIGURED';
    deliveryError?: string;
  } | null>(null);

  useEffect(() => {
    if (r.data?.status === 'DRIVER_ASSIGNED' || r.data?.status === 'TRIP_STARTED') {
      const interval = setInterval(() => {
        r.reload();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [r.data?.status]);

  async function action(path: string, body: unknown, method: 'POST' | 'PUT' = 'POST') {
    setBusy(true);
    setError('');
    try {
      await api(path, { token, method, body });
      r.reload();
      setAssign(false);
      setConfirm('');
      setNotifyOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (r.loading && !r.data) return <Loading />;
  if (r.error || !r.data) return <ErrorBox message={r.error} retry={r.reload} />;
  const b = r.data;

  return (
    <>
      <button className="text-button" onClick={onBack}>
        ← Return to Bookings
      </button>
      <Heading
        title={`Booking #${b.bookingNumber}`}
        description="Comprehensive dispatch record, driver allocation, and status progression."
        action={<Badge value={b.status} />}
      />

      {error && <ErrorBox message={error} />}

      <div className="detail-layout">
        <section className="card detail-card">
          <BookingInfo b={b} />
          <div style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
            <Invoice id={id} token={token} prefix="admin" />
          </div>
        </section>

        <aside className="card panel action-panel">
          <h2>Dispatch Operations</h2>

          {b.status === 'CONFIRMED' && (
            <button className="primary full" onClick={() => setAssign(true)}>
              <Users size={16} /> Assign Available Driver
            </button>
          )}

          {b.status === 'DRIVER_ASSIGNED' && b.assignment === 'ACCEPTED' && (
            <button
              className="primary full"
              style={{ background: '#7c3aed' }}
              disabled={busy}
              onClick={() => action(`/admin/bookings/${id}/status`, { status: 'TRIP_STARTED' }, 'PUT')}
            >
              <Car size={16} /> Start Trip (Chauffeur Picked Up)
            </button>
          )}

          {b.status === 'TRIP_STARTED' && (
            <button
              className="primary full"
              style={{ background: '#10b981' }}
              disabled={busy}
              onClick={() => action(`/admin/bookings/${id}/status`, { status: 'COMPLETED' }, 'PUT')}
            >
              <Check size={16} /> Complete Trip (Passenger Dropped)
            </button>
          )}

          {transitions[b.status]
            ?.filter((s) => !['DRIVER_ASSIGNED', 'CONFIRMED', 'TRIP_STARTED', 'COMPLETED'].includes(s))
            .map((s) => (
              <button
                key={s}
                className={s === 'CANCELLED' ? 'danger-button full' : 'secondary full'}
                onClick={() => setConfirm(s)}
              >
                {s === 'CANCELLED' ? 'Cancel Booking' : `Advance to ${label(s)}`}
              </button>
            ))}

          <button
            className="secondary full"
            onClick={() => {
              setNotifyOpen(true);
              setMessage(`Your booking #${b.bookingNumber} is currently: ${label(b.status)}.`);
            }}
          >
            <Bell size={16} /> Send SMS / WhatsApp Alert
          </button>

          <hr />

          <h3>Driver Response Channel</h3>
          <Badge value={b.assignment} />

          {b.assignment === 'ASSIGNED' && (() => {
            const driverTripUrl = `${(process.env.NEXT_PUBLIC_APP_URL || 'https://miles.devijewellers.in').replace(/\/+$/, '')}/driver/trip?token=${b.assignmentToken || ''}`;
            const assignedDriver = drivers.data?.find((d) => d.id === b.driverId);
            const assignedVehicle = vehicles.data?.find((v) => v.id === b.vehicleId);
            const waText = encodeURIComponent(
              `🚗 *Miles & Moments — New Trip Offer*\n\n` +
              `*Booking ID:* #${b.bookingNumber}\n` +
              `*Pickup:* ${b.pickup}\n` +
              `*Drop:* ${b.drop}\n` +
              `*Date & Time:* ${b.date} at ${b.time}\n` +
              `*Vehicle:* ${assignedVehicle?.model || b.vehicleType} (${assignedVehicle?.number || ''})\n` +
              `*Passengers:* ${b.passengers} | *Luggage:* ${b.luggage}\n\n` +
              `👉 *Tap link to review & accept/decline:* \n${driverTripUrl}\n\n` +
              `*(Link valid for 30 minutes)*`
            );
            const waUrl = `https://wa.me/91${assignedDriver?.phone?.replace(/\D/g, '').slice(-10) || ''}?text=${waText}`;

            return (
              <div style={{ marginTop: 12, padding: 14, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10 }}>
                <strong style={{ fontSize: 13, display: 'block', marginBottom: 4, color: '#166534' }}>
                  Awaiting Chauffeur Acceptance:
                </strong>
                <small style={{ color: '#15803d', display: 'block', marginBottom: 12 }}>
                  Offered to {assignedDriver?.name || 'Driver'} ({assignedDriver?.phone || ''}). Customer sees driver details once accepted.
                </small>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="primary small"
                    style={{ background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}
                  >
                    <Share2 size={15} /> Send / Open in WhatsApp
                  </a>

                  <button
                    type="button"
                    className="secondary small"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onClick={() => {
                      if (typeof navigator !== 'undefined') {
                        navigator.clipboard.writeText(driverTripUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                  >
                    <Copy size={15} /> {copied ? 'Copied to Clipboard!' : 'Copy Driver Link'}
                  </button>

                  <a
                    href={driverTripUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 11, color: '#0f766e', textAlign: 'center', textDecoration: 'underline', marginTop: 4 }}
                  >
                    Open Driver Mobile Screen →
                  </a>
                </div>

                <div style={{ borderTop: '1px solid #bbf7d0', marginTop: 12, paddingTop: 10 }}>
                  <small style={{ color: '#15803d', display: 'block', marginBottom: 6 }}>
                    Manual Dispatch Action:
                  </small>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="primary small"
                      style={{ background: '#16a34a', flex: 1, fontSize: 11 }}
                      disabled={busy}
                      onClick={() => action('/driver/assignment-response', { bookingId: id, response: 'YES' })}
                    >
                      Accept (YES)
                    </button>
                    <button
                      className="secondary small"
                      style={{ color: '#dc2626', flex: 1, fontSize: 11 }}
                      disabled={busy}
                      onClick={() => action('/driver/assignment-response', { bookingId: id, response: 'NO' })}
                    >
                      Decline (NO)
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {b.assignment === 'DECLINED' && (
            <div style={{ marginTop: 12, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
              <strong style={{ color: '#991b1b', fontSize: 13, display: 'block' }}>Chauffeur Declined</strong>
              <p style={{ color: '#b91c1c', fontSize: 12, margin: '4px 0 10px' }}>
                {b.assignmentDeclineReason || 'Driver declined the assignment offer.'}
              </p>
              <button className="primary small full" onClick={() => setAssign(true)}>
                Reassign to Another Driver
              </button>
            </div>
          )}

          {b.assignment === 'ACCEPTED' && (
            <div style={{ marginTop: 12 }}>
              <p style={{ color: '#15803d', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={16} /> Chauffeur confirmed & locked for this ride.
              </p>
              {b.driverLocation && (
                <div style={{ marginTop: 10, padding: 12, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10 }}>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0f766e', fontSize: 13 }}>
                    <Navigation size={14} /> Chauffeur Live GPS Active
                  </strong>
                  <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 8px' }}>
                    Coordinates: {b.driverLocation.lat.toFixed(4)}, {b.driverLocation.lng.toFixed(4)}
                    <br />
                    Updated: {new Date(b.driverLocation.updatedAt).toLocaleTimeString()}
                  </p>
                  <a
                    className="secondary small"
                    href={`https://www.google.com/maps?q=${b.driverLocation.lat},${b.driverLocation.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    Track on Google Maps →
                  </a>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {assign && (
        <Modal title={`Assign Chauffeur · #${b.bookingNumber}`} onClose={() => setAssign(false)}>
          <p className="muted">
            Displaying active drivers with vehicles matching the requested type (<strong>{b.vehicleType}</strong>).
          </p>

          {drivers.data
            ?.filter(
              (d) =>
                d.status === 'Available' &&
                vehicles.data?.find((v) => v.id === d.vehicleId)?.type === b.vehicleType
            )
            .map((d) => (
              <button
                className={`driver-choice ${selected === d.id ? 'selected' : ''}`}
                key={d.id}
                onClick={() => setSelected(d.id)}
              >
                <span className="avatar">{d.name[0]}</span>
                <div>
                  <strong>{d.name}</strong>
                  <p>{d.phone} · ★ {d.rating} ({d.trips} trips)</p>
                  <small>Vehicle: {vehicles.data?.find((v) => v.id === d.vehicleId)?.model} ({vehicles.data?.find((v) => v.id === d.vehicleId)?.number})</small>
                </div>
                <Badge value={d.status} />
              </button>
            ))}

          {drivers.data?.filter(
            (d) =>
              d.status === 'Available' &&
              vehicles.data?.find((v) => v.id === d.vehicleId)?.type === b.vehicleType
          ).length === 0 && (
            <Empty title="No matching drivers available">
              <p>All drivers for {b.vehicleType} are currently on trip or inactive.</p>
            </Empty>
          )}

          {error && <ErrorBox message={error} />}

          <button
            className="primary full"
            disabled={!selected || busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                const res = await api<{
                  whatsapp?: {
                    driverName: string;
                    driverPhone: string;
                    vehicleModel: string;
                    vehicleNumber: string;
                    message: string;
                    link: string;
                    waUrl: string;
                    deliveryStatus: 'QUEUED' | 'FAILED' | 'NOT_CONFIGURED';
                    deliveryError?: string;
                  };
                }>(`/admin/bookings/${id}/assign-driver`, {
                  token,
                  method: 'POST',
                  body: { driverId: selected },
                });
                setAssign(false);
                r.reload();
                if (res?.whatsapp) {
                  if (typeof window !== 'undefined' && res.whatsapp.waUrl) {
                    window.open(res.whatsapp.waUrl, '_blank');
                  }
                  setWaModal(res.whatsapp);
                }
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
            style={{ marginTop: 16 }}
          >
            {busy ? 'Assigning & Dispatching…' : 'Confirm Chauffeur Assignment'}
          </button>
        </Modal>
      )}

      {waModal && (
        <Modal title="Trip Offer Delivery Result" onClose={() => setWaModal(null)}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: waModal.deliveryStatus === 'QUEUED' ? '#dcfce7' : '#fee2e2',
              color: waModal.deliveryStatus === 'QUEUED' ? '#16a34a' : '#b91c1c',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}>
              <Share2 size={26} />
            </div>
            <h3 style={{ margin: 0, fontSize: 17, color: waModal.deliveryStatus === 'QUEUED' ? '#14532d' : '#991b1b' }}>
              {waModal.deliveryStatus === 'QUEUED' ? 'WhatsApp accepted the trip offer' : 'Automatic WhatsApp send failed'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#166534' }}>
              Offered to <strong>{waModal.driverName || 'Chauffeur'}</strong> ({waModal.driverPhone || ''})
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: waModal.deliveryStatus === 'QUEUED' ? '#dcfce7' : '#fee2e2',
              color: waModal.deliveryStatus === 'QUEUED' ? '#15803d' : '#991b1b',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              marginTop: 8
            }}>
              <CheckCircle2 size={13} /> {waModal.deliveryStatus === 'QUEUED' ? 'Accepted by WhatsApp; delivery receipt not confirmed' : waModal.deliveryError || 'Message was not sent'}
            </div>
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            padding: 12,
            marginBottom: 14,
            fontSize: 12,
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            color: '#334155',
            maxHeight: 180,
            overflowY: 'auto'
          }}>
            {waModal.message}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {waModal.waUrl && (
              <a
                href={waModal.waUrl}
                target="_blank"
                rel="noreferrer"
                className="primary full"
                style={{ background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
              >
                <Share2 size={16} /> Open WhatsApp to Send Manually
              </a>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              {waModal.link && (
                <button
                  type="button"
                  className="secondary small"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => {
                    if (typeof navigator !== 'undefined') {
                      navigator.clipboard.writeText(waModal.link || '');
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                >
                  <Copy size={14} /> {copied ? 'Link Copied!' : 'Copy Trip Link'}
                </button>
              )}

              {waModal.message && (
                <button
                  type="button"
                  className="secondary small"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => {
                    if (typeof navigator !== 'undefined') {
                      navigator.clipboard.writeText(waModal.message || '');
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                >
                  <Copy size={14} /> Copy Full Message
                </button>
              )}
            </div>

            <button className="text-button" onClick={() => setWaModal(null)} style={{ marginTop: 4 }}>
              Done / Return to Booking
            </button>
          </div>
        </Modal>
      )}

      {confirm && (
        <Modal title={`Confirm status change to ${label(confirm)}?`} onClose={() => setConfirm('')}>
          <p>This action will update the booking status and notify the customer.</p>
          {error && <ErrorBox message={error} />}
          <div className="actions">
            <button className="secondary" onClick={() => setConfirm('')}>
              Cancel
            </button>
            <button
              className="primary"
              disabled={busy}
              onClick={() =>
                confirm === 'CANCELLED'
                  ? action(`/admin/bookings/${id}/cancel`, {})
                  : action(`/admin/bookings/${id}/status`, { status: confirm }, 'PUT')
              }
            >
              Confirm {label(confirm)}
            </button>
          </div>
        </Modal>
      )}

      {notifyOpen && (
        <Modal title="Send Message to Customer" onClose={() => setNotifyOpen(false)}>
          {error && <ErrorBox message={error} />}
          <label>
            Delivery Channel
            <select value={messageChannel} onChange={(e) => setMessageChannel(e.target.value as 'WhatsApp' | 'SMS')}>
              <option value="WhatsApp">WhatsApp</option>
              <option value="SMS">SMS</option>
            </select>
          </label>
          <label>
            Message Content
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
          </label>
          <button
            className="primary"
            disabled={busy || !message}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                const result = await api<{ sent: number; failed?: Array<{ name: string; error: string }> }>('/admin/notifications', {
                  token,
                  method: 'POST',
                  body: {
                recipientType: 'customer',
                recipientId: b.customerId,
                bookingId: b.id,
                channel: messageChannel,
                template: 'Dispatch Notice',
                message,
                  },
                });
                if (result.failed?.length) {
                  setError(result.failed.map((item) => `${item.name}: ${item.error}`).join(' '));
                } else {
                  setNotifyOpen(false);
                }
                r.reload();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Send Message
          </button>
        </Modal>
      )}
    </>
  );
}

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

function Fleet({ token }: { token: string }) {
  const r = useResource<(Vehicle & { driverName?: string; driverPhone?: string; driverLicense?: string })[]>('/admin/vehicles', token);
  const settings = useResource<Settings>('/admin/settings', token);
  const [query, setQuery] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [edit, setEdit] = useState<{
    id?: string;
    type: 'Sedan' | 'SUV' | 'Tempo Traveller';
    number: string;
    model: string;
    capacity: number;
    ac: boolean;
    status: 'Available' | 'On Trip' | 'Maintenance' | 'Inactive';
    images: string[];
    driverName: string;
    driverPhone: string;
    driverLicense: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toggleBusy, setToggleBusy] = useState(false);

  const defaults = {
    type: 'Sedan' as const,
    number: '',
    model: '',
    capacity: 4,
    ac: true,
    status: 'Available' as const,
    images: [] as string[],
    driverName: '',
    driverPhone: '',
    driverLicense: '',
  };

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length || !edit) return;
    const remainingSlots = 5 - (edit.images?.length || 0);
    if (remainingSlots <= 0) {
      alert('Maximum 5 photos allowed per vehicle.');
      return;
    }
    const toProcess = files.slice(0, remainingSlots);
    setUploadingImage(true);
    try {
      const compressedList = await Promise.all(toProcess.map((f) => compressImageFile(f)));
      setEdit((prev) => (prev ? {
        ...prev,
        images: [...(prev.images || []), ...compressedList],
      } : null));
    } catch (err) {
      alert('Failed to process image: ' + (err as Error).message);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  }

  function handleAddImageUrl() {
    if (!imageUrl.trim() || !edit) return;
    if ((edit.images?.length || 0) >= 5) {
      alert('Maximum 5 photos allowed per vehicle.');
      return;
    }
    setEdit((prev) => (prev ? {
      ...prev,
      images: [...(prev.images || []), imageUrl.trim()],
    } : null));
    setImageUrl('');
  }

  function handleRemoveImage(index: number) {
    if (!edit) return;
    setEdit((prev) => (prev ? {
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    } : null));
  }

  function handleSetCover(index: number) {
    if (!edit || index === 0) return;
    const list = [...(edit.images || [])];
    const item = list[index];
    list.splice(index, 1);
    list.unshift(item);
    setEdit((prev) => (prev ? { ...prev, images: list } : null));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(`/admin/vehicles${edit?.id ? `/${edit.id}` : ''}`, {
        method: edit?.id ? 'PUT' : 'POST',
        token,
        body: edit,
      });
      setEdit(null);
      r.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleDirectBooking() {
    if (!settings.data) return;
    setToggleBusy(true);
    try {
      const current = settings.data;
      await api('/admin/settings', {
        method: 'PUT',
        token,
        body: {
          businessName: current.businessName,
          phone: current.phone,
          email: current.email,
          address: current.address,
          cancellationHours: current.cancellationHours,
          terms: current.terms,
          privacy: current.privacy,
          apkUrl: current.apkUrl || '',
          apkVersion: current.apkVersion || '1.0.0',
          apkSize: current.apkSize || '24.8 MB',
          directVehicleBooking: !current.directVehicleBooking,
        },
      });
      settings.reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setToggleBusy(false);
    }
  }

  const isDirectActive = Boolean(settings.data?.directVehicleBooking);

  return (
    <>
      <Heading
        title="Fleet & Chauffeurs"
        description="Unified commercial vehicles and attached chauffeur contacts. When Direct Booking is enabled, customers select vehicles directly with auto-confirmation."
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className="secondary"
              disabled={toggleBusy || !settings.data}
              onClick={toggleDirectBooking}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
              title="Click to toggle Direct Vehicle Booking ON or OFF"
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isDirectActive ? '#10b981' : '#94a3b8' }} />
              Direct Booking: {isDirectActive ? 'ON (Auto-Confirmed)' : 'OFF (Manual Approval)'}
            </button>
            <button
              className="primary"
              onClick={() => {
                setEdit(defaults);
                setError('');
              }}
            >
              <Plus size={16} /> Add Vehicle & Chauffeur
            </button>
          </div>
        }
      />

      <div className="filters">
        <label className="search-field">
          <Search size={16} />
          <input
            aria-label="Search fleet"
            placeholder="Search vehicles or chauffeurs by model, number, driver name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      {r.loading ? (
        <Loading />
      ) : r.error ? (
        <ErrorBox message={r.error} retry={r.reload} />
      ) : (
        <div className="grid-three">
          {r.data
            ?.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()))
            .map((item) => (
              <article key={item.id} className="card fleet-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ position: 'relative', height: 160, width: '100%', background: '#0f172a' }}>
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.model}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#94a3b8' }}>
                      <Car size={42} strokeWidth={1.2} />
                    </div>
                  )}
                  {item.images && item.images.length > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        background: 'rgba(15,23,42,0.8)',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      📷 {item.images.length} / 5 photos
                    </span>
                  )}
                </div>
                <div style={{ padding: 16 }}>
                  <div className="section-title">
                    <div className="vehicle-icon">
                      <Car size={26} />
                    </div>
                    <Badge value={item.status} />
                  </div>
                  <h2>{item.model}</h2>
                  <p><strong>{item.number}</strong></p>
                  <p className="muted">
                    {item.type} · {item.capacity} seats · {item.ac ? 'Climate Controlled AC' : 'Non-AC'}
                  </p>

                  <div style={{ margin: '12px 0', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>
                      ASSIGNED CHAUFFEUR
                    </p>
                    {item.driverName ? (
                      <>
                        <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                          👤 {item.driverName}
                        </p>
                        <p style={{ margin: '2px 0 0', color: '#059669', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={13} /> +91 {item.driverPhone} (WhatsApp)
                        </p>
                        {item.driver && (
                          <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                            ★ {item.driver.rating || 5.0} · {item.driver.trips || 0} completed trips
                          </p>
                        )}
                        {(item.driverLicense || item.driver?.license) && (
                          <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '0.76rem' }}>
                            License: {item.driverLicense || item.driver?.license}
                          </p>
                        )}
                      </>
                    ) : (
                      <p style={{ margin: 0, color: '#d97706', fontSize: '0.86rem', fontWeight: 600 }}>
                        ⚠️ No chauffeur contact attached
                      </p>
                    )}
                  </div>

                  <div className="actions">
                    <button
                      className="secondary"
                      onClick={() => {
                        setEdit({
                          id: item.id,
                          type: item.type,
                          number: item.number,
                          model: item.model,
                          capacity: item.capacity,
                          ac: item.ac,
                          status: item.status,
                          images: item.images ? [...item.images] : [],
                          driverName: item.driverName || item.driver?.name || '',
                          driverPhone: item.driverPhone || item.driver?.phone || '',
                          driverLicense: item.driverLicense || item.driver?.license || '',
                        });
                        setError('');
                      }}
                    >
                      Edit Vehicle & Chauffeur
                    </button>
                  </div>
                </div>
              </article>
            ))}
        </div>
      )}

      {edit && (
        <Modal title={`${edit.id ? 'Edit' : 'Add'} Vehicle & Chauffeur`} onClose={() => setEdit(null)}>
          <form onSubmit={save}>
            {error && <ErrorBox message={error} />}

            <p className="eyebrow" style={{ marginTop: 0 }}>VEHICLE SPECIFICATIONS</p>
            <div className="form-grid">
              <label>
                Vehicle Type
                <select value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as any })}>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Tempo Traveller">Tempo Traveller</option>
                </select>
              </label>
              <label>
                Vehicle Model
                <input required placeholder="e.g. Toyota Innova Crysta" value={edit.model} onChange={(e) => setEdit({ ...edit, model: e.target.value })} />
              </label>
              <label>
                Registration Number
                <input required placeholder="e.g. KA 01 AB 1234" value={edit.number} onChange={(e) => setEdit({ ...edit, number: e.target.value })} />
              </label>
              <label>
                Passenger Capacity (Seats)
                <input required type="number" min={1} max={50} value={edit.capacity} onChange={(e) => setEdit({ ...edit, capacity: Number(e.target.value) })} />
              </label>
              <label>
                Air Conditioning
                <select value={String(edit.ac)} onChange={(e) => setEdit({ ...edit, ac: e.target.value === 'true' })}>
                  <option value="true">Climate Controlled AC</option>
                  <option value="false">Non-AC</option>
                </select>
              </label>
              <label>
                Operational Status
                <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value as any })}>
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
            </div>

            {/* VEHICLE PHOTOS GALLERY (UP TO 5 PHOTOS) */}
            <div style={{ marginTop: 18, marginBottom: 18, padding: '14px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p className="eyebrow" style={{ margin: 0 }}>VEHICLE PHOTOS (MAX 5 PHOTOS)</p>
                <span className="badge" style={{ background: (edit.images?.length || 0) > 0 ? '#ecfdf5' : '#f1f5f9', color: (edit.images?.length || 0) > 0 ? '#065f46' : '#64748b' }}>
                  {edit.images?.length || 0} / 5 Photos
                </span>
              </div>

              {(edit.images?.length || 0) < 5 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#2563eb', color: '#fff', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.86rem' }}>
                    <Camera size={16} /> {uploadingImage ? 'Compressing…' : 'Upload Photos (Gallery / Camera)'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploadingImage}
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span className="muted" style={{ fontSize: '0.8rem' }}>or paste link:</span>
                  <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 200 }}>
                    <input
                      type="url"
                      placeholder="https://... image link"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      style={{ margin: 0, padding: '6px 10px', fontSize: '0.85rem' }}
                    />
                    <button type="button" className="secondary" onClick={handleAddImageUrl} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                      Add
                    </button>
                  </div>
                </div>
              )}

              {edit.images && edit.images.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, marginTop: 8 }}>
                  {edit.images.map((imgSrc, idx) => (
                    <div key={idx} style={{ position: 'relative', height: 80, borderRadius: 6, overflow: 'hidden', border: idx === 0 ? '2px solid #2563eb' : '1px solid #cbd5e1', background: '#0f172a' }}>
                      <img src={imgSrc} alt={`Vehicle photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {idx === 0 && (
                        <span style={{ position: 'absolute', top: 4, left: 4, background: '#2563eb', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>
                          ★ Cover
                        </span>
                      )}
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(idx)}
                          title="Set as Cover Photo"
                          style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(15,23,42,0.8)', color: '#fff', border: 'none', borderRadius: 3, padding: '2px 4px', fontSize: '0.65rem', cursor: 'pointer' }}
                        >
                          Make Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        title="Remove photo"
                        style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
                  No photos uploaded yet. Upload up to 5 photos (Front view, Interior, Rear, Side, Boot space) to showcase your vehicle to customers.
                </p>
              )}
            </div>

            <p className="eyebrow" style={{ marginTop: 18 }}>ASSIGNED CHAUFFEUR CONTACT</p>
            <div className="form-grid">
              <label>
                Chauffeur Full Name
                <input required placeholder="e.g. Ramesh Kumar" value={edit.driverName} onChange={(e) => setEdit({ ...edit, driverName: e.target.value })} />
              </label>
              <label>
                Mobile / WhatsApp Number (10 digits)
                <input required placeholder="e.g. 9845012345" value={edit.driverPhone} onChange={(e) => setEdit({ ...edit, driverPhone: e.target.value })} />
              </label>
              <label>
                Commercial Driving License
                <input placeholder="e.g. KA0120200012345" value={edit.driverLicense} onChange={(e) => setEdit({ ...edit, driverLicense: e.target.value })} />
              </label>
            </div>

            <button disabled={busy} className="primary" style={{ marginTop: 16 }}>
              {busy ? 'Saving Vehicle & Chauffeur…' : 'Save Vehicle & Chauffeur'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

function PricingPage({ token }: { token: string }) {
  const r = useResource<Pricing[]>('/admin/pricing', token);
  const routes = useResource<Route[]>('/admin/routes', token);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [edit, setEdit] = useState<Route | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (r.data) setPricing(r.data);
  }, [r.data]);

  return (
    <>
      <Heading
        title="Fare Structure & Fixed Routes"
        description="Configure base rates, minimum fares, and surge multiplier."
      />
      {error && <ErrorBox message={error} />}
      {message && <p className="notice">{message}</p>}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api('/admin/pricing', { token, method: 'PUT', body: pricing });
            setMessage('Pricing rates saved successfully.');
            setError('');
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="grid-three">
          {pricing.map((p, i) => (
            <div className="card panel" key={p.vehicleType}>
              <span className="vehicle-icon"><Car /></span>
              <h2>{p.vehicleType}</h2>
              {(['perKm', 'minimum', 'surge'] as const).map((f) => (
                <label key={f}>
                  {f === 'perKm' ? 'Fare per km (₹)' : f === 'minimum' ? 'Minimum fare (₹)' : 'Surge Multiplier'}
                  <input
                    required
                    type="number"
                    min={f === 'surge' ? 1 : 0.01}
                    max={f === 'surge' ? 5 : undefined}
                    step="0.01"
                    value={p[f]}
                    onChange={(e) =>
                      setPricing(
                        pricing.map((v, n) => (n === i ? { ...v, [f]: Number(e.target.value) } : v))
                      )
                    }
                  />
                </label>
              ))}
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setPricing(pricing.map((v, n) => (n === i ? { ...v, surge: v.surge > 1 ? 1 : 1.25 } : v)))
                }
              >
                {p.surge > 1 ? 'Disable Surge' : 'Set 1.25× Peak Surge'}
              </button>
            </div>
          ))}
        </div>
        <button className="primary spaced" disabled={busy || !pricing.length}>
          {busy ? 'Saving Rates…' : 'Save Pricing Rates'}
        </button>
      </form>

      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Popular Fixed Intercity Routes</h2>
            <p className="muted">Direct fixed fares for common outstation pairings.</p>
          </div>
          <button className="secondary" onClick={() => setEdit({ id: '', origin: '', destination: '', distance: 35, fixedPrice: 500, active: true })}>
            <Plus size={16} /> Add Route
          </button>
        </div>
        {routes.data?.map((route) => (
          <div className="assignment-row" key={route.id}>
            <div>
              <h3>{route.origin} → {route.destination}</h3>
              <p>{route.distance} km · {money(route.fixedPrice)} · {route.active ? 'Active' : 'Inactive'}</p>
            </div>
            <button className="secondary" onClick={() => setEdit(route)}>
              Edit
            </button>
          </div>
        ))}
      </section>

      {edit && (
        <Modal title={edit.id ? 'Edit Fixed Route' : 'Create Fixed Route'} onClose={() => setEdit(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await api(`/admin/routes${edit.id ? `/${edit.id}` : ''}`, {
                  token,
                  method: edit.id ? 'PUT' : 'POST',
                  body: edit,
                });
                setEdit(null);
                routes.reload();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {(['origin', 'destination', 'distance', 'fixedPrice'] as const).map((f) => (
              <label key={f}>
                {label(f)}
                <input
                  required
                  type={f === 'distance' || f === 'fixedPrice' ? 'number' : 'text'}
                  min={1}
                  value={edit[f]}
                  onChange={(e) =>
                    setEdit({ ...edit, [f]: f === 'distance' || f === 'fixedPrice' ? Number(e.target.value) : e.target.value })
                  }
                />
              </label>
            ))}
            <label className="checkbox-label" style={{ margin: '14px 0' }}>
              <input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />
              <span style={{ marginLeft: 8 }}>Active Route (Visible in Customer search)</span>
            </label>
            {error && <ErrorBox message={error} />}
            <button className="primary" disabled={busy}>
              Save Route Configuration
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

function Reports({ token }: { token: string }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [driver, setDriver] = useState('');
  const [status, setStatus] = useState('');
  const r = useResource<Store>(`/admin/reports?${new URLSearchParams({ from, to })}`, token);

  const bookings = (r.data?.bookings || []).filter(
    (b) =>
      (!vehicle || b.vehicleType === vehicle) &&
      (!driver || b.driverId === driver) &&
      (!status || b.status === status)
  );

  const revenue = bookings.filter((b) => b.paymentStatus === 'PAID').reduce((a, b) => a + b.fare, 0);

  function exportCsv() {
    const rows = [
      ['Booking Number', 'Customer', 'Phone', 'Pickup', 'Drop', 'Date', 'Time', 'Vehicle', 'Status', 'Payment', 'Fare'],
      ...bookings.map((b) => [
        b.bookingNumber,
        b.name,
        b.phone,
        b.pickup,
        b.drop,
        b.date,
        b.time,
        b.vehicleType,
        b.status,
        b.paymentStatus,
        String(b.fare),
      ]),
    ];
    const content = rows.map((row) => row.map((c) => '"' + c.replaceAll('"', '""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `miles-and-moments-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Heading
        title="Financial & Fleet Analytics"
        description="Booking volume, payment settlement, and driver earnings."
        action={
          <button className="secondary" onClick={exportCsv}>
            <Download size={16} /> Export Operations Records (CSV)
          </button>
        }
      />

      <div className="filters">
        <label>
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </label>
        <select aria-label="Vehicle filter" value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
          <option value="">All Vehicle Categories</option>
          {['Sedan', 'SUV', 'Tempo Traveller'].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <select aria-label="Driver filter" value={driver} onChange={(e) => setDriver(e.target.value)}>
          <option value="">All Chauffeurs</option>
          {r.data?.drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select aria-label="Status filter" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.keys(transitions).map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>

      {r.loading ? (
        <Loading />
      ) : r.error ? (
        <ErrorBox message={r.error} retry={r.reload} />
      ) : (
        <>
          <div className="stats-grid">
            <Stat title="Filtered Bookings" value={bookings.length} sub="In selected date window" />
            <Stat title="Settled Online Revenue" value={money(revenue)} sub="Verified paid bookings" icon={IndianRupee} />
            <Stat
              title="Trips Completed"
              value={bookings.filter((b) => b.status === 'COMPLETED').length}
              sub="Successful drop-offs"
              icon={Check}
            />
            <Stat
              title="Cash Due / Collected"
              value={money(
                bookings
                  .filter((b) => b.paymentStatus === 'CASH' && b.status !== 'CANCELLED')
                  .reduce((s, b) => s + b.fare, 0)
              )}
              sub="Pay-to-driver bookings"
              icon={Clock}
            />
          </div>

          <div className="grid-two">
            <section className="card panel">
              <h2>Revenue Trajectory</h2>
              <RevenueChart bookings={bookings} />
            </section>
            <section className="card panel">
              <h2>Chauffeur Performance Leaderboard</h2>
              {r.data?.drivers.map((d) => (
                <div className="report-row" key={d.id}>
                  <div>
                    <strong>{d.name}</strong>
                    <small>★ {d.rating} · License {d.license}</small>
                  </div>
                  <span>
                    {bookings.filter((b) => b.driverId === d.id && b.status === 'COMPLETED').length} completed
                  </span>
                  <strong>
                    {money(
                      bookings
                        .filter((b) => b.driverId === d.id && b.paymentStatus === 'PAID')
                        .reduce((s, b) => s + b.fare, 0)
                    )}
                  </strong>
                </div>
              ))}
            </section>
          </div>
        </>
      )}
    </>
  );
}

function Notifications({ token }: { token: string }) {
  const r = useResource<Notice[]>('/admin/notifications', token);
  const customers = useResource<Customer[]>('/admin/customers', token);
  const drivers = useResource<Driver[]>('/admin/drivers', token);
  const [form, setForm] = useState({
    recipientType: 'customer',
    recipientId: 'all',
    channel: 'SMS',
    template: 'Booking confirmed',
    message: 'Your booking has been confirmed with Miles & Moments. Chauffeur details will be sent shortly.',
  });
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  return (
    <>
      <Heading
        title="Broadcast Dispatch Alerts"
        description="Send SMS and WhatsApp updates directly to customers and chauffeurs."
      />
      <div className="grid-two">
        <form
          className="card panel"
          onSubmit={(e) => {
            e.preventDefault();
            setPreview(true);
          }}
        >
          <h2>Compose Outbound Notification</h2>
          {error && <ErrorBox message={error} />}
          {success && <p className="notice">{success}</p>}
          <div className="form-grid">
            <label>
              Audience
              <select
                value={form.recipientType}
                onChange={(e) => setForm({ ...form, recipientType: e.target.value, recipientId: 'all' })}
              >
                <option value="customer">Customers</option>
                <option value="driver">Chauffeurs / Drivers</option>
              </select>
            </label>
            <label>
              Recipient
              <select value={form.recipientId} onChange={(e) => setForm({ ...form, recipientId: e.target.value })}>
                <option value="all">All {form.recipientType}s</option>
                {(form.recipientType === 'customer' ? customers.data : drivers.data)?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.phone}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Channel
              <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                {['WhatsApp', 'SMS', 'Email'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Template
              <select
                value={form.template}
                onChange={(e) =>
                  setForm({
                    ...form,
                    template: e.target.value,
                    message: `Miles & Moments Update: ${e.target.value}. Please contact dispatch at +91 80 4712 3456 if you have any questions.`,
                  })
                }
              >
                {['Booking confirmed', 'Driver assigned', 'Trip started', 'Trip completed', 'Emergency notice'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Message Body
            <textarea
              required
              maxLength={2000}
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </label>
          <button className="primary">Preview Message <ArrowRight size={16} /></button>
        </form>

        <section className="card panel">
          <h2>Outbox Log</h2>
          {r.data?.slice(0, 20).map((n) => (
            <div className="notification-row" key={n.id}>
              <Bell size={18} />
              <div>
                <strong>{n.channel} → {n.recipientType}</strong>
                <p className="message-text">{n.message}</p>
                <Badge value={n.status} />
              </div>
            </div>
          ))}
          {r.data?.length === 0 && <Empty title="No notifications sent yet" />}
        </section>
      </div>

      {preview && (
        <Modal title="Confirm Outbound Message" onClose={() => setPreview(false)}>
          <p>
            Sending via <strong>{form.channel}</strong> to{' '}
            {form.recipientId === 'all' ? `all ${form.recipientType}s` : 'selected recipient'}:
          </p>
          <div className="message-preview">{form.message}</div>
          <button
            className="primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const result = await api<{ sent: number; mock: boolean }>('/admin/notifications', {
                  token,
                  method: 'POST',
                  body: form,
                });
                setSuccess(`${result.sent} notification(s) dispatched.`);
                setPreview(false);
                r.reload();
              } catch (e) {
                setError((e as Error).message);
                setPreview(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Dispatching…' : 'Confirm & Send'}
          </button>
        </Modal>
      )}
    </>
  );
}

function SettingsPage({ token }: { token: string }) {
  const r = useResource<Settings & { providers: Record<string, string> }>('/admin/settings', token);
  const [form, setForm] = useState<Settings | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (r.data) setForm(r.data);
  }, [r.data]);

  if (!form) return r.error ? <ErrorBox message={r.error} retry={r.reload} /> : <Loading />;

  return (
    <>
      <Heading
        title="Business Configuration"
        description="Company profile, GST details, policies, and APK release information."
      />
      <form
        className="card panel"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api('/admin/settings', { token, method: 'PUT', body: form });
            setSaved(true);
            setError('');
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {error && <ErrorBox message={error} />}
        {saved && <p className="notice">Settings saved successfully.</p>}
        <div className="form-grid">
          {(
            ['businessName', 'phone', 'email', 'address', 'cancellationHours', 'apkUrl', 'apkVersion', 'apkSize'] as const
          ).map((f) => (
            <label key={f}>
              {label(f.replace(/([A-Z])/g, ' $1'))}
              <input
                required={f !== 'apkUrl'}
                type={f === 'email' ? 'email' : f === 'cancellationHours' ? 'number' : 'text'}
                value={form[f]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [f]: f === 'cancellationHours' ? Number(e.target.value) : e.target.value,
                  })
                }
              />
            </label>
          ))}
        </div>
        {(['terms', 'privacy'] as const).map((f) => (
          <label key={f}>
            {label(f)}
            <textarea
              required
              minLength={10}
              rows={3}
              value={form[f]}
              onChange={(e) => setForm({ ...form, [f]: e.target.value })}
            />
          </label>
        ))}

        <div style={{ margin: '20px 0', padding: '16px 20px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <strong style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
                ⚡ Direct Vehicle Booking & Auto-Confirmation
                <span className="badge" style={{ background: form.directVehicleBooking ? '#ecfdf5' : '#f1f5f9', color: form.directVehicleBooking ? '#065f46' : '#475569', fontWeight: 700 }}>
                  {form.directVehicleBooking ? '✓ Enabled' : 'Disabled'}
                </span>
              </strong>
              <p className="muted" style={{ margin: '6px 0 0', fontSize: '0.88rem', lineHeight: 1.5 }}>
                When enabled, customers view available vehicles directly and book with instant confirmation (no manual admin approval required). Assigned chauffeurs are automatically dispatched via WhatsApp. When disabled, bookings require manual admin assignment.
              </p>
            </div>
            <button
              type="button"
              className={form.directVehicleBooking ? 'primary' : 'secondary'}
              onClick={() => setForm({ ...form, directVehicleBooking: !form.directVehicleBooking })}
              style={{ fontWeight: 600, padding: '8px 16px' }}
            >
              {form.directVehicleBooking ? 'Disable Direct Booking' : 'Enable Direct Booking'}
            </button>
          </div>
        </div>

        <button disabled={busy} className="primary" style={{ marginTop: 14 }}>
          {busy ? 'Saving…' : 'Save Business Settings'}
        </button>
      </form>

      <section className="card panel">
        <h2>System & Provider Status</h2>
        {Object.entries(r.data?.providers || {}).map(([k, v]) => (
          <div className="report-row" key={k}>
            <strong>{label(k)}</strong>
            <span className="badge" style={{ background: '#ecfdf5', color: '#065f46' }}>{v}</span>
          </div>
        ))}
        <div className="report-row">
          <strong>Core Dispatch Engine</strong>
          <span className="badge" style={{ background: '#ecfdf5', color: '#065f46', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /> Operational & Active
          </span>
        </div>
      </section>
    </>
  );
}

function WhatsAppGatewayPage({ token }: { token: string }) {
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [history, setHistory] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [pairingPhone, setPairingPhone] = useState('+91 98450 12345');
  const [pairing, setPairing] = useState(false);
  const [pairError, setPairError] = useState('');
  const [pairSuccess, setPairSuccess] = useState('');
  const [testPhone, setTestPhone] = useState('9845012345');
  const [testMsg, setTestMsg] = useState('🚗 Hello from Miles & Moments! This is an automated WhatsApp dispatch test.');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; id?: string; error?: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api<WhatsAppSession>('/admin/whatsapp/status', { token });
      setSession(res);
      return res;
    } catch {
      return null;
    }
  };

  const fetchHistory = async () => {
    try {
      const list = await api<Notice[]>('/admin/whatsapp/history', { token });
      setHistory(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const curr = await fetchStatus();
      await fetchHistory();
      if (mounted) setLoading(false);
      if (curr && !curr.connected && curr.status === 'DISCONNECTED') {
        try {
          const qrRes = await api<WhatsAppSession>('/admin/whatsapp/generate-qr', { token, method: 'POST' });
          if (mounted) setSession(qrRes);
        } catch {
          // ignore
        }
      }
    })();

    const timer = setInterval(() => {
      fetchStatus();
      fetchHistory();
    }, 4000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [token]);

  const handleGenerateQR = async () => {
    setGenerating(true);
    setPairError('');
    try {
      const res = await api<WhatsAppSession>('/admin/whatsapp/generate-qr?force=true', { token, method: 'POST' });
      setSession(res);
    } catch (e) {
      setPairError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const handleRestart = async () => {
    setRestarting(true);
    setPairError('');
    try {
      const res = await api<{ session: WhatsAppSession }>('/admin/whatsapp/restart', { token, method: 'POST' });
      setSession(res.session);
    } catch (e) {
      setPairError((e as Error).message);
    } finally {
      setRestarting(false);
    }
  };

  const handlePairPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setPairing(true);
    setPairError('');
    setPairSuccess('');
    try {
      const res = await api<{ success: boolean; pairingCode?: string; message?: string; session: WhatsAppSession }>('/admin/whatsapp/pair', {
        token,
        method: 'POST',
        body: { phone: pairingPhone },
      });
      if (res.session) setSession(res.session);
      if (res.pairingCode) {
        setPairSuccess(`Official WhatsApp Code: ${res.pairingCode}. In WhatsApp on your phone, tap Linked Devices > Link with phone number instead, and enter this code.`);
      } else {
        setPairSuccess(`WhatsApp linked successfully with ${pairingPhone}!`);
      }
      fetchHistory();
    } catch (e) {
      setPairError((e as Error).message);
    } finally {
      setPairing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to unlink and disconnect this WhatsApp device? Automated messages will fall back to manual links until re-connected.')) return;
    setDisconnecting(true);
    try {
      const res = await api<{ success: boolean; session: WhatsAppSession }>('/admin/whatsapp/disconnect', {
        token,
        method: 'POST',
      });
      if (res.session) setSession(res.session);
      setPairSuccess('');
    } catch (e) {
      setPairError((e as Error).message);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await api<{ success: boolean; id?: string }>('/admin/whatsapp/send-test', {
        token,
        method: 'POST',
        body: { phone: testPhone, message: testMsg },
      });
      setTestResult({ success: true, id: res.id });
      fetchStatus();
      fetchHistory();
    } catch (e) {
      setTestResult({ success: false, error: (e as Error).message });
    } finally {
      setSendingTest(false);
    }
  };

  const isConnected = session?.connected === true;

  return (
    <>
      <Heading
        eyebrow="COMMUNICATION HUB"
        title="WhatsApp Gateway & Automated Dispatch"
        description="Scan the QR code to link your WhatsApp session. When connected, driver assignments, trip offers, and customer confirmations are dispatched automatically."
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                background: isConnected ? '#ecfdf5' : session?.status === 'SCAN_QR' ? '#fffbeb' : '#f1f5f9',
                color: isConnected ? '#065f46' : session?.status === 'SCAN_QR' ? '#b45309' : '#64748b',
                border: isConnected ? '1px solid #a7f3d0' : session?.status === 'SCAN_QR' ? '1px solid #fde68a' : '1px solid #cbd5e1',
              }}
            >
              {isConnected ? <Wifi size={14} color="#10b981" /> : <WifiOff size={14} />}
              {isConnected ? 'WhatsApp Connected & Active' : session?.status === 'SCAN_QR' ? 'Awaiting QR Scan' : 'Gateway Offline / Disconnected'}
            </span>
            <button className="secondary small" onClick={() => { fetchStatus(); fetchHistory(); }} title="Refresh Gateway Status">
              <RefreshCw size={13} />
            </button>
            {!isConnected && (
              <button className="secondary small" onClick={handleRestart} disabled={restarting} title="Reconnect using the saved session">
                <RefreshCw size={13} className={restarting ? 'spin' : ''} /> {restarting ? 'Reconnecting…' : 'Reconnect'}
              </button>
            )}
          </div>
        }
      />

      {loading && <Loading />}

      {/* Top Banner */}
      <section
        style={{
          background: isConnected
            ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)'
            : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          color: 'white',
          borderRadius: 14,
          padding: '24px 28px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 18,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: isConnected ? '#10b981' : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={22} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: 'white', fontWeight: 800 }}>
                {isConnected ? 'Automated WhatsApp Gateway: Online' : 'WhatsApp Device Linking Required'}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: isConnected ? '#a7f3d0' : '#cbd5e1' }}>
                {isConnected
                  ? `Linked Device: ${session?.device || 'WhatsApp Web'} (${session?.phone || 'Primary'})`
                  : 'Scan the QR code below or enter your WhatsApp number to activate real-time auto-dispatching.'}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: isConnected ? '#a7f3d0' : '#94a3b8' }}>
              Messages Dispatched
            </span>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'white' }}>{session?.messagesSent || 0}</div>
          </div>
          {isConnected && (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '9px 16px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {disconnecting ? 'Unlinking…' : 'Unlink Device'}
            </button>
          )}
        </div>
      </section>

      {/* Main Grid: Device Link / QR Code & Test Dispatch */}
      <div className="grid-two">
        {/* Left Card: QR Scanner or Connected Details */}
        <section className="card panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2>{isConnected ? 'Linked WhatsApp Session' : 'Scan QR Code to Connect'}</h2>
          <p className="muted" style={{ fontSize: 12, marginTop: -4 }}>
            {isConnected
              ? 'Your WhatsApp account is securely connected. All dispatch events are executed without manual intervention.'
              : 'Open WhatsApp on your phone and link this device in under 10 seconds.'}
          </p>

          {pairError && <ErrorBox message={pairError} />}
          {!isConnected && session?.lastError && !pairError && <ErrorBox message={`WhatsApp disconnected: ${session.lastError}`} />}
          {pairSuccess && <p className="notice">{pairSuccess}</p>}

          {!isConnected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 12 }}>
              {/* QR Container */}
              <div
                style={{
                  background: 'white',
                  padding: 16,
                  borderRadius: 14,
                  border: '2px solid #e2e8f0',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minHeight: 260,
                  justifyContent: 'center',
                  width: '100%',
                  maxWidth: 290,
                }}
              >
                {session?.qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.qr}
                    alt="Scan WhatsApp QR"
                    style={{ width: 280, height: 280, maxWidth: '100%', objectFit: 'contain', display: 'block', imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: 30 }}>
                    <Loading />
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>Generating WhatsApp pairing code…</p>
                  </div>
                )}

                {session?.pairingCode && (
                  <div
                    style={{
                      marginTop: 12,
                      background: '#f1f5f9',
                      padding: '5px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: '#0f172a',
                      letterSpacing: '0.06em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>Pairing Code: <strong>{session.pairingCode}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && session.pairingCode) {
                          navigator.clipboard.writeText(session.pairingCode);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }
                      }}
                      style={{ color: '#2563eb', padding: 2 }}
                      title="Copy Pairing Code"
                    >
                      {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="secondary small"
                  onClick={handleGenerateQR}
                  disabled={generating}
                >
                  <RefreshCw size={13} className={generating ? 'spin' : ''} />
                  {generating ? 'Refreshing QR…' : 'Regenerate QR Code'}
                </button>
              </div>

              {/* Step by Step Instructions */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '14px 18px',
                  marginTop: 18,
                  width: '100%',
                  fontSize: 12,
                }}
              >
                <strong style={{ display: 'block', marginBottom: 8, color: '#1e293b' }}>
                  📱 How to link in 3 steps:
                </strong>
                <ol style={{ margin: 0, paddingLeft: 18, color: '#475569', lineHeight: 1.6 }}>
                  <li>Open <strong>WhatsApp</strong> on your mobile device.</li>
                  <li>Tap <strong>Settings</strong> (iOS) or <strong>Menu ⋮</strong> (Android) &gt; <strong>Linked Devices</strong>.</li>
                  <li>Tap <strong>Link a Device</strong> and point your camera at the QR code above.</li>
                </ol>
              </div>

              {/* Instant Link by Number */}
              <form
                onSubmit={handlePairPhone}
                style={{
                  width: '100%',
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: '1px solid #e2e8f0',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Link with Phone Number instead
                </span>
                <p style={{ margin: '0 0 8px', fontSize: 11, color: '#64748b' }}>
                  Prefer not to scan? Enter your WhatsApp phone number to generate an official 8-digit WhatsApp linking code.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    required
                    value={pairingPhone}
                    onChange={(e) => setPairingPhone(e.target.value)}
                    placeholder="+91 98450 12345"
                    style={{ flex: 1, fontSize: 12 }}
                  />
                  <button type="submit" className="primary small" disabled={pairing}>
                    {pairing ? 'Requesting…' : 'Get Pairing Code'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: '#16a34a',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, color: '#14532d' }}>Device Paired & Connected</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#166534' }}>
                      Ready to automatically dispatch WhatsApp messages.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Connected Number</span>
                    <strong style={{ display: 'block', color: '#0f172a' }}>{session?.phone || 'Configured'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Client Device</span>
                    <strong style={{ display: 'block', color: '#0f172a' }}>{session?.device || 'WhatsApp Web Gateway'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Connected At</span>
                    <strong style={{ display: 'block', color: '#0f172a' }}>
                      {session?.connectedAt ? new Date(session.connectedAt).toLocaleTimeString() : 'Active'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Last Message Sent</span>
                    <strong style={{ display: 'block', color: '#0f172a' }}>
                      {session?.lastSentAt ? new Date(session.lastSentAt).toLocaleTimeString() : 'Ready'}
                    </strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="danger-button small"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  <LogOut size={13} />
                  {disconnecting ? 'Unlinking…' : 'Unlink / Disconnect Session'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Card: Live Test Message Sender & Automations */}
        <section className="card panel">
          <h2>Send Live Test Message</h2>
          <p className="muted" style={{ fontSize: 12, marginTop: -4 }}>
            Verify that your WhatsApp gateway successfully sends real-time messages to any phone number.
          </p>

          {testResult && (
            <div
              style={{
                background: testResult.success ? '#f0fdf4' : '#fef2f2',
                border: testResult.success ? '1px solid #bbf7d0' : '1px solid #fecaca',
                padding: '12px 14px',
                borderRadius: 8,
                fontSize: 12,
                color: testResult.success ? '#15803d' : '#b91c1c',
                marginBottom: 16,
              }}
            >
              {testResult.success
                ? `✓ Message successfully dispatched! Message ID: ${testResult.id}`
                : `✗ Failed to send message: ${testResult.error}`}
            </div>
          )}

          <form onSubmit={handleSendTest}>
            <label>
              Recipient WhatsApp Number
              <input
                type="text"
                required
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="9845012345 or +919845012345"
              />
            </label>

            <label>
              Message Content
              <textarea
                required
                rows={4}
                value={testMsg}
                onChange={(e) => setTestMsg(e.target.value)}
              />
            </label>

            <button type="submit" className="primary full" disabled={sendingTest}>
              <Send size={15} />
              {sendingTest ? 'Sending via WhatsApp…' : 'Send WhatsApp Message'}
            </button>
          </form>

          <hr style={{ margin: '22px 0' }} />

          <h3 style={{ fontSize: 14, marginBottom: 12 }}>⚡ Automated Trigger Pipelines</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
            <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <strong style={{ color: '#1e293b', display: 'block', marginBottom: 2 }}>
                1. Chauffeur Trip Offer
              </strong>
              <span style={{ color: '#64748b' }}>
                Dispatches immediately when admin assigns a driver. Includes itinerary, passenger count, and 1-click accept/decline link.
              </span>
            </div>
            <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <strong style={{ color: '#1e293b', display: 'block', marginBottom: 2 }}>
                2. Customer Chauffeur Confirmation
              </strong>
              <span style={{ color: '#64748b' }}>
                Dispatches to customer once driver accepts. Includes chauffeur name, vehicle registration number, and live tracking link.
              </span>
            </div>
            <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <strong style={{ color: '#1e293b', display: 'block', marginBottom: 2 }}>
                3. Passenger Journey Security OTP
              </strong>
              <span style={{ color: '#64748b' }}>
                Provides 4-digit travel departure verification code sent directly to customer WhatsApp.
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Dispatched Logs Table */}
      <section className="card panel" style={{ marginTop: 24 }}>
        <div className="section-title">
          <div>
            <h2>Recent WhatsApp Activity & Dispatches</h2>
            <p className="muted" style={{ fontSize: 12 }}>
              Log of recent transactional notices and offers sent through the WhatsApp gateway.
            </p>
          </div>
          <button className="secondary small" onClick={fetchHistory}>
            <RefreshCw size={13} /> Refresh Activity Log
          </button>
        </div>

        {history.length === 0 ? (
          <Empty title="No WhatsApp messages dispatched yet">Trigger an assignment or send a test message above.</Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Recipient</th>
                  <th>Template / Type</th>
                  <th>Message Preview</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{new Date(item.createdAt).toLocaleTimeString()}</strong>
                      <small>{new Date(item.createdAt).toLocaleDateString()}</small>
                    </td>
                    <td>
                      <strong>{item.recipientId || 'Recipient'}</strong>
                      <small>{item.recipientType || 'general'}</small>
                    </td>
                    <td>
                      <span className="badge">{item.template || 'Transaction'}</span>
                    </td>
                    <td style={{ maxWidth: 380, whiteSpace: 'normal', fontSize: 11, color: '#334155' }}>
                      {item.message}
                    </td>
                    <td>
                      <Badge value={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
