'use client';
import { useEffect, useId, useState } from 'react';
import { apiClient } from '../../api-client/src/index';

type Place = {
  placeId: string;
  label: string;
  provider?: 'google' | 'google_maps_link' | 'coordinates' | 'geoapify' | 'photon';
};

function isLikelyMapLinkOrCoords(str: string): boolean {
  const s = str.trim();
  return /^(https?:\/\/|www\.)/i.test(s) ||
    /maps\.app\.goo\.gl|goo\.gl\/maps|google\.com\/maps|maps\.google|maps\.apple\.com/i.test(s) ||
    /^[+]?-?\d{1,2}(?:\.\d+)?[,\s]+[+]?-?\d{1,3}(?:\.\d+)?$/.test(s) ||
    /^\d+[°\s]+\d+['\s]+[\d.]+?[\"\s]*[NSEW]/i.test(s);
}

function renderAttribution(provider?: Place['provider']) {
  if (provider === 'google') {
    return <span className="google-attribution">Powered by <strong>Google</strong></span>;
  }
  if (provider === 'google_maps_link') {
    return <span className="google-attribution">Resolved from <strong>Google Maps</strong></span>;
  }
  if (provider === 'coordinates') {
    return <span className="google-attribution">Resolved from <strong>GPS Coordinates</strong></span>;
  }
  if (provider === 'geoapify') {
    return <span className="google-attribution">Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" translate="no">© OpenStreetMap contributors</a></span>;
  }
  return <span className="google-attribution"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" translate="no">© OpenStreetMap contributors</a></span>;
}

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
    const isMapInput = isLikelyMapLinkOrCoords(value);
    const deadlineMs = isMapInput ? 8000 : 5000;
    const deadline = setTimeout(() => {
      controller.abort();
      setLoading(false);
      setError(isMapInput ? 'Could not resolve location from this link. Try searching the place name directly.' : 'Location search timed out. Edit the address to try again.');
    }, deadlineMs);
    const debounceMs = isMapInput ? 80 : 350;
    const timer = setTimeout(() => {
      setLoading(true);
      apiClient<{ suggestions: Place[] }>(`/maps/suggestions?input=${encodeURIComponent(value.trim())}`, { signal: controller.signal })
        .then(r => {
          if (!controller.signal.aborted) {
            const list = r.suggestions || [];
            setItems(list);
            // If user entered a map link or coordinates and 1 resolved place was returned, auto-select it immediately
            if (isMapInput && list.length === 1 && (list[0].provider === 'google_maps_link' || list[0].provider === 'coordinates')) {
              select(list[0]);
            }
          }
        })
        .catch(e => { if (!controller.signal.aborted) setError(e.message); })
        .finally(() => { clearTimeout(deadline); if (!controller.signal.aborted) setLoading(false); });
    }, debounceMs);
    return () => { clearTimeout(timer); clearTimeout(deadline); controller.abort(); };
  }, [value, placeId, open]);

  function select(place: Place) {
    onChange(place.label, place.placeId);
    setSelectedProvider(place.provider);
    setOpen(false);
    setItems([]);
  }

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
      aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined} autoComplete="off" minLength={2} maxLength={2000}
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
      {loading && <p role="status">{isLikelyMapLinkOrCoords(value) ? 'Resolving location from Google Maps link…' : 'Searching locations…'}</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && items.length === 0 && <p>No locations found. Try a street, landmark, building name, or paste a Google Maps link.</p>}
      <div id={`${id}-list`} role="listbox">{items.map((item, i) => <button type="button" key={item.placeId} id={`${id}-${i}`} role="option" aria-selected={active === i}
        onMouseDown={e => e.preventDefault()} onClick={() => select(item)}>{item.provider === 'google_maps_link' || item.provider === 'coordinates' ? `📍 ${item.label}` : item.label}</button>)}</div>
      {items.length > 0 && renderAttribution(items[0]?.provider)}
    </div>}
    {placeId && <><small className="muted">Location selected</small>{renderAttribution(selectedProvider)}</>}
  </div>;
}
