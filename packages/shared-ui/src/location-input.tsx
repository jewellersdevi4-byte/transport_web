'use client';
import { useEffect, useId, useState } from 'react';
import { apiClient } from '../../api-client/src/index';
type Place = { placeId: string; label: string; provider?: 'geoapify' | 'photon' };
export function LocationInput({ value, placeId, onChange, placeholder }: {
  value: string; placeId?: string; onChange: (value: string, placeId: string) => void; placeholder: string;
}) {
  const id = useId();
  const [items, setItems] = useState<Place[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [selectedProvider, setSelectedProvider] = useState<Place['provider']>();
  useEffect(() => {
    setItems([]); setError(''); setActive(-1); setLoading(false);
    if (!open || placeId || value.trim().length < 3) return;
    setLoading(true);
    const controller = new AbortController();
    const deadline = setTimeout(() => { controller.abort(); setLoading(false); setError('Location search timed out. Edit the address to try again.'); }, 5000);
    const timer = setTimeout(() => {
      setLoading(true);
      apiClient<{ suggestions: Place[] }>(`/maps/suggestions?input=${encodeURIComponent(value.trim())}`, { signal: controller.signal })
        .then(r => { if (!controller.signal.aborted) setItems(r.suggestions || []); })
        .catch(e => { if (!controller.signal.aborted) setError(e.message); })
        .finally(() => { clearTimeout(deadline); if (!controller.signal.aborted) setLoading(false); });
    }, 350);
    return () => { clearTimeout(timer); clearTimeout(deadline); controller.abort(); };
  }, [value, placeId, open]);
  function select(place: Place) { onChange(place.label, place.placeId); setSelectedProvider(place.provider); setOpen(false); setItems([]); }
  function useCurrentLocation() {
    if (!navigator.geolocation) { setError('This browser does not support location access.'); return; }
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const { latitude: lat, longitude: lng } = position.coords;
        const result = await apiClient<{ suggestion: Place }>(`/maps/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
        onChange(result.suggestion.label, result.suggestion.placeId);
        setSelectedProvider(result.suggestion.provider);
        setItems([]); setOpen(false);
      } catch (e) { setError(e instanceof Error ? e.message : 'Could not find an address for your current location.'); setOpen(false); }
      finally { setLocating(false); }
    }, error => {
      setLocating(false);
      setError(error.code === error.PERMISSION_DENIED ? 'Allow location access in your browser settings, then try again.' : 'Could not get your location. Check that device location is enabled and try again.');
      setOpen(false);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }
  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setOpen(false);

    }
  }
  return <div className="location-input" onBlur={handleBlur}>
    <input required role="combobox" aria-autocomplete="list" aria-expanded={open && !placeId && items.length > 0} aria-controls={`${id}-list`}
      aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined} autoComplete="off" minLength={2} maxLength={500}
      placeholder={placeholder} value={value} onFocus={() => setOpen(true)}
      onChange={e => { onChange(e.target.value, ''); setSelectedProvider(undefined); setOpen(true); }}
      onKeyDown={e => {
        if (e.key === 'Escape') setOpen(false);
        if (items.length && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); setActive(i => (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length); }
        if (open && e.key === 'Enter' && active >= 0 && items[active]) { e.preventDefault(); select(items[active]); }
        else if (open && e.key === 'Enter' && items.length > 0) { e.preventDefault(); select(items[0]); }
      }}/>
    <button type="button" className="location-current" onClick={useCurrentLocation} disabled={locating}>
      {locating ? 'Finding your location…' : '◎ Use current location'}
    </button>
    {error && !open && <small role="alert" className="location-current-error">{error}</small>}
    {open && !placeId && value.trim().length >= 3 && <div className="location-suggestions">
      {loading && <p role="status">Searching locations…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && items.length === 0 && <p>No locations found. Try a street, landmark or building name with the city.</p>}
      <div id={`${id}-list`} role="listbox">{items.map((item, i) => <button type="button" key={item.placeId} id={`${id}-${i}`} role="option" aria-selected={active === i}
        onMouseDown={e => e.preventDefault()} onClick={() => select(item)}>{item.label}</button>)}</div>
      {items.length > 0 && <span className="google-attribution">{items.some(item => item.provider === 'geoapify') && <>Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a> · </>}<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" translate="no">© OpenStreetMap contributors</a></span>}
    </div>}
    {placeId && <><small className="muted">Location selected</small><span className="google-attribution">{selectedProvider === 'geoapify' && <>Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a> · </>}<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" translate="no">© OpenStreetMap contributors</a></span></>}
  </div>;
}
