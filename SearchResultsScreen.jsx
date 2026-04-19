// SearchResultsScreen.jsx — Ritchie Bros search results (auctions + buy now)
const { useState: useS, useRef: useR, useEffect: useE } = React;

function fmtPrice(n) {
  return '$' + n.toLocaleString('en-US');
}
function fmtK(n) {
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K';
  return String(n);
}

const OFFER_WINDOW_MAX_MIN = 30 * 24 * 60;

function fmtOfferMinutesLeft(m) {
  if (m == null || m <= 0) return 'Ending soon';
  const clamped = Math.min(m, OFFER_WINDOW_MAX_MIN);
  const d = Math.floor(clamped / (24 * 60));
  const h = Math.floor((clamped % (24 * 60)) / 60);
  const min = Math.floor(clamped % 60);
  if (d > 0) return h > 0 ? `${d}d ${h}h left` : `${d}d left`;
  if (clamped >= 60) return `${h}h ${min}m left`;
  return `${Math.max(1, Math.floor(clamped))}m left`;
}

function fmtMinutesLeftShort(minutesLeft) {
  if (minutesLeft == null) return '';
  if (minutesLeft < 60) return `${minutesLeft}m left`;
  return `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m left`;
}

function closingThursdayPhrase(closingAt) {
  if (typeof closingAt !== 'string') return '';
  return closingAt.replace(/^Thu\s+/i, '').trim();
}

/** Unified marketplace + catalog row kinds for pills and layout */
function listingKind(L) {
  if (L.listingKind) return L.listingKind;
  if (L.type === 'auction') return 'auction';
  if (L.type === 'buynow') return 'buynow_offer';
  return 'buynow_offer';
}

/** Each query token must appear in title, make, or model (AND). Empty query matches all. */
function listingMatchesSearchQuery(L, query) {
  const raw = String(query ?? '')
    .trim()
    .replace(/[\u201c\u201d]/g, '')
    .replace(/"/g, '');
  if (!raw) return true;
  const blob = `${L.title || ''} ${L.make || ''} ${L.model || ''}`.toLowerCase();
  const terms = raw.toLowerCase().split(/\s+/).filter(Boolean);
  return terms.every(t => blob.includes(t));
}

function mergeAllResults() {
  return [
    ...LISTINGS.map(L => ({
      ...L,
      listingKind: L.type === 'auction' ? 'auction' : 'buynow_offer',
    })),
    ...ABSOLUTE_SALE.map(L => ({ ...L, listingKind: 'absolute_sale' })),
    ...CLOSING_TODAY.map(L => ({ ...L, listingKind: 'closing_today' })),
  ];
}

function computeQuickFilterCounts(mergedFeed) {
  const merged = mergedFeed == null ? mergeAllResults() : mergedFeed;
  return {
    reserveMet: merged.filter(L =>
      listingKind(L) === 'absolute_sale' || L.reserveMet === true
    ).length,
    closingToday: merged.filter(L => listingKind(L) === 'closing_today').length,
    absoluteSale: merged.filter(L => listingKind(L) === 'absolute_sale').length,
    greatPrice: merged.filter(L => L.priceTier === 'great').length,
    goodPrice: merged.filter(L => L.priceTier === 'good').length,
  };
}

const QUICK_FILTER_LABELS = {
  reserveMet: 'Reserve Met',
  closingToday: 'Closing Today',
  absoluteSale: 'Absolute Sale',
  greatPrice: 'Great Price',
  goodPrice: 'Good Price',
};

function matchesQuickFilter(L, key) {
  const k = listingKind(L);
  if (key === 'reserveMet')
    return k === 'absolute_sale' || L.reserveMet === true;
  if (key === 'closingToday') return k === 'closing_today';
  if (key === 'absoluteSale') return k === 'absolute_sale';
  if (key === 'greatPrice') return L.priceTier === 'great';
  if (key === 'goodPrice') return L.priceTier === 'good';
  return false;
}

function passesQuickFilters(L, selected) {
  if (!selected || selected.size === 0) return true;
  for (const q of selected) {
    if (matchesQuickFilter(L, q)) return true;
  }
  return false;
}

const FAR_FUTURE_MIN = Number.MAX_SAFE_INTEGER;

function parseAuctionClosingMinutes(closing) {
  if (!closing || typeof closing !== 'string') return FAR_FUTURE_MIN;
  const dh = closing.match(/(\d+)\s*d\s*(\d+)\s*h/i);
  if (dh) return parseInt(dh[1], 10) * 1440 + parseInt(dh[2], 10) * 60;
  const dOnly = closing.match(/(\d+)\s*d\b/i);
  if (dOnly) return parseInt(dOnly[1], 10) * 1440;
  const hOnly = closing.match(/(\d+)\s*h\b/i);
  if (hOnly) return parseInt(hOnly[1], 10) * 60;
  return FAR_FUTURE_MIN;
}

/** Comparable minutes-until-close for sorting mixed inventory on All results */
function effectiveCloseMinutes(L) {
  const k = listingKind(L);
  if (k === 'absolute_sale' || k === 'closing_today')
    return L.minutesLeft ?? FAR_FUTURE_MIN;
  if (k === 'buynow_offer')
    return L.offerMinutesLeft ?? FAR_FUTURE_MIN;
  if (k === 'auction')
    return parseAuctionClosingMinutes(L.closing);
  return FAR_FUTURE_MIN;
}

function sortAllResultsByClosingSoonest(rows) {
  return [...rows].sort((a, b) => {
    const da = effectiveCloseMinutes(a);
    const db = effectiveCloseMinutes(b);
    if (da !== db) return da - db;
    return String(a.id).localeCompare(String(b.id));
  });
}

// ---------- Header ----------
function RBEHeader({ query, setQuery, onOpenMenu }) {
  const [focused, setFocused] = useS(false);
  return (
    <>
      {/* Utility bar */}
      <div style={{
        height: 32, background: '#1C1C1C', color: 'rgba(255,255,255,.72)',
        display: 'flex', alignItems: 'center', padding: '0 24px',
        fontFamily: 'Roboto', fontSize: 12, gap: 20,
      }}>
        <span>United States · English</span>
        <div style={{ flex: 1 }} />
        <span style={{ cursor: 'pointer' }}>Sell with us</span>
        <span style={{ cursor: 'pointer' }}>Financing</span>
        <span style={{ cursor: 'pointer' }}>Shipping</span>
        <span style={{ cursor: 'pointer' }}>Help</span>
        <span style={{ cursor: 'pointer' }}>Sign in</span>
      </div>
      {/* Main bar */}
      <div style={{
        height: 72, background: '#fff', borderBottom: '1px solid rgba(0,0,0,.12)',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 20,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 0, flexShrink: 0,
          fontFamily: 'Inter', fontWeight: 800, fontSize: 22,
          letterSpacing: '-0.5px', userSelect: 'none',
        }}>
          <span style={{ color: '#E87511' }}>rbe</span>
          <span style={{ color: 'rgba(0,0,0,.87)' }}>.com</span>
        </div>

        {/* Search — fills space between logo and trailing actions */}
        <div style={{ flex: 1, minWidth: 0, marginLeft: 16, marginRight: 8, position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', height: 44,
            border: `${focused ? 2 : 1}px solid ${focused ? '#E87511' : 'rgba(0,0,0,.23)'}`,
            borderRadius: 4, background: '#fff',
          }}>
            <Icon name="search" size={22} style={{ color: 'rgba(0,0,0,.54)', margin: '0 12px' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search equipment, trucks, and vehicles"
              style={{
                flex: 1, border: 0, outline: 'none', height: '100%',
                fontFamily: 'Roboto', fontSize: 15, color: 'rgba(0,0,0,.87)',
                background: 'transparent',
              }}
            />
            <div style={{
              height: 28, width: 1, background: 'rgba(0,0,0,.12)', margin: '0 8px',
            }} />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px 0 6px',
              fontFamily: 'Roboto', fontSize: 14, color: 'rgba(0,0,0,.6)', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              <Icon name="location_on" size={18} style={{ color: 'rgba(0,0,0,.54)' }} />
              All locations
              <Icon name="arrow_drop_down" size={20} style={{ color: 'rgba(0,0,0,.54)' }} />
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          flexShrink: 0,
        }}>
          <IconButton name="favorite_border" color="rgba(0,0,0,.6)" />
          <IconButton name="notifications_none" color="rgba(0,0,0,.6)" />
          <Avatar size={36} bg="#9747FF">JM</Avatar>
        </div>
      </div>
    </>
  );
}

// ---------- Filters sidebar ----------
function FilterGroup({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useS(defaultOpen);
  return (
    <div style={{ borderTop: '1px solid rgba(0,0,0,.08)' }}>
      <div onClick={() => setOpen(!open)} style={{
        padding: '12px 0', display: 'flex', alignItems: 'center', cursor: 'pointer',
        fontFamily: 'Roboto', fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,.87)',
      }}>
        <span style={{ flex: 1 }}>{title}</span>
        <Icon name={open ? 'expand_less' : 'expand_more'} size={22}
              style={{ color: 'rgba(0,0,0,.54)' }} />
      </div>
      {open && <div style={{ paddingBottom: 12 }}>{children}</div>}
    </div>
  );
}

function FacetList({ items, selected, onToggle, limit = 6 }) {
  const [showAll, setShowAll] = useS(false);
  const visible = showAll ? items : items.slice(0, limit);
  return (
    <>
      {visible.map(it => (
        <label key={it.name} style={{
          display: 'flex', alignItems: 'center', padding: '2px 0', cursor: 'pointer',
          fontFamily: 'Roboto', fontSize: 14, color: 'rgba(0,0,0,.87)',
        }}>
          <Checkbox checked={selected.has(it.name)} onChange={() => onToggle(it.name)} />
          <span style={{ marginLeft: -4, flex: 1 }}>{it.name}</span>
          <span style={{ color: 'rgba(0,0,0,.54)', fontSize: 13 }}>
            {it.count.toLocaleString()}
          </span>
        </label>
      ))}
      {items.length > limit && (
        <div style={{ paddingTop: 4 }}>
          <Link onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show less' : `Show all ${items.length}`}
          </Link>
        </div>
      )}
    </>
  );
}

function QuickFiltersSection({ selected, onToggle, counts }) {
  const [open, setOpen] = useS(true);
  const rows = [
    { key: 'reserveMet', label: 'Reserve Met', count: counts.reserveMet },
    { key: 'closingToday', label: 'Closing Today', count: counts.closingToday },
    { key: 'absoluteSale', label: 'Absolute Sale', count: counts.absoluteSale },
    { key: 'greatPrice', label: 'Great Price', count: counts.greatPrice },
    { key: 'goodPrice', label: 'Good Price', count: counts.goodPrice },
  ];
  return (
    <div style={{
      marginTop: 10,
      marginBottom: 12,
      padding: 14,
      borderRadius: 8,
      background: '#FAF7F2',
      border: '1px solid rgba(0,0,0,.06)',
      boxShadow: '0 1px 2px rgba(0,0,0,.04)',
    }}>
      <button type="button" onClick={() => setOpen(!open)} style={{
        width: '100%', border: 0, background: 'transparent', padding: 0,
        display: 'flex', alignItems: 'center', cursor: 'pointer',
        font: 'inherit', textAlign: 'left',
      }}>
        <span style={{
          fontFamily: 'Roboto', fontSize: 14, fontWeight: 600,
          color: 'rgba(0,0,0,.87)',
        }}>Quick Filters</span>
        <span style={{
          marginLeft: 8,
          padding: '2px 8px',
          borderRadius: 9999,
          background: '#E87511',
          color: '#fff',
          fontFamily: 'Roboto',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.8px',
        }}>POPULAR</span>
        <span style={{ flex: 1 }} />
        <Icon name={open ? 'expand_less' : 'expand_more'} size={22}
              style={{ color: 'rgba(0,0,0,.54)' }} />
      </button>
      {open && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rows.map(row => (
            <label key={row.key} style={{
              display: 'flex', alignItems: 'center', padding: '4px 0',
              cursor: 'pointer', fontFamily: 'Roboto', fontSize: 14,
              color: 'rgba(0,0,0,.87)',
            }}>
              <Checkbox
                checked={selected.has(row.key)}
                onChange={() => onToggle(row.key)}
              />
              <span style={{ marginLeft: -4, flex: 1 }}>
                {row.label}{' '}
                <span style={{ color: 'rgba(0,0,0,.54)' }}>({row.count})</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function RangeInput({ label, min, setMin, max, setMax, placeholder = ['Min', 'Max'] }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input value={min} onChange={e => setMin(e.target.value)}
             placeholder={placeholder[0]}
             style={{ width: '100%', height: 40, border: '1px solid rgba(0,0,0,.23)',
                      borderRadius: 4, padding: '0 10px', fontFamily: 'Roboto', fontSize: 14,
                      outline: 'none', background: '#fff' }} />
      <span style={{ color: 'rgba(0,0,0,.54)' }}>–</span>
      <input value={max} onChange={e => setMax(e.target.value)}
             placeholder={placeholder[1]}
             style={{ width: '100%', height: 40, border: '1px solid rgba(0,0,0,.23)',
                      borderRadius: 4, padding: '0 10px', fontFamily: 'Roboto', fontSize: 14,
                      outline: 'none', background: '#fff' }} />
    </div>
  );
}

function Filters({ state, update, quickFilterCounts }) {
  const toggle = (key, val) => {
    const n = new Set(state[key]);
    n.has(val) ? n.delete(val) : n.add(val);
    update({ [key]: n });
  };
  const toggleQuick = (key) => {
    const n = new Set(state.quickFilters);
    n.has(key) ? n.delete(key) : n.add(key);
    update({ quickFilters: n });
  };
  return (
    <aside style={{ width: 280, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <h6 style={{ fontFamily: 'Roboto', fontSize: 16, fontWeight: 500,
                     color: 'rgba(0,0,0,.87)', flex: 1 }}>Filters</h6>
        <Link onClick={() => update({
          categories: new Set(), makes: new Set(), years: new Set(),
          yearMin: '', yearMax: '', priceMin: '', priceMax: '', hoursMin: '', hoursMax: '',
          quickFilters: new Set(),
        })}>Clear all</Link>
      </div>

      <FilterGroup title="Location">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center',
                      border: '1px solid rgba(0,0,0,.23)', borderRadius: 4,
                      padding: '0 10px', height: 40, marginBottom: 10 }}>
          <Icon name="my_location" size={18} style={{ color: 'rgba(0,0,0,.54)' }} />
          <input value={state.zip} onChange={e => update({ zip: e.target.value })}
                 placeholder="ZIP or city"
                 style={{ flex: 1, border: 0, outline: 'none', fontFamily: 'Roboto',
                          fontSize: 14, background: 'transparent' }} />
        </div>
        <div style={{ fontFamily: 'Roboto', fontSize: 13, color: 'rgba(0,0,0,.6)',
                      marginBottom: 6 }}>Within {state.radius} mi</div>
        <input type="range" min="25" max="2000" step="25" value={state.radius}
               onChange={e => update({ radius: +e.target.value })}
               style={{ width: '100%', accentColor: '#E87511' }} />
      </FilterGroup>

      <QuickFiltersSection
        selected={state.quickFilters}
        onToggle={toggleQuick}
        counts={quickFilterCounts}
      />

      <FilterGroup title="Category">
        <FacetList items={FACETS.category}
                   selected={state.categories}
                   onToggle={v => toggle('categories', v)} />
      </FilterGroup>

      <FilterGroup title="Make">
        <FacetList items={FACETS.make}
                   selected={state.makes}
                   onToggle={v => toggle('makes', v)} />
      </FilterGroup>

      <FilterGroup title="Year">
        <RangeInput
          min={state.yearMin} setMin={v => update({ yearMin: v })}
          max={state.yearMax} setMax={v => update({ yearMax: v })}
          placeholder={['1995', '2024']} />
      </FilterGroup>

      <FilterGroup title="Price (USD)">
        <RangeInput
          min={state.priceMin} setMin={v => update({ priceMin: v })}
          max={state.priceMax} setMax={v => update({ priceMax: v })}
          placeholder={['$ Min', '$ Max']} />
        <div style={{ marginTop: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center',
                          fontFamily: 'Roboto', fontSize: 14, cursor: 'pointer' }}>
            <Checkbox checked={state.financing}
                      onChange={() => update({ financing: !state.financing })} />
            <span style={{ marginLeft: -4 }}>Financing available</span>
          </label>
        </div>
      </FilterGroup>

      <FilterGroup title="Hours / Miles">
        <RangeInput
          min={state.hoursMin} setMin={v => update({ hoursMin: v })}
          max={state.hoursMax} setMax={v => update({ hoursMax: v })}
          placeholder={['Min hrs', 'Max hrs']} />
      </FilterGroup>

      <FilterGroup title="Condition" defaultOpen={false}>
        <FacetList
          items={[
            { name: 'Unused', count: 382 },
            { name: 'Used', count: 8420 },
            { name: 'Rebuilt / Refurbished', count: 124 },
            { name: 'Parts / Not running', count: 207 },
          ]}
          selected={state.conditions}
          onToggle={v => toggle('conditions', v)}
          limit={4}
        />
      </FilterGroup>

      <FilterGroup title="Inspection" defaultOpen={false}>
        <FacetList
          items={[
            { name: 'IronClad Assurance®', count: 3128 },
            { name: 'Inspection report', count: 5402 },
            { name: 'Field inspected', count: 2214 },
          ]}
          selected={state.inspection}
          onToggle={v => toggle('inspection', v)}
          limit={3}
        />
      </FilterGroup>
    </aside>
  );
}

// ---------- Result cards ----------
function AuctionBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, height: 22,
      padding: '0 8px', borderRadius: 2, background: '#9747FF', color: '#fff',
      fontFamily: 'Roboto', fontSize: 11, fontWeight: 500, letterSpacing: '.5px',
      textTransform: 'uppercase',
    }}>
      <Icon name="gavel" size={13} /> Auction
    </span>
  );
}
function BuyNowBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, height: 22,
      padding: '0 8px', borderRadius: 2, background: '#E87511', color: '#fff',
      fontFamily: 'Roboto', fontSize: 11, fontWeight: 500, letterSpacing: '.5px',
      textTransform: 'uppercase',
    }}>
      <Icon name="bolt" size={13} /> Buy now
    </span>
  );
}

function SpecRow({ items }) {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '8px 0 0' }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span className="overline" style={{
            fontFamily: 'Roboto', fontSize: 11, textTransform: 'uppercase',
            letterSpacing: '.6px', color: 'rgba(0,0,0,.54)', lineHeight: 1.4,
          }}>{it.label}</span>
          <span style={{ fontFamily: 'Roboto', fontSize: 14, color: 'rgba(0,0,0,.87)',
                         fontWeight: 500 }}>{it.value}</span>
        </div>
      ))}
    </div>
  );
}

function ListingCardGrid({ L, saved, onSave, showBuyNowOfferTimer }) {
  const k = listingKind(L);
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{ position: 'relative', aspectRatio: '400/260', background: '#F5F5F5' }}>
        <PlaceholderSVG img={L.img} />
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          {k === 'auction' && <AuctionBadge />}
          {k === 'buynow_offer' && <BuyNowBadge />}
          {k === 'absolute_sale' && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, height: 22,
              padding: '0 8px', borderRadius: 2, background: '#9747FF', color: '#fff',
              fontFamily: 'Roboto', fontSize: 11, fontWeight: 500, letterSpacing: '.5px',
              textTransform: 'uppercase',
            }}>
              <Icon name="verified" size={13} /> Absolute sale
            </span>
          )}
          {k === 'closing_today' && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, height: 22,
              padding: '0 8px', borderRadius: 2, background: '#E87511', color: '#fff',
              fontFamily: 'Roboto', fontSize: 11, fontWeight: 500, letterSpacing: '.5px',
              textTransform: 'uppercase',
            }}>
              <Icon name="timer" size={13} /> Closing today
            </span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onSave(L.id); }}
          style={{
            position: 'absolute', top: 8, right: 8, width: 36, height: 36,
            borderRadius: '50%', background: 'rgba(255,255,255,.95)', border: 0,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
          }}>
          <Icon name={saved ? 'favorite' : 'favorite_border'}
                size={20} style={{ color: saved ? '#E87511' : 'rgba(0,0,0,.6)' }} />
        </button>
        {k === 'auction' && (
          <div style={{
            position: 'absolute', bottom: 8, left: 10,
            background: 'rgba(0,0,0,.78)', color: '#fff', borderRadius: 2,
            padding: '3px 8px', fontFamily: 'Roboto', fontSize: 12, fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <Icon name="schedule" size={14} /> {L.closing.replace('Closes in ', '')}
          </div>
        )}
        {showBuyNowOfferTimer && k === 'buynow_offer' && L.offerMinutesLeft != null && (
          <div style={{
            position: 'absolute', bottom: 8, left: 10,
            background: 'rgba(232,117,17,.95)', color: '#fff', borderRadius: 2,
            padding: '3px 8px', fontFamily: 'Roboto', fontSize: 12, fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <Icon name="hourglass_top" size={14} />
            {fmtOfferMinutesLeft(L.offerMinutesLeft)} · 30-day listing
          </div>
        )}
        {k === 'absolute_sale' && L.minutesLeft != null && (
          <div style={{
            position: 'absolute', bottom: 8, left: 10,
            background: '#9747FF', color: '#fff', borderRadius: 2,
            padding: '3px 8px', fontFamily: 'Roboto', fontSize: 12, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <Icon name="schedule" size={14} /> {fmtMinutesLeftShort(L.minutesLeft)}
          </div>
        )}
        {k === 'closing_today' && L.minutesLeft != null && (
          <div style={{
            position: 'absolute', bottom: 8, left: 10,
            background: '#E65100', color: '#fff', borderRadius: 2,
            padding: '3px 8px', fontFamily: 'Roboto', fontSize: 12, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <Icon name="schedule" size={14} /> {fmtMinutesLeftShort(L.minutesLeft)}
          </div>
        )}
      </div>
      <div style={{ padding: '12px 16px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: 'Roboto', fontSize: 15, fontWeight: 500,
                      color: 'rgba(0,0,0,.87)', lineHeight: 1.35,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden', minHeight: 40 }}>
          {L.title}
        </div>
        <div style={{ fontFamily: 'Roboto', fontSize: 13, color: 'rgba(0,0,0,.6)',
                      display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <Icon name="place" size={14} style={{ color: 'rgba(0,0,0,.54)' }} />
          {L.location}
        </div>
        <SpecRow items={[
          { label: L.hours != null ? 'Hours' : 'Miles',
            value: L.hours != null ? L.hours.toLocaleString() : L.miles.toLocaleString() },
          { label: 'Lot', value: L.id },
        ]} />
        <div style={{ flex: 1 }} />
        <Divider style={{ marginTop: 12 }} />
        <div style={{ padding: '10px 0 12px', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          {(k === 'auction') && (
            <>
              <div style={{ flex: 1 }}>
                <div className="overline" style={{
                  fontFamily: 'Roboto', fontSize: 11, textTransform: 'uppercase',
                  letterSpacing: '.6px', color: 'rgba(0,0,0,.54)', lineHeight: 1.4,
                }}>Current bid · {L.bids} bids</div>
                <div style={{ fontFamily: 'Roboto', fontSize: 20, fontWeight: 500,
                               color: '#9747FF', lineHeight: 1.2 }}>{fmtPrice(L.bid)}</div>
              </div>
              <Button size="small" color="secondary">BID</Button>
            </>
          )}
          {(k === 'buynow_offer') && (
            <>
              <div style={{ flex: 1 }}>
                <div className="overline" style={{
                  fontFamily: 'Roboto', fontSize: 11, textTransform: 'uppercase',
                  letterSpacing: '.6px', color: 'rgba(0,0,0,.54)', lineHeight: 1.4,
                }}>Price {L.makeOffer && '· Offers'}</div>
                <div style={{ fontFamily: 'Roboto', fontSize: 20, fontWeight: 500,
                               color: 'rgba(0,0,0,.87)', lineHeight: 1.2 }}>{fmtPrice(L.price)}</div>
              </div>
              <Button size="small">BUY</Button>
            </>
          )}
          {(k === 'absolute_sale') && (
            <>
              <div style={{ flex: 1 }}>
                <div className="overline" style={{
                  fontFamily: 'Roboto', fontSize: 11, textTransform: 'uppercase',
                  letterSpacing: '.6px', color: 'rgba(0,0,0,.54)', lineHeight: 1.4,
                }}>Current bid · {L.bids} bids</div>
                <div style={{ fontFamily: 'Roboto', fontSize: 20, fontWeight: 500,
                               color: '#9747FF', lineHeight: 1.2 }}>{fmtPrice(L.bid)}</div>
              </div>
              <Button size="small" color="secondary">BID</Button>
            </>
          )}
          {(k === 'closing_today') && (
            <>
              <div style={{ flex: 1 }}>
                <div className="overline" style={{
                  fontFamily: 'Roboto', fontSize: 11, textTransform: 'uppercase',
                  letterSpacing: '.6px', color: 'rgba(0,0,0,.54)', lineHeight: 1.4,
                }}>Starting price · 0 bids</div>
                <div style={{ fontFamily: 'Roboto', fontSize: 20, fontWeight: 500,
                               color: '#9747FF', lineHeight: 1.2 }}>{fmtPrice(L.bid)}</div>
              </div>
              <Button size="small" color="secondary"
                      style={{ textTransform: 'none', letterSpacing: '.15px' }}>Bid Now</Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function AbsoluteSaleCard({ L, saved, onSave }) {
  const urgent = L.minutesLeft <= 15;
  const soon = L.minutesLeft <= 60;
  const accent = urgent ? '#D32F2F' : soon ? '#EF6C00' : '#9747FF';
  const timeLabel = L.minutesLeft < 60
    ? `${L.minutesLeft}m left`
    : `${Math.floor(L.minutesLeft/60)}h ${L.minutesLeft%60}m left`;
  return (
    <Card style={{ borderLeft: `4px solid ${accent}` }}>
      <div style={{ display: 'flex', gap: 16, padding: 16 }}>
        <div style={{ width: 240, height: 160, flexShrink: 0, borderRadius: 4,
                      overflow: 'hidden', background: '#F5F5F5', position: 'relative' }}>
          <PlaceholderSVG img={L.img} />
          <div style={{ position: 'absolute', top: 8, left: 8,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        height: 22, padding: '0 8px', borderRadius: 2,
                        background: '#9747FF', color: '#fff',
                        fontFamily: 'Roboto', fontSize: 11, fontWeight: 500,
                        letterSpacing: '.5px', textTransform: 'uppercase' }}>
            <Icon name="verified" size={13} /> Absolute sale
          </div>
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            background: accent, color: '#fff', borderRadius: 2,
            padding: '4px 8px', fontFamily: 'Roboto', fontSize: 12, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <Icon name="schedule" size={14} /> {timeLabel}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Roboto', fontSize: 18, fontWeight: 500,
                            color: 'rgba(0,0,0,.87)', lineHeight: 1.35 }}>{L.title}</div>
              <div style={{ fontFamily: 'Roboto', fontSize: 13, color: 'rgba(0,0,0,.6)',
                            display: 'flex', alignItems: 'center', gap: 12, marginTop: 6,
                            flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="place" size={15} style={{ color: 'rgba(0,0,0,.54)' }} /> {L.location}
                </span>
                <span>Lot #{L.id}</span>
                <span>· Closes today at {L.closingAt}</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                            marginTop: 10, padding: '4px 10px', borderRadius: 9999,
                            background: 'rgba(46,125,50,.12)', color: '#1B5E20',
                            fontFamily: 'Roboto', fontSize: 12, fontWeight: 500 }}>
                <Icon name="check_circle" size={15} /> Reserve met · Sells to highest bidder
              </div>
            </div>
            <IconButton
              name={saved ? 'favorite' : 'favorite_border'}
              color={saved ? '#E87511' : 'rgba(0,0,0,.54)'}
              onClick={() => onSave(L.id)}
            />
          </div>

          <SpecRow items={[
            { label: 'Year', value: L.year },
            { label: 'Make', value: L.make },
            { label: 'Model', value: L.model },
            { label: L.hours != null ? 'Hours' : 'Miles',
              value: L.hours != null ? L.hours.toLocaleString() + ' hrs' : L.miles.toLocaleString() + ' mi' },
            { label: 'Category', value: L.category },
          ]} />

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 12 }}>
            <div>
              <div className="overline" style={{
                fontFamily: 'Roboto', fontSize: 11, textTransform: 'uppercase',
                letterSpacing: '.6px', color: 'rgba(0,0,0,.54)',
              }}>Current bid</div>
              <div style={{ fontFamily: 'Roboto', fontSize: 24, fontWeight: 500,
                             color: '#9747FF', lineHeight: 1.2 }}>{fmtPrice(L.bid)}</div>
              <div style={{ fontFamily: 'Roboto', fontSize: 12, color: 'rgba(0,0,0,.6)' }}>
                {L.bids} bids · Est. {L.estimate} · {L.watchers} watching
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <Button variant="outlined" color="secondary" size="medium">WATCH</Button>
            <Button color="secondary" size="medium" startIcon="gavel">BID NOW</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ClosingTodayCard({ L, saved, onSave }) {
  const urgent = L.minutesLeft <= 15;
  const soon = L.minutesLeft <= 60;
  const accent = urgent ? '#D32F2F' : soon ? '#EF6C00' : '#E87511';
  const timeLabel = L.minutesLeft < 60
    ? `${L.minutesLeft}m left`
    : `${Math.floor(L.minutesLeft / 60)}h ${L.minutesLeft % 60}m left`;
  const closingPhrase = typeof L.closingAt === 'string'
    ? L.closingAt.replace(/^Thu\s+/i, '').trim()
    : '';
  return (
    <Card style={{ borderLeft: `4px solid ${accent}` }}>
      <div style={{ display: 'flex', gap: 16, padding: 16 }}>
        <div style={{ width: 240, height: 160, flexShrink: 0, borderRadius: 4,
                      overflow: 'hidden', background: '#F5F5F5', position: 'relative' }}>
          <PlaceholderSVG img={L.img} />
          <div style={{ position: 'absolute', top: 8, left: 8,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        height: 22, padding: '0 8px', borderRadius: 2,
                        background: '#E87511', color: '#fff',
                        fontFamily: 'Roboto', fontSize: 11, fontWeight: 500,
                        letterSpacing: '.5px', textTransform: 'uppercase' }}>
            <Icon name="timer" size={13} /> Closing today
          </div>
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            background: accent, color: '#fff', borderRadius: 2,
            padding: '4px 8px', fontFamily: 'Roboto', fontSize: 12, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <Icon name="schedule" size={14} /> {timeLabel}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Roboto', fontSize: 18, fontWeight: 500,
                            color: 'rgba(0,0,0,.87)', lineHeight: 1.35 }}>{L.title}</div>
              <div style={{ fontFamily: 'Roboto', fontSize: 13, color: 'rgba(0,0,0,.6)',
                            display: 'flex', alignItems: 'center', gap: 12, marginTop: 6,
                            flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="place" size={15} style={{ color: 'rgba(0,0,0,.54)' }} /> {L.location}
                </span>
                <span>Lot #{L.id}</span>
                <span>· Closes Thursday at {closingPhrase}</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                            marginTop: 10, padding: '4px 10px', borderRadius: 9999,
                            background: 'rgba(237, 108, 2, .12)', color: '#E65100',
                            fontFamily: 'Roboto', fontSize: 12, fontWeight: 500 }}>
                <Icon name="flag" size={15} /> Reserve not met
              </div>
            </div>
            <IconButton
              name={saved ? 'favorite' : 'favorite_border'}
              color={saved ? '#E87511' : 'rgba(0,0,0,.54)'}
              onClick={() => onSave(L.id)}
            />
          </div>

          <SpecRow items={[
            { label: 'Year', value: L.year },
            { label: 'Make', value: L.make },
            { label: 'Model', value: L.model },
            { label: L.hours != null ? 'Hours' : 'Miles',
              value: L.hours != null ? L.hours.toLocaleString() + ' hrs' : L.miles.toLocaleString() + ' mi' },
            { label: 'Category', value: L.category },
          ]} />

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 12 }}>
            <div>
              <div className="overline" style={{
                fontFamily: 'Roboto', fontSize: 11, textTransform: 'uppercase',
                letterSpacing: '.6px', color: 'rgba(0,0,0,.54)',
              }}>Starting price</div>
              <div style={{ fontFamily: 'Roboto', fontSize: 24, fontWeight: 500,
                             color: '#9747FF', lineHeight: 1.2 }}>{fmtPrice(L.bid)}</div>
              <div style={{ fontFamily: 'Roboto', fontSize: 12, color: 'rgba(0,0,0,.6)' }}>
                0 bids · Est. {L.estimate} · {L.watchers} watching
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <Button variant="outlined" color="secondary" size="medium">WATCH</Button>
            <Button color="secondary" size="medium" startIcon="gavel"
                    style={{ textTransform: 'none', letterSpacing: '.15px' }}>Bid Now</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ListingCardList({ L, saved, onSave, showBuyNowOfferTimer }) {
  const k = listingKind(L);
  return (
    <Card>
      <div style={{ display: 'flex', gap: 16, padding: 16 }}>
        <div style={{ width: 240, height: 160, flexShrink: 0, borderRadius: 4,
                      overflow: 'hidden', background: '#F5F5F5', position: 'relative' }}>
          <PlaceholderSVG img={L.img} />
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {k === 'auction' && <AuctionBadge />}
            {k === 'buynow_offer' && <BuyNowBadge />}
            {k === 'absolute_sale' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, height: 22,
                padding: '0 8px', borderRadius: 2, background: '#9747FF', color: '#fff',
                fontFamily: 'Roboto', fontSize: 11, fontWeight: 500, letterSpacing: '.5px',
                textTransform: 'uppercase',
              }}>
                <Icon name="verified" size={13} /> Absolute sale
              </span>
            )}
            {k === 'closing_today' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, height: 22,
                padding: '0 8px', borderRadius: 2, background: '#E87511', color: '#fff',
                fontFamily: 'Roboto', fontSize: 11, fontWeight: 500, letterSpacing: '.5px',
                textTransform: 'uppercase',
              }}>
                <Icon name="timer" size={13} /> Closing today
              </span>
            )}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Roboto', fontSize: 18, fontWeight: 500,
                            color: 'rgba(0,0,0,.87)', lineHeight: 1.35 }}>{L.title}</div>
              <div style={{ fontFamily: 'Roboto', fontSize: 13, color: 'rgba(0,0,0,.6)',
                            display: 'flex', alignItems: 'center', gap: 12, marginTop: 6,
                            flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="place" size={15} style={{ color: 'rgba(0,0,0,.54)' }} /> {L.location}
                </span>
                <span>Lot #{L.id}</span>
                {k === 'auction' && <span>· {L.auction}</span>}
                {k === 'absolute_sale' && L.closingAt && (
                  <span>· Closes today at {L.closingAt}</span>
                )}
                {k === 'closing_today' && L.closingAt && (
                  <span>· Closes Thursday at {closingThursdayPhrase(L.closingAt)}</span>
                )}
                {showBuyNowOfferTimer && k === 'buynow_offer' && L.offerMinutesLeft != null && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
                                 color: '#E65100', fontWeight: 500 }}>
                    <Icon name="hourglass_top" size={15} />
                    {fmtOfferMinutesLeft(L.offerMinutesLeft)} · 30-day window
                  </span>
                )}
              </div>
              {k === 'closing_today' && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
                  padding: '4px 10px', borderRadius: 9999,
                  background: 'rgba(237, 108, 2, .12)', color: '#E65100',
                  fontFamily: 'Roboto', fontSize: 12, fontWeight: 500,
                }}>
                  <Icon name="flag" size={15} /> Reserve not met
                </div>
              )}
            </div>
            <IconButton
              name={saved ? 'favorite' : 'favorite_border'}
              color={saved ? '#E87511' : 'rgba(0,0,0,.54)'}
              onClick={() => onSave(L.id)}
            />
          </div>

          <SpecRow items={[
            { label: 'Year', value: L.year },
            { label: 'Make', value: L.make },
            { label: 'Model', value: L.model },
            { label: L.hours != null ? 'Hours' : 'Miles',
              value: L.hours != null ? L.hours.toLocaleString() + ' hrs' : L.miles.toLocaleString() + ' mi' },
            { label: 'Category', value: L.category },
          ]} />

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 12 }}>
            {k === 'auction' && (
              <>
                <div>
                  <div className="overline" style={{
                    fontFamily: 'Roboto', fontSize: 11, textTransform: 'uppercase',
                    letterSpacing: '.6px', color: 'rgba(0,0,0,.54)',
                  }}>Current bid</div>
                  <div style={{ fontFamily: 'Roboto', fontSize: 24, fontWeight: 500,
                                 color: '#9747FF', lineHeight: 1.2 }}>{fmtPrice(L.bid)}</div>
                  <div style={{ fontFamily: 'Roboto', fontSize: 12, color: 'rgba(0,0,0,.6)' }}>
                    {L.bids} bids · Est. {L.estimate}
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ textAlign: 'right', marginRight: 4 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
                                color: '#D32F2F', fontFamily: 'Roboto', fontSize: 13,
                                fontWeight: 500 }}>
                    <Icon name="schedule" size={16} /> {L.closing}
                  </div>
                  <div style={{ fontFamily: 'Roboto', fontSize: 12, color: 'rgba(0,0,0,.6)',
                                marginTop: 2 }}>{L.watchers} watching</div>
                </div>
                <Button variant="outlined" color="secondary" size="medium">WATCH</Button>
                <Button color="secondary" size="medium">PLACE BID</Button>
              </>
            )}
            {k === 'buynow_offer' && (
              <>
                <div>
                  <div className="overline" style={{
                    fontFamily: 'Roboto', fontSize: 11, textTransform: 'uppercase',
                    letterSpacing: '.6px', color: 'rgba(0,0,0,.54)',
                  }}>Price</div>
                  <div style={{ fontFamily: 'Roboto', fontSize: 24, fontWeight: 500,
                                 color: 'rgba(0,0,0,.87)', lineHeight: 1.2 }}>{fmtPrice(L.price)}</div>
                  <div style={{ fontFamily: 'Roboto', fontSize: 12, color: 'rgba(0,0,0,.6)' }}>
                    {L.financing} {L.makeOffer && '· Make offer accepted'}
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                <Button variant="outlined" size="medium">MAKE OFFER</Button>
                <Button size="medium">BUY NOW</Button>
              </>
            )}
            {(k === 'absolute_sale') && (
              <>
                <div>
                  <div className="overline" style={{
                    fontFamily: 'Roboto', fontSize: 11, textTransform: 'uppercase',
                    letterSpacing: '.6px', color: 'rgba(0,0,0,.54)',
                  }}>Current bid</div>
                  <div style={{ fontFamily: 'Roboto', fontSize: 24, fontWeight: 500,
                                 color: '#9747FF', lineHeight: 1.2 }}>{fmtPrice(L.bid)}</div>
                  <div style={{ fontFamily: 'Roboto', fontSize: 12, color: 'rgba(0,0,0,.6)' }}>
                    {L.bids} bids · Est. {L.estimate} · {L.watchers} watching
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ textAlign: 'right', marginRight: 4 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    color: '#E65100', fontFamily: 'Roboto', fontSize: 13, fontWeight: 500,
                  }}>
                    <Icon name="schedule" size={16} /> {fmtMinutesLeftShort(L.minutesLeft)}
                  </div>
                </div>
                <Button variant="outlined" color="secondary" size="medium">WATCH</Button>
                <Button color="secondary" size="medium" startIcon="gavel">BID NOW</Button>
              </>
            )}
            {(k === 'closing_today') && (
              <>
                <div>
                  <div className="overline" style={{
                    fontFamily: 'Roboto', fontSize: 11, textTransform: 'uppercase',
                    letterSpacing: '.6px', color: 'rgba(0,0,0,.54)',
                  }}>Starting price</div>
                  <div style={{ fontFamily: 'Roboto', fontSize: 24, fontWeight: 500,
                                 color: '#9747FF', lineHeight: 1.2 }}>{fmtPrice(L.bid)}</div>
                  <div style={{ fontFamily: 'Roboto', fontSize: 12, color: 'rgba(0,0,0,.6)' }}>
                    0 bids · Est. {L.estimate} · {L.watchers} watching
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ textAlign: 'right', marginRight: 4 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    color: '#E65100', fontFamily: 'Roboto', fontSize: 13, fontWeight: 500,
                  }}>
                    <Icon name="schedule" size={16} /> {fmtMinutesLeftShort(L.minutesLeft)}
                  </div>
                </div>
                <Button variant="outlined" color="secondary" size="medium">WATCH</Button>
                <Button color="secondary" size="medium" startIcon="gavel"
                        style={{ textTransform: 'none', letterSpacing: '.15px' }}>Bid Now</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------- Screen ----------
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "view": "list",
  "density": "comfortable",
  "tab": "all",
  "accent": "violet"
}/*EDITMODE-END*/;

function SearchResultsScreen() {
  const [query, setQuery] = useS('caterpillar 336');
  const [view, setView] = useS(TWEAK_DEFAULTS.view);
  const [tab, setTab] = useS(TWEAK_DEFAULTS.tab);
  const [subTab, setSubTab] = useS('absolute');
  const [auctionSubTab, setAuctionSubTab] = useS('all');
  /** When set on All results, narrows to one auction or marketplace slice; null = full merged inventory */
  const [allSubTab, setAllSubTab] = useS(null);

  useE(() => {
    const h = (e) => {
      const { k, v } = e.detail;
      if (k === 'view') setView(v);
      if (k === 'tab') setTab(v);
    };
    window.addEventListener('tweak', h);
    return () => window.removeEventListener('tweak', h);
  }, []);
  const [sort, setSort] = useS('Closing soonest');
  const [sortOpen, setSortOpen] = useS(false);
  const sortRef = useR(null);
  const [saved, setSaved] = useS(new Set(['L-88241']));
  const [page, setPage] = useS(1);

  const [filters, setFilters] = useS({
    zip: '80202', radius: 250,
    categories: new Set(['Excavators']),
    makes: new Set(['Caterpillar']),
    years: new Set(), yearMin: '2015', yearMax: '',
    priceMin: '', priceMax: '',
    hoursMin: '', hoursMax: '8000',
    financing: false,
    conditions: new Set(), inspection: new Set(['IronClad Assurance®']),
    quickFilters: new Set(),
  });
  const update = (patch) => setFilters(prev => ({ ...prev, ...patch }));

  const toggleSave = (id) => {
    const n = new Set(saved);
    n.has(id) ? n.delete(id) : n.add(id);
    setSaved(n);
  };

  const listingsMatching = LISTINGS.filter(L => listingMatchesSearchQuery(L, query));
  const absoluteFiltered = ABSOLUTE_SALE.filter(L => listingMatchesSearchQuery(L, query));
  const closingTodayFiltered = CLOSING_TODAY.filter(L => listingMatchesSearchQuery(L, query));

  const mergedAllFeed = mergeAllResults().filter(L => listingMatchesSearchQuery(L, query));
  const quickFilterCounts = computeQuickFilterCounts(mergedAllFeed);

  const auctionStock = listingsMatching.filter(L => L.type === 'auction');
  const AUCTION_CLOSING_TODAY_MAX_MIN = 24 * 60;
  const closestAuctionsSorted = [...auctionStock].sort(
    (a, b) => (a.distanceMi ?? 1e9) - (b.distanceMi ?? 1e9)
  );
  const closingTodayAuctionsSorted = [...auctionStock]
    .filter(L => effectiveCloseMinutes(L) <= AUCTION_CLOSING_TODAY_MAX_MIN)
    .sort((a, b) => effectiveCloseMinutes(a) - effectiveCloseMinutes(b));
  const allAuctionsSortedList = [...auctionStock].sort(
    (a, b) => effectiveCloseMinutes(a) - effectiveCloseMinutes(b)
  );

  /** All results — auctions closing within 24h + marketplace Closing today rows */
  const allResultsClosingTodayCombined = [
    ...closingTodayAuctionsSorted,
    ...[...closingTodayFiltered].sort((a, b) => a.minutesLeft - b.minutesLeft)
      .map(L => ({ ...L, listingKind: 'closing_today' })),
  ].sort((a, b) => effectiveCloseMinutes(a) - effectiveCloseMinutes(b));

  // Filter listings by tab
  const inAbsolute = tab === 'buynow' && subTab === 'absolute';
  const inClosingToday = tab === 'buynow' && subTab === 'closing';
  const inBnobo = tab === 'buynow' && subTab === 'bnobo';
  const visibleBase = inAbsolute
    ? [...absoluteFiltered].sort((a, b) => a.minutesLeft - b.minutesLeft)
    : inClosingToday
      ? [...closingTodayFiltered].sort((a, b) => a.minutesLeft - b.minutesLeft)
      : inBnobo
        ? [...listingsMatching.filter(L => L.type === 'buynow')].sort(
            (a, b) => (a.offerMinutesLeft ?? OFFER_WINDOW_MAX_MIN) - (b.offerMinutesLeft ?? OFFER_WINDOW_MAX_MIN)
          )
        : tab === 'all'
          ? (allSubTab == null
              ? sortAllResultsByClosingSoonest(mergedAllFeed)
              : allSubTab === 'a_closest'
                ? closestAuctionsSorted
                : allSubTab === 'closing_today'
                  ? allResultsClosingTodayCombined
                  : allSubTab === 'a_all'
                    ? allAuctionsSortedList
                    : allSubTab === 'm_absolute'
                      ? [...absoluteFiltered].sort((a, b) => a.minutesLeft - b.minutesLeft)
                          .map(L => ({ ...L, listingKind: 'absolute_sale' }))
                      : allSubTab === 'm_bnobo'
                        ? [...listingsMatching.filter(L => L.type === 'buynow')].sort(
                            (a, b) => (a.offerMinutesLeft ?? OFFER_WINDOW_MAX_MIN)
                              - (b.offerMinutesLeft ?? OFFER_WINDOW_MAX_MIN)
                          ).map(L => ({ ...L, listingKind: 'buynow_offer' }))
                        : sortAllResultsByClosingSoonest(mergedAllFeed))
          : tab === 'auctions'
            ? (auctionSubTab === 'closest'
                ? closestAuctionsSorted
                : auctionSubTab === 'closing'
                  ? closingTodayAuctionsSorted
                  : allAuctionsSortedList)
            : listingsMatching.filter(L => L.type === 'buynow');

  const visible =
    !filters.quickFilters || filters.quickFilters.size === 0
      ? visibleBase
      : visibleBase.filter(L => passesQuickFilters(L, filters.quickFilters));

  const listingAuctionCount = auctionStock.length;
  const listingBuynowCount = listingsMatching.filter(l => l.type === 'buynow').length;
  /** Marketplace universe = same three slices as Marketplace sub-tabs (disjoint lots) */
  const marketplaceInventoryCount =
    absoluteFiltered.length + closingTodayFiltered.length + listingBuynowCount;

  const counts = {
    /** Same rows as mergeAllResults() — full cross-channel catalog */
    all: mergedAllFeed.length,
    /** Catalog auctions only (matches Auctions tab views) */
    auctions: listingAuctionCount,
    /** Absolute sale + Closing today + Buy Now / Best Offer (matches Marketplace sub-tab sum) */
    buynow: marketplaceInventoryCount,
  };

  const resultTotal = inClosingToday
    ? closingTodayFiltered.length
    : inAbsolute
      ? absoluteFiltered.length
      : inBnobo
        ? listingBuynowCount
        : tab === 'all'
          ? (allSubTab == null
              ? mergedAllFeed.length
              : allSubTab === 'a_closest' || allSubTab === 'a_all'
                ? auctionStock.length
                : allSubTab === 'closing_today'
                  ? closingTodayAuctionsSorted.length + closingTodayFiltered.length
                  : allSubTab === 'm_absolute'
                    ? absoluteFiltered.length
                    : allSubTab === 'm_bnobo'
                      ? listingBuynowCount
                      : mergedAllFeed.length)
          : counts[tab];

  const showBuyNowOfferTimer = inBnobo
    || (tab === 'all' && (allSubTab == null || allSubTab === 'm_bnobo'));

  // Active filter chips
  const activeChips = [];
  filters.categories.forEach(c => activeChips.push({ key: 'categories', label: c }));
  filters.makes.forEach(c => activeChips.push({ key: 'makes', label: c }));
  filters.inspection.forEach(c => activeChips.push({ key: 'inspection', label: c }));
  if (filters.yearMin || filters.yearMax)
    activeChips.push({
      key: 'year',
      label: `Year: ${filters.yearMin || 'Any'} – ${filters.yearMax || 'Any'}`,
    });
  if (filters.hoursMax)
    activeChips.push({ key: 'hours', label: `Max ${filters.hoursMax} hrs` });
  if (filters.zip)
    activeChips.push({ key: 'zip', label: `${filters.zip} · ${filters.radius} mi` });
  filters.quickFilters.forEach((qk) => {
    activeChips.push({
      key: 'quickFilter',
      qk,
      label: QUICK_FILTER_LABELS[qk] || qk,
    });
  });

  const removeChip = (c) => {
    if (c.key === 'year') update({ yearMin: '', yearMax: '' });
    else if (c.key === 'hours') update({ hoursMax: '' });
    else if (c.key === 'zip') update({ zip: '' });
    else if (c.key === 'quickFilter') {
      const n = new Set(filters.quickFilters);
      n.delete(c.qk);
      update({ quickFilters: n });
    } else {
      const n = new Set(filters[c.key]);
      n.delete(c.label);
      update({ [c.key]: n });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA' }}>
      <RBEHeader query={query} setQuery={setQuery} />

      {/* Breadcrumbs + result count */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '16px 24px 0' }}>
        <div style={{ fontFamily: 'Roboto', fontSize: 13, color: 'rgba(0,0,0,.6)' }}>
          <a href="#" style={{ color: 'rgba(0,0,0,.6)', textDecoration: 'none' }}>Home</a>
          <Icon name="chevron_right" size={16} style={{ color: 'rgba(0,0,0,.38)', margin: '0 2px' }} />
          <a href="#" style={{ color: 'rgba(0,0,0,.6)', textDecoration: 'none' }}>Equipment</a>
          <Icon name="chevron_right" size={16} style={{ color: 'rgba(0,0,0,.38)', margin: '0 2px' }} />
          <a href="#" style={{ color: 'rgba(0,0,0,.6)', textDecoration: 'none' }}>Excavators</a>
          <Icon name="chevron_right" size={16} style={{ color: 'rgba(0,0,0,.38)', margin: '0 2px' }} />
          <span style={{ color: 'rgba(0,0,0,.87)' }}>Caterpillar</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 12 }}>
          <h4 style={{ fontFamily: 'Roboto', fontSize: 28, fontWeight: 400,
                       color: 'rgba(0,0,0,.87)' }}>
            Results for “{query}”
          </h4>
          <span style={{ fontFamily: 'Roboto', fontSize: 14, color: 'rgba(0,0,0,.6)' }}>
            {counts.all.toLocaleString()} matches
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '16px 24px 0',
                     borderBottom: '1px solid rgba(0,0,0,.12)' }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { k: 'all', label: 'All results', icon: 'apps', count: counts.all },
            { k: 'auctions', label: 'Auctions', icon: 'gavel', count: counts.auctions },
            { k: 'buynow', label: 'Marketplace', icon: 'storefront', count: counts.buynow },
          ].map(t => {
            const active = tab === t.k;
            return (
              <button key={t.k} onClick={() => setTab(t.k)} style={{
                border: 0, background: 'transparent', padding: '12px 20px',
                display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                fontFamily: 'Roboto', fontSize: 14, fontWeight: 500,
                color: active ? '#E87511' : 'rgba(0,0,0,.6)',
                textTransform: 'uppercase', letterSpacing: '.4px',
                borderBottom: `2px solid ${active ? '#E87511' : 'transparent'}`,
                marginBottom: -1,
              }}>
                <Icon name={t.icon} size={18} />
                {t.label}
                <span style={{
                  height: 20, padding: '0 6px', borderRadius: 10,
                  background: active ? 'rgba(232,117,17,.12)' : 'rgba(0,0,0,.08)',
                  color: active ? '#E87511' : 'rgba(0,0,0,.6)',
                  fontSize: 12, display: 'inline-flex', alignItems: 'center',
                  fontWeight: 500, textTransform: 'none', letterSpacing: 0,
                }}>{t.count.toLocaleString()}</span>
              </button>
            );
          })}
        </div>

        {/* All results — auction + marketplace slices */}
        {tab === 'all' && (
          <div style={{ display: 'flex', gap: 0, paddingTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { k: 'a_closest', label: 'Closest to me', icon: 'near_me', count: auctionStock.length },
              { k: 'closing_today', label: 'Closing today', icon: 'today',
                count: closingTodayAuctionsSorted.length + closingTodayFiltered.length },
              { k: 'a_all', label: 'All auctions', icon: 'gavel', count: auctionStock.length },
              { k: 'm_absolute', label: 'Absolute sale', icon: 'verified', count: absoluteFiltered.length },
              { k: 'm_bnobo', label: 'Buy Now / Best Offer', icon: 'local_offer',
                count: listingBuynowCount },
            ].map(s => {
              const active = allSubTab === s.k;
              return (
                <button key={s.k} type="button"
                        onClick={() => setAllSubTab(prev => (prev === s.k ? null : s.k))} style={{
                  padding: '8px 14px', marginRight: 8, marginBottom: 10,
                  display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  fontFamily: 'Roboto', fontSize: 13, fontWeight: 500,
                  color: active ? '#E87511' : 'rgba(0,0,0,.72)',
                  background: active ? 'rgba(232,117,17,.08)' : 'transparent',
                  border: `1px solid ${active ? '#E87511' : 'rgba(0,0,0,.23)'}`,
                  borderRadius: 9999,
                }}>
                  <Icon name={s.icon} size={16} />
                  {s.label}
                  <span style={{
                    height: 18, padding: '0 6px', borderRadius: 9,
                    background: active ? '#E87511' : 'rgba(0,0,0,.08)',
                    color: active ? '#fff' : 'rgba(0,0,0,.6)',
                    fontSize: 11, display: 'inline-flex', alignItems: 'center', fontWeight: 500,
                  }}>{s.count.toLocaleString()}</span>
                </button>
              );
            })}
            {allSubTab != null && (
              <button type="button" onClick={() => setAllSubTab(null)} style={{
                marginBottom: 10, padding: '8px 12px', border: 0, background: 'transparent',
                cursor: 'pointer', fontFamily: 'Roboto', fontSize: 13, color: '#9747FF',
                textDecoration: 'underline',
              }}>Full inventory</button>
            )}
          </div>
        )}

        {/* Marketplace sub-tabs */}
        {tab === 'buynow' && (
          <div style={{ display: 'flex', gap: 0, paddingTop: 4 }}>
            {[
              { k: 'absolute', label: 'Absolute sale', icon: 'verified', count: absoluteFiltered.length },
              { k: 'closing', label: 'Closing today', icon: 'timer', count: closingTodayFiltered.length },
              { k: 'bnobo', label: 'Buy Now / Best Offer', icon: 'local_offer',
                count: listingBuynowCount },
            ].map(s => {
              const active = subTab === s.k;
              return (
                <button key={s.k} onClick={() => setSubTab(s.k)} style={{
                  padding: '8px 14px', marginRight: 8, marginBottom: 10,
                  display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  fontFamily: 'Roboto', fontSize: 13, fontWeight: 500,
                  color: active ? '#E87511' : 'rgba(0,0,0,.72)',
                  background: active ? 'rgba(232,117,17,.08)' : 'transparent',
                  border: `1px solid ${active ? '#E87511' : 'rgba(0,0,0,.23)'}`,
                  borderRadius: 9999,
                }}>
                  <Icon name={s.icon} size={16} />
                  {s.label}
                  <span style={{
                    height: 18, padding: '0 6px', borderRadius: 9,
                    background: active ? '#E87511' : 'rgba(0,0,0,.08)',
                    color: active ? '#fff' : 'rgba(0,0,0,.6)',
                    fontSize: 11, display: 'inline-flex', alignItems: 'center', fontWeight: 500,
                  }}>{s.count.toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        )}

        {tab === 'auctions' && (
          <div style={{ display: 'flex', gap: 0, paddingTop: 4, flexWrap: 'wrap' }}>
            {[
              { k: 'closest', label: 'Closest to me', icon: 'near_me', count: auctionStock.length },
              { k: 'closing', label: 'Closing Today', icon: 'today', count: closingTodayAuctionsSorted.length },
              { k: 'all', label: 'All auctions', icon: 'gavel', count: auctionStock.length },
            ].map(s => {
              const active = auctionSubTab === s.k;
              return (
                <button key={s.k} type="button" onClick={() => setAuctionSubTab(s.k)} style={{
                  padding: '8px 14px', marginRight: 8, marginBottom: 10,
                  display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  fontFamily: 'Roboto', fontSize: 13, fontWeight: 500,
                  color: active ? '#E87511' : 'rgba(0,0,0,.72)',
                  background: active ? 'rgba(232,117,17,.08)' : 'transparent',
                  border: `1px solid ${active ? '#E87511' : 'rgba(0,0,0,.23)'}`,
                  borderRadius: 9999,
                }}>
                  <Icon name={s.icon} size={16} />
                  {s.label}
                  <span style={{
                    height: 18, padding: '0 6px', borderRadius: 9,
                    background: active ? '#E87511' : 'rgba(0,0,0,.08)',
                    color: active ? '#fff' : 'rgba(0,0,0,.6)',
                    fontSize: 11, display: 'inline-flex', alignItems: 'center', fontWeight: 500,
                  }}>{s.count.toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 24px 48px',
                    display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32 }}>
        <Filters state={filters} update={update} quickFilterCounts={quickFilterCounts} />

        <div>
          {/* Active chips + toolbar */}
          {activeChips.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {activeChips.map((c, i) => (
                <Chip key={i} label={c.label} size="small"
                      onDelete={() => removeChip(c)} />
              ))}
              <Link onClick={() => setFilters(f => ({
                ...f, categories: new Set(), makes: new Set(), inspection: new Set(),
                yearMin: '', yearMax: '', hoursMax: '',
                quickFilters: new Set(),
              }))}>
                Clear
              </Link>
            </div>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
            padding: '12px 16px', background: '#fff', borderRadius: 4,
            border: '1px solid rgba(0,0,0,.12)',
          }}>
            <div style={{ fontFamily: 'Roboto', fontSize: 14, color: 'rgba(0,0,0,.87)' }}>
              <strong style={{ fontWeight: 500 }}>
                {visible.length.toLocaleString()}
              </strong>
              <span style={{ color: 'rgba(0,0,0,.6)' }}> of {resultTotal.toLocaleString()} items</span>
            </div>
            <div style={{ flex: 1 }} />

            {/* Sort dropdown */}
            <div ref={sortRef} style={{ position: 'relative' }}>
              <button onClick={() => setSortOpen(!sortOpen)} style={{
                height: 36, padding: '0 12px', border: '1px solid rgba(0,0,0,.23)',
                background: '#fff', borderRadius: 4, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'Roboto', fontSize: 14, color: 'rgba(0,0,0,.87)',
              }}>
                <span style={{ color: 'rgba(0,0,0,.6)' }}>Sort:</span>
                {sort}
                <Icon name="arrow_drop_down" size={20} style={{ color: 'rgba(0,0,0,.54)' }} />
              </button>
              <Menu anchor={sortRef.current} open={sortOpen} onClose={() => setSortOpen(false)}>
                {['Closing soonest', 'Newest listings', 'Price: low to high',
                  'Price: high to low', 'Year: newest', 'Distance'].map(o => (
                  <MenuItem key={o} onClick={() => { setSort(o); setSortOpen(false); }}>
                    {o}
                  </MenuItem>
                ))}
              </Menu>
            </div>

            {/* View toggle */}
            <div style={{ display: 'inline-flex', borderRadius: 4,
                          border: '1px solid rgba(0,0,0,.23)', overflow: 'hidden' }}>
              {[
                { v: 'list', ic: 'view_list' },
                { v: 'grid', ic: 'view_module' },
              ].map(x => {
                const active = view === x.v;
                return (
                  <button key={x.v} onClick={() => setView(x.v)} style={{
                    border: 0, width: 40, height: 36,
                    background: active ? 'rgba(232,117,17,.08)' : '#fff',
                    color: active ? '#E87511' : 'rgba(0,0,0,.54)',
                    cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}><Icon name={x.ic} size={20} /></button>
                );
              })}
            </div>
          </div>

          {(inBnobo || (tab === 'all' && allSubTab === 'm_bnobo')) && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', background: 'rgba(232,117,17,.08)',
              borderRadius: 4, border: '1px solid rgba(232,117,17,.28)',
              fontFamily: 'Roboto', fontSize: 13, color: 'rgba(0,0,0,.87)',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <Icon name="hourglass_top" size={20} style={{ color: '#E87511', flexShrink: 0 }} />
              <span>
                <strong style={{ fontWeight: 600 }}>30-day listing countdown.</strong>{' '}
                Buy Now and Best Offer listings run for up to 30 days; each card shows time left in that window.
                Results are sorted by ending soonest.
              </span>
            </div>
          )}

          {/* Results */}
          {inClosingToday ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {visible.map(L => (
                <ClosingTodayCard key={L.id} L={L}
                                  saved={saved.has(L.id)}
                                  onSave={toggleSave} />
              ))}
            </div>
          ) : inAbsolute ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {visible.map(L => (
                <AbsoluteSaleCard key={L.id} L={L}
                                  saved={saved.has(L.id)}
                                  onSave={toggleSave} />
              ))}
            </div>
          ) : view === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}>
              {visible.map(L => (
                <ListingCardGrid key={L.id} L={L}
                                 saved={saved.has(L.id)}
                                 onSave={toggleSave}
                                 showBuyNowOfferTimer={showBuyNowOfferTimer} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {visible.map(L => (
                <ListingCardList key={L.id} L={L}
                                 saved={saved.has(L.id)}
                                 onSave={toggleSave}
                                 showBuyNowOfferTimer={showBuyNowOfferTimer} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center',
                        justifyContent: 'center', paddingTop: 32 }}>
            <Button variant="text" startIcon="chevron_left"
                    onClick={() => setPage(Math.max(1, page - 1))}>PREV</Button>
            {[1, 2, 3, 4, 5, '…', 248].map((p, i) => {
              const active = p === page;
              return (
                <button key={i} onClick={() => typeof p === 'number' && setPage(p)} style={{
                  border: 0, background: active ? '#E87511' : 'transparent',
                  color: active ? '#fff' : 'rgba(0,0,0,.87)',
                  minWidth: 36, height: 36, borderRadius: 4,
                  padding: '0 10px',
                  fontFamily: 'Roboto', fontSize: 14, fontWeight: active ? 500 : 400,
                  cursor: typeof p === 'number' ? 'pointer' : 'default',
                }}>{p}</button>
              );
            })}
            <Button variant="text" endIcon="chevron_right"
                    onClick={() => setPage(page + 1)}>NEXT</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.SearchResultsScreen = SearchResultsScreen;
