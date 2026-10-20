'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {AlertCircle,Check,Car,MapPin,ArrowRight,LoaderCircle,X,Phone,Download,FileText} from 'lucide-react';
import {apiClient,ApiError} from '../../api-client/src/index';
export const api=<T,>(path:string,options:{method?:'GET'|'POST'|'PUT'|'PATCH'|'DELETE';body?:unknown;token?:string;baseUrl?:string}={})=>apiClient<T>(path,options);
import {label,money} from '../../shared-utils/src/index';
import type {Booking,Driver,Vehicle,Settings} from '../../shared-types/src/index';
export {label,money};
export function Badge({value}:{value:string}){return <span className={`badge ${value.toLowerCase()}`}>{label(value)}</span>;}
export function Empty({title='Nothing here yet',children}:{title?:string;children?:ReactNode}){return <div className="empty"><Car size={32}/><h3>{title}</h3>{children}</div>;}
export function ErrorBox({message,retry}:{message:string;retry?:()=>void}){return <div role="alert" className="error"><AlertCircle size={18}/><span>{message}</span>{retry&&<button onClick={retry}>Retry</button>}</div>;}
export function Loading(){return <div className="empty" role="status"><LoaderCircle className="spin"/> Loading your journey…</div>;}
export function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){useEffect(()=>{const handler=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};document.addEventListener('keydown',handler);return()=>document.removeEventListener('keydown',handler);},[onClose]);return <div className="overlay" onClick={onClose}><section className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={e=>e.stopPropagation()}><div className="section-title"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X/></button></div>{children}</section></div>;}
export function useSession(role:string){const [token,setToken]=useState('');const [ready,setReady]=useState(false);useEffect(()=>{setToken(sessionStorage.getItem(`${role}-token`)||'');setReady(true);},[role]);return{token,ready,login:(t:string)=>{sessionStorage.setItem(`${role}-token`,t);setToken(t);},logout:()=>{sessionStorage.removeItem(`${role}-token`);setToken('');}};}
export function useResource<T>(path:string,token?:string){const [data,setData]=useState<T|null>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [version,setVersion]=useState(0);useEffect(()=>{let active=true;setLoading(true);api<T>(path,{token}).then(d=>{if(active){setData(d);setError('');}}).catch((e:ApiError)=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[path,token,version]);return{data,error,loading,reload:()=>setVersion(v=>v+1)};}
export function Auth({admin=false,onLogin}:{admin?:boolean;onLogin:(token:string)=>void}) {
  const [email,setEmail]=useState('');
  const [code,setCode]=useState('');
  const [login,setLogin]=useState('');
  const [password,setPassword]=useState('');
  const [sent,setSent]=useState(false);
  const [hint,setHint]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [countdown,setCountdown]=useState(0);
  useEffect(()=>{if(countdown>0){const timer=setTimeout(()=>setCountdown(n=>n-1),1000);return()=>clearTimeout(timer);}},[countdown]);
  async function sendCode() {
    setBusy(true);setError('');
    try {
      const normalized=email.trim().toLowerCase();
      const res=await api<{message?:string;code?:string;mockCode?:string;retryAfterSeconds?:number}>('/auth/customer/send-otp',{method:'POST',body:{email:normalized}});
      setSent(true);setCode(res.code||res.mockCode||'');setCountdown(res.retryAfterSeconds||30);
      setHint(res.code||res.mockCode?`Verification code: ${res.code||res.mockCode}`:'Check your email, including spam, for a six-digit code. Valid for 5 minutes.');
    } catch(e) {setError((e as Error).message);} finally {setBusy(false);}
  }
  async function submit(e:React.FormEvent) {
    e.preventDefault();
    if(!admin&&!sent){await sendCode();return;}
    setBusy(true);setError('');
    try {
      const body=admin?{login,password}:{email:email.trim().toLowerCase(),code};
      const r=await api<{token:string}>(admin?'/auth/admin/login':'/auth/customer/verify-otp',{method:'POST',body});
      onLogin(r.token);
    } catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <form className="auth-card card" onSubmit={submit}>
    <img className="auth-brand-logo" src="/brand/dj-cabs-logo.png" alt="DJ Cabs" />
    <p className="eyebrow">{admin?'OPERATIONS, SIMPLIFIED':'YOUR NEXT JOURNEY STARTS HERE'}</p>
    <h1>{admin?'Welcome back, dispatch.':'Let’s get you moving.'}</h1>
    <p className="muted">{admin?'Sign in to manage your fleet and every journey.':'Sign in with a verification code sent to your email.'}</p>
    {error&&<ErrorBox message={error}/>}
    <label>{admin?'Admin login':'Email address'}<input required type={admin?'text':'email'} value={admin?login:email}
      placeholder={admin?'Admin email or login':'you@example.com'} autoComplete={admin?'username':'email'}
      onChange={e=>admin?setLogin(e.target.value):setEmail(e.target.value)} disabled={busy||(!admin&&sent)}/></label>
    {admin?<label>Password<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></label>:
      sent&&<label>Six-digit verification code<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} autoComplete="one-time-code"/></label>}
    {hint&&<p className="notice" role="status">{hint}</p>}
    <button type="submit" className="primary full" disabled={busy}>{busy?'Please wait…':admin?'Sign in':sent?'Verify & continue':'Send verification code'}<ArrowRight size={18}/></button>
    {!admin&&sent&&<><button type="button" className="text-button" disabled={busy||countdown>0} onClick={()=>void sendCode()}>{countdown>0?`Resend in ${countdown}s`:'Resend code'}</button>
    <button type="button" className="text-button" disabled={busy} onClick={()=>{setSent(false);setCode('');setHint('');setError('');}}>Change email</button></>}
    {admin&&<button type="button" className="text-button" onClick={async()=>{try{const r=await api<{message:string}>('/auth/admin/forgot-password',{method:'POST'});setHint(r.message);}catch(e){setError((e as Error).message);}}}>Forgot password?</button>}
  </form>;
}

export function BookingCard({booking:b,onClick}:{booking:Booking;onClick:()=>void}){return <button className="booking-card card" onClick={onClick}><div className="section-title"><strong>#{b.bookingNumber}</strong><Badge value={b.status}/></div><h3>{b.pickup} <ArrowRight size={16}/> {b.drop}</h3><p className="muted">{b.date} · {b.time} · {b.vehicleType}</p><div className="section-title"><span>{b.name}</span><strong>View details <ArrowRight size={16}/></strong></div></button>;}
export type DetailBooking=Booking&{driver?:Driver;vehicle?:Vehicle};
export function BookingInfo({b}:{b:DetailBooking}){
  const stages=['PENDING','CONFIRMED','DRIVER_ASSIGNED','TRIP_STARTED','COMPLETED'];
  return <>
    <div className="section-title"><p className="eyebrow">#{b.bookingNumber}</p><Badge value={b.status}/></div>
    <div className="route-display"><MapPin/><div><small>YOUR JOURNEY</small><h2>{b.pickup}</h2>{b.stops&&b.stops.length>0&&<p className="muted">via {b.stops.join(' → ')}</p>}<p className="muted">to</p><h2>{b.drop}</h2></div></div>
    <div className="info-grid">{[['Pickup',`${b.date} · ${b.time}`],['Trip',`${label(b.tripType)}${b.stops&&b.stops.length>0?` (${b.stops.length} stops)`:''}${b.returnDate?` · Return ${b.returnDate}`:''}`],['Vehicle',`${b.vehicleType} · ${b.vehicle?.number||b.vehicle?.model||'Assigned upon dispatch'}`],['Travellers',`${b.passengers} passengers · ${b.luggage} bags`],['Customer',`${b.name} · ${b.phone}`],['Status',`${label(b.status)} · Confirmed`]].map(([title,value])=><div key={title}><small>{title}</small><strong>{value}</strong></div>)}</div>
    {b.requests&&<p className="notice">{b.requests}</p>}
    <h3>Journey progress</h3>
    <ol className="timeline">{stages.map((s,i)=><li key={s} className={stages.indexOf(b.status)>=i?'done':''}><span>{stages.indexOf(b.status)>=i?<Check size={14}/>:i+1}</span>{label(s==='PENDING'?'BOOKING_RECEIVED':s)}</li>)}</ol>
    {b.status==='CANCELLED'&&<p className="error">This booking was cancelled.{b.paymentStatus==='PAID'?' Support will review the payment for a refund.':''}</p>}
    {b.driver ? (
      <div className="driver-summary">
        <div className="avatar">{b.driver.name.split(' ').map(n=>n[0]).join('')}</div>
        <div>
          <h3>{b.driver.name}</h3>
          <p>{b.vehicle?.model} · {b.vehicle?.number}</p>
          <Badge value={b.assignment}/>
        </div>
        <a className="secondary" href={`tel:${b.driver.phone}`}><Phone size={16}/> Call driver</a>
      </div>
    ) : (
      b.status === 'DRIVER_ASSIGNED' && (
        <div className="notice" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
          <Car size={20} />
          <span>Chauffeur dispatch in progress. Driver and vehicle details will appear here as soon as accepted.</span>
        </div>
      )
    )}
    {b.driverLocation && (
      <div className="notice" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={18} style={{ color: '#0f766e' }} />
          <span><strong>Chauffeur Live Location Active:</strong> Last updated {new Date(b.driverLocation.updatedAt).toLocaleTimeString()}</span>
        </div>
        <a
          href={`https://www.google.com/maps?q=${b.driverLocation.lat},${b.driverLocation.lng}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: '#0f766e', fontWeight: 600, textDecoration: 'underline' }}
        >
          View on Map →
        </a>
      </div>
    )}
    <details><summary>Status history</summary>{b.history.map((h,i)=><p key={i}>{label(h.status)} · {new Date(h.at).toLocaleString()} · {h.by==='admin'?'Dispatch':h.by==='Payment provider'?'Payment verified':'Journey update'}</p>)}</details>
  </>;
}
export function Invoice({id,token,prefix}:{id:string;token:string;prefix:string}){const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [data,setData]=useState<{invoiceNumber:string;business:Settings;booking:Booking;total:number}|null>(null);const [viewing,setViewing]=useState(false);async function fetchInvoice(){if(data)return data;const r=await api<{invoiceNumber:string;business:Settings;booking:Booking;total:number}>(`/${prefix}/bookings/${id}/invoice`,{token});setData(r);return r;}async function download(){setBusy(true);setError('');try{const r=await fetchInvoice();const routeText=r.booking.stops&&r.booking.stops.length?`${r.booking.pickup} via ${r.booking.stops.join(', ')} → ${r.booking.drop}`:`${r.booking.pickup} → ${r.booking.drop}`;const text=[r.business.businessName,r.business.address,r.business.phone,r.business.email,'',`INVOICE ${r.invoiceNumber}`,`Booking: ${r.booking.bookingNumber}`,`Customer: ${r.booking.name}`,`Route: ${routeText}`,`Vehicle: ${r.booking.vehicleType}`,`Pickup: ${r.booking.date} ${r.booking.time}`,`Payment: ${r.booking.paymentStatus}`,`Total: INR ${r.total}`].join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download=`${r.invoiceNumber}.txt`;a.click();URL.revokeObjectURL(url);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}async function view(){setBusy(true);setError('');try{await fetchInvoice();setViewing(true);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}return <><div className="invoice-actions"><button className="secondary" onClick={view} disabled={busy}><FileText size={16}/> View invoice</button><button className="secondary" onClick={download} disabled={busy}><Download size={16}/>{busy?'Generating…':'Download invoice'}</button></div>{error&&<ErrorBox message={error} retry={download}/>}{viewing&&data&&<Modal title={`Invoice ${data.invoiceNumber}`} onClose={()=>setViewing(false)}><div className="invoice-paper"><div className="section-title"><div><h2>{data.business.businessName}</h2><p className="muted">{data.business.address}</p><small>{data.business.phone} · {data.business.email}</small></div><Badge value={data.booking.paymentStatus}/></div><hr/><div className="info-grid"><div><small>INVOICE NO.</small><strong>{data.invoiceNumber}</strong></div><div><small>BOOKING NO.</small><strong>#{data.booking.bookingNumber}</strong></div><div><small>CUSTOMER</small><strong>{data.booking.name}</strong></div><div><small>DATE</small><strong>{data.booking.date} {data.booking.time}</strong></div><div><small>ROUTE</small><strong>{data.booking.pickup}{data.booking.stops&&data.booking.stops.length?` (via ${data.booking.stops.join(', ')})`:''} → {data.booking.drop}</strong></div><div><small>VEHICLE</small><strong>{data.booking.vehicleType}</strong></div></div><hr/><div className="section-title"><span>Fare & Charges</span><strong>{money(data.total)}</strong></div><div className="section-title"><span>Payment Method</span><strong>{label(data.booking.paymentMethod)} ({label(data.booking.paymentStatus)})</strong></div><div className="section-title" style={{fontSize:'1.2rem'}}><strong>Total Paid / Due</strong><strong className="price">{money(data.total)}</strong></div><div className="actions" style={{marginTop:'1.5rem'}}><button className="primary" onClick={download}><Download size={16}/> Download PDF/Text</button><button className="secondary" onClick={()=>setViewing(false)}>Close</button></div></div></Modal>}</>;}
