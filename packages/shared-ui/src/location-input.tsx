'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { LocateFixed, MapPin, Map, ExternalLink, X } from 'lucide-react';
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

function MapPickerModal({
  isOpen,
  onClose,
  onSelect,
  initialLat = 12.9716,
  initialLng = 77.5946,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (label: string, placeId: string) => void;
  initialLat?: number;
  initialLng?: number;
}) {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [address, setAddress] = useState('Position pin to see address…');
  const [locating, setLocating] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const reverseGeocodePoint = (pointLat: number, pointLng: number) => {
    setLoadingAddress(true);
    apiClient<{ suggestion: Place }>(`/maps/reverse?lat=${encodeURIComponent(pointLat)}&lng=${encodeURIComponent(pointLng)}`)
      .then(res => {
        setAddress(res.suggestion.label);
      })
      .catch(() => {
        setAddress(`Pinned Location (${pointLat.toFixed(5)}, ${pointLng.toFixed(5)})`);
      })
      .finally(() => setLoadingAddress(false));
  };

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        reverseGeocodePoint(latitude, longitude);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch {}
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    let active = true;

    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, { zoomControl: true }).setView([lat, lng], 15);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap, © CARTO',
      }).addTo(map);

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: '<div class="premium-map-pin"><span></span></div>',
        iconSize: [30, 30],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([lat, lng], { draggable: true, icon: customIcon }).addTo(map);

      marker.on('dragend', () => {
        if (!active) return;
        const pos = marker.getLatLng();
        setLat(pos.lat);
        setLng(pos.lng);
        reverseGeocodePoint(pos.lat, pos.lng);
      });

      map.on('click', (e: any) => {
        if (!active) return;
        marker.setLatLng(e.latlng);
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
        reverseGeocodePoint(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Auto-fetch address for initial center
      reverseGeocodePoint(lat, lng);

      // Auto locate if browser GPS is available
      if (navigator.geolocation) {
        locateMe();
      }
    };

    if (!(window as any).L) {
      const existingLink = document.querySelector('link[href*="leaflet"]');
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      const existingScript = document.querySelector('script[src*="leaflet"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => { if (active) initMap(); };
        document.body.appendChild(script);
      } else {
        const check = setInterval(() => {
          if ((window as any).L) {
            clearInterval(check);
            if (active) initMap();
          }
        }, 100);
      }
    } else {
      setTimeout(initMap, 50);
    }

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch {}
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="map-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="map-modal-content">
        <div className="map-modal-header">
          <h3><MapPin size={18} /> Pick location on map</h3>
          <button type="button" className="map-modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div ref={mapContainerRef} className="map-canvas-container" />
        <div className="map-modal-footer">
          <div className="map-address-banner">
            <MapPin size={16} />
            <div>
              <strong>{loadingAddress ? 'Detecting address…' : address}</strong>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                Click anywhere on the map or drag the pin to adjust your exact pickup/drop location.
              </div>
            </div>
          </div>
          <div className="map-modal-actions">
            <button type="button" className="map-locate-btn" onClick={locateMe} disabled={locating}>
              {locating ? 'Locating…' : <><LocateFixed size={15} /> Locate me (GPS)</>}
            </button>
            <button
              type="button"
              className="map-confirm-btn"
              disabled={loadingAddress}
              onClick={() => {
                onSelect(address, `osm:${lat},${lng}:PIN_ON_MAP`);
                onClose();
              }}
            >
              ✓ Confirm This Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [mapOpen, setMapOpen] = useState(false);

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

  async function useCurrentLocation() {
    setLocating(true);
    setError('');

    const tryReverse = async (lat: number, lng: number, providerTag: Place['provider']) => {
      const result = await apiClient<{ suggestion: Place }>(`/maps/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
      onChange(result.suggestion.label, result.suggestion.placeId);
      setSelectedProvider(providerTag || result.suggestion.provider);
      setItems([]);
      setOpen(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async position => {
          try {
            const { latitude: lat, longitude: lng } = position.coords;
            await tryReverse(lat, lng, 'coordinates');
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not find an address for your GPS coordinates.');
            setOpen(false);
          } finally {
            setLocating(false);
          }
        },
        async () => {
          // GPS failed or permission denied -> Try network IP-based fallback
          try {
            const ipRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
            if (ipRes.ok) {
              const ipData = await ipRes.json() as { latitude?: number; longitude?: number; city?: string; region?: string };
              if (ipData.latitude && ipData.longitude) {
                await tryReverse(ipData.latitude, ipData.longitude, 'coordinates');
                setLocating(false);
                return;
              }
            }
          } catch {}
          setLocating(false);
          setError('GPS location permission was denied. Tap "Pick on Map" or paste a Google Maps link.');
          setOpen(false);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    } else {
      setLocating(false);
      setError('This browser does not support GPS. Tap "Pick on Map" or paste a Google Maps link.');
    }
  }

  function openGoogleMaps() {
    window.open('https://www.google.com/maps/@?api=1&map_action=map', '_blank', 'noopener,noreferrer');
    setError('Opened Google Maps. Locate your place, tap Share, and paste the link here.');
  }

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setOpen(false);
    }
  }

  return (
    <div className="location-input" onBlur={handleBlur}>
      <input
        required
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && !placeId}
        aria-controls={`${id}-list`}
        aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
        autoComplete="off"
        minLength={2}
        maxLength={2000}
        placeholder={placeholder}
        value={value}
        onFocus={() => setOpen(true)}
        onChange={e => { onChange(e.target.value, ''); setSelectedProvider(undefined); setOpen(true); }}
        onKeyDown={e => {
          if (e.key === 'Escape') setOpen(false);
          if (items.length && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            setActive(i => (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length);
          }
          if (open && e.key === 'Enter' && active >= 0 && items[active]) {
            e.preventDefault();
            select(items[active]);
          } else if (open && e.key === 'Enter' && items.length > 0) {
            e.preventDefault();
            select(items[0]);
          }
        }}
      />

      {/* Multiple ways to get current location */}
      <div className="location-actions-bar">
        <button
          type="button"
          className="location-btn-link"
          onClick={useCurrentLocation}
          disabled={locating}
          title="Auto-detect GPS location"
        >
          {locating ? 'Detecting location…' : <><LocateFixed size={15} /> Use current location</>}
        </button>

        <button
          type="button"
          className="location-btn-link"
          onClick={() => { setOpen(false); setMapOpen(true); }}
          title="Choose exact spot with draggable pin"
        >
          <Map size={16} /> Pick on map
        </button>

        <button
          type="button"
          className="location-btn-link"
          onClick={openGoogleMaps}
          title="Open Google Maps to copy link"
        >
          <ExternalLink size={15} /> Open Google Maps
        </button>
      </div>

      {error && !open && <small role="alert" className="location-current-error">{error}</small>}

      {/* Suggestions and Quick-Action Dropdown */}
      {open && !placeId && (
        <div className="location-suggestions">
          {/* Quick choices when starting search or empty input */}
          {value.trim().length < 3 && (
            <div style={{ paddingBottom: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Options to set location
              </div>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={useCurrentLocation}
                disabled={locating}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}
              >
                  <ExternalLink size={18} />
                <div>
                  <strong style={{ display: 'block', fontSize: 13, color: '#0284c7' }}>Use current location</strong>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Auto-detect device GPS location</span>
                </div>
              </button>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { setOpen(false); setMapOpen(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}
              >
                <Map size={18} />
                <div>
                  <strong style={{ display: 'block', fontSize: 13, color: '#0f172a' }}>Pick on map</strong>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Drag pin or click map to choose exact spot</span>
                </div>
              </button>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={openGoogleMaps}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}
              >
                <LocateFixed size={18} />
                <div>
                  <strong style={{ display: 'block', fontSize: 13, color: '#0f172a' }}>Open Google Maps</strong>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Find in Google Maps, copy link, and paste here</span>
                </div>
              </button>
            </div>
          )}

          {/* Search results when typing 3+ characters */}
          {value.trim().length >= 3 && (
            <>
              {loading && <p role="status">{isLikelyMapLinkOrCoords(value) ? 'Resolving location from Google Maps link…' : 'Searching locations…'}</p>}
              {error && <p role="alert">{error}</p>}
              {!loading && !error && items.length === 0 && (
                <p>No locations found. Try a street, landmark, building name, or paste a Google Maps link.</p>
              )}
              <div id={`${id}-list`} role="listbox">
                {items.map((item, i) => (
                  <button
                    type="button"
                    key={item.placeId}
                    id={`${id}-${i}`}
                    role="option"
                    aria-selected={active === i}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => select(item)}
                  >
                    {item.provider === 'google_maps_link' || item.provider === 'coordinates' ? <><MapPin size={14} /> {item.label}</> : item.label}
                  </button>
                ))}
              </div>
              {items.length > 0 && renderAttribution(items[0]?.provider)}
            </>
          )}
        </div>
      )}

      {placeId && (
        <>
          <small className="muted">Location selected</small>
          {renderAttribution(selectedProvider)}
        </>
      )}

      {/* Interactive Map Picker Modal */}
      <MapPickerModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        onSelect={(selectedLabel, selectedPlaceId) => {
          onChange(selectedLabel, selectedPlaceId);
          setSelectedProvider('coordinates');
        }}
      />
    </div>
  );
}

