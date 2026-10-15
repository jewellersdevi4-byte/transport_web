'use client';
import { useEffect, useId, useState } from 'react';
import { apiClient } from '../../api-client/src/index';
type Place = { placeId: string; label: string };
export function LocationInput({ value, placeId, onChange, placeholder }: {
  value: string; placeId?: string; onChange: (value: string, placeId: string) => void; placeholder: string;
}) {
  const id = useId();
  const [items, setItems] = useState<Place[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  useEffect(() => {
    setItems([]); setError(''); setActive(-1); setLoading(false);
    if (!open || placeId || value.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      apiClient<{ suggestions: Place[] }>(`/maps/suggestions?input=${encodeURIComponent(value.trim())}`, { signal: controller.signal })
        .then(r => { if (!controller.signal.aborted) setItems(r.suggestions || []); })
        .catch(e => { if (!controller.signal.aborted) setError(e.message); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [value, placeId, open]);
  function select(place: Place) { onChange(place.label, place.placeId); setOpen(false); setItems([]); }
  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setOpen(false);
      if (!placeId && value.trim().length >= 2) {
        if (items.length > 0) {
          select(items[0]);
        } else {
          const fallbackId = 'place_' + Buffer.from(value.trim().toLowerCase()).toString('base64url').slice(0, 16);
          onChange(value.trim(), fallbackId);
        }
      }
    }
  }
  return <div className="location-input" onBlur={handleBlur}>
    <input required role="combobox" aria-autocomplete="list" aria-expanded={open && !placeId && items.length > 0} aria-controls={`${id}-list`}
      aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined} autoComplete="off" minLength={2} maxLength={500}
      placeholder={placeholder} value={value} onFocus={() => setOpen(true)}
      onChange={e => { onChange(e.target.value, ''); setOpen(true); }}
      onKeyDown={e => {
        if (e.key === 'Escape') setOpen(false);
        if (items.length && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); setActive(i => (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length); }
        if (open && e.key === 'Enter' && active >= 0 && items[active]) { e.preventDefault(); select(items[active]); }
        else if (open && e.key === 'Enter' && items.length > 0) { e.preventDefault(); select(items[0]); }
      }}/>
    {open && !placeId && value.trim().length >= 2 && <div className="location-suggestions">
      {loading && <p role="status">Searching locations…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && items.length === 0 && <p>Type to search, then select a location.</p>}
      <div id={`${id}-list`} role="listbox">{items.map((item, i) => <button type="button" key={item.placeId} id={`${id}-${i}`} role="option" aria-selected={active === i}
        onMouseDown={e => e.preventDefault()} onClick={() => select(item)}>{item.label}</button>)}</div>
      {items.length > 0 && <span className="google-attribution" translate="no">Google Maps</span>}
    </div>}
    {placeId && <small className="muted">Location selected</small>}
  </div>;
}
