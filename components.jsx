// components.jsx — shared MUI-style primitives for the Orbit UI kit
// These are visual-only recreations, not production MUI.

const { useState, useEffect, useRef } = React;

// ------- Icon -------
const Icon = ({ name, size = 24, color, style }) => (
  <span
    className="material-symbols-rounded"
    style={{ fontSize: size, color, lineHeight: 1, ...style }}
  >{name}</span>
);

// ------- Button -------
const Button = ({
  variant = 'contained', color = 'primary', size = 'medium',
  startIcon, endIcon, fullWidth, disabled, children, onClick, style, type
}) => {
  const colors = {
    primary:   { main: '#E87511', dark: '#B45C00', contrast: '#fff', light04: 'rgba(232,117,17,.04)' },
    secondary: { main: '#9747FF', dark: '#7A39CC', contrast: '#fff', light04: 'rgba(151,71,255,.04)' },
    error:     { main: '#D32F2F', dark: '#C62828', contrast: '#fff', light04: 'rgba(211,47,47,.04)' },
    inherit:   { main: '#fff',    dark: 'rgba(255,255,255,.92)', contrast: 'rgba(0,0,0,.87)', light04: 'rgba(255,255,255,.08)' },
  }[color] ?? { main: '#E87511', dark: '#B45C00', contrast: '#fff', light04: 'rgba(232,117,17,.04)' };

  const sizes = {
    small:  { pad: '4px 10px', font: 13, letter: .46, ic: 18, h: 30 },
    medium: { pad: '6px 16px', font: 14, letter: .4,  ic: 20, h: 36 },
    large:  { pad: '8px 22px', font: 15, letter: .46, ic: 22, h: 42 },
  }[size];

  const [hovered, setHovered] = useState(false);
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    border: 0, borderRadius: 4, cursor: disabled ? 'not-allowed' : 'pointer',
    padding: sizes.pad, fontFamily: 'Roboto', fontWeight: 500, fontSize: sizes.font,
    letterSpacing: sizes.letter, lineHeight: 1.75, textTransform: 'uppercase',
    width: fullWidth ? '100%' : 'auto', height: sizes.h, boxSizing: 'border-box',
    transition: 'background 150ms, box-shadow 150ms, border-color 150ms',
    userSelect: 'none',
  };

  let look;
  if (disabled) {
    look = { background: variant === 'contained' ? 'rgba(0,0,0,.12)' : 'transparent',
             color: 'rgba(0,0,0,.26)',
             border: variant === 'outlined' ? '1px solid rgba(0,0,0,.12)' : 0,
             boxShadow: 'none' };
  } else if (variant === 'contained') {
    look = { background: hovered ? colors.dark : colors.main, color: colors.contrast,
             boxShadow: hovered
               ? '0 1px 10px 0 rgba(0,0,0,.12), 0 4px 5px 0 rgba(0,0,0,.14), 0 2px 4px -1px rgba(0,0,0,.2)'
               : '0 1px 5px 0 rgba(0,0,0,.12), 0 2px 2px 0 rgba(0,0,0,.14), 0 3px 1px -2px rgba(0,0,0,.2)' };
  } else if (variant === 'outlined') {
    look = { background: hovered ? colors.light04 : 'transparent', color: colors.main,
             border: `1px solid ${hovered ? colors.main : 'rgba(0,0,0,.23)'}`,
             padding: `calc(${sizes.pad.split(' ')[0]} - 1px) calc(${sizes.pad.split(' ')[1]} - 1px)` };
  } else { // text
    look = { background: hovered ? colors.light04 : 'transparent', color: colors.main,
             padding: `${sizes.pad.split(' ')[0]} 8px` };
  }

  return (
    <button type={type || 'button'} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...look, ...style }}>
      {startIcon && <Icon name={startIcon} size={sizes.ic} />}
      {children}
      {endIcon && <Icon name={endIcon} size={sizes.ic} />}
    </button>
  );
};

// ------- IconButton -------
const IconButton = ({ name, size = 24, color = 'inherit', onClick, style, edge }) => {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        border: 0, background: h ? 'rgba(255,255,255,.08)' : 'transparent',
        width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: color === 'inherit' ? 'currentColor' : color,
        marginLeft: edge === 'start' ? -8 : 0, marginRight: edge === 'end' ? -8 : 0,
        transition: 'background 150ms', ...style,
      }}>
      <Icon name={name} size={size} />
    </button>
  );
};

// ------- TextField (outlined) -------
const TextField = ({ label, value, onChange, type = 'text', fullWidth, error, helperText,
                    startIcon, size = 'medium', placeholder, style }) => {
  const [focused, setFocused] = useState(false);
  const has = (value !== undefined && value !== '') || focused;
  const h = size === 'small' ? 40 : 56;
  const borderColor = error ? '#D32F2F'
    : focused ? '#E87511'
    : 'rgba(0,0,0,.23)';
  const borderWidth = (focused || error) ? 2 : 1;
  const labelColor = error ? '#D32F2F' : focused ? '#E87511' : 'rgba(0,0,0,.6)';

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto', ...style }}>
      <div style={{ position: 'relative', height: h }}>
        {label && (
          <span style={{
            position: 'absolute', pointerEvents: 'none', fontFamily: 'Roboto',
            left: has ? 9 : (startIcon ? 42 : 14),
            top: has ? -8 : (h - 24) / 2 - 2,
            padding: has ? '0 5px' : 0,
            background: has ? '#fff' : 'transparent',
            fontSize: has ? 12 : 16, lineHeight: has ? '16px' : '24px',
            color: labelColor,
            transition: 'all 150ms',
            zIndex: 1,
          }}>{label}</span>
        )}
        {startIcon && (
          <Icon name={startIcon} size={20}
            style={{ position: 'absolute', left: 14, top: (h - 20)/2, color: 'rgba(0,0,0,.54)' }} />
        )}
        <input
          value={value ?? ''} onChange={onChange} type={type} placeholder={focused ? placeholder : ''}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', height: h, boxSizing: 'border-box',
            padding: startIcon ? `0 14px 0 42px` : '0 14px',
            borderRadius: 4, border: `${borderWidth}px solid ${borderColor}`,
            background: '#fff', fontFamily: 'Roboto', fontSize: 16, color: 'rgba(0,0,0,.87)',
            outline: 'none', transition: 'border-color 150ms',
          }}
        />
      </div>
      {helperText && (
        <div style={{ fontFamily: 'Roboto', fontSize: 12, lineHeight: 1.66,
                      color: error ? '#D32F2F' : 'rgba(0,0,0,.6)',
                      margin: '3px 14px 0' }}>{helperText}</div>
      )}
    </div>
  );
};

// ------- Checkbox + label -------
const Checkbox = ({ checked, onChange, label, color = '#E87511' }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                   padding: '9px', margin: '-9px 0', fontFamily: 'Roboto', fontSize: 16,
                   color: 'rgba(0,0,0,.87)' }}>
    <span style={{ width: 18, height: 18, border: `2px solid ${checked ? color : 'rgba(0,0,0,.54)'}`,
                   borderRadius: 2, background: checked ? color : 'transparent',
                   display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                   position: 'relative', marginRight: 9, transition: 'all 120ms' }}
      onClick={() => onChange?.(!checked)}>
      {checked && (
        <span style={{ width: 5, height: 10, borderRight: '2px solid #fff',
                       borderBottom: '2px solid #fff', transform: 'rotate(45deg)',
                       marginTop: -2 }} />
      )}
    </span>
    {label}
  </label>
);

// ------- Avatar -------
const Avatar = ({ children, size = 40, bg, color = '#fff', style }) => {
  const bgColor = bg || ['#E87511','#9747FF','#0288D1','#2E7D32','#D32F2F','#703D29']
    [String(children).charCodeAt(0) % 6];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bgColor, color,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Roboto', fontWeight: 500, fontSize: size * 0.4, flexShrink: 0, ...style,
    }}>{children}</div>
  );
};

// ------- Chip -------
const Chip = ({ label, color = 'default', size = 'medium', variant = 'filled', onDelete, icon }) => {
  const colors = {
    default:   { bg: '#E0E0E0', fg: 'rgba(0,0,0,.87)', out: 'rgba(0,0,0,.23)' },
    primary:   { bg: '#E87511', fg: '#fff',            out: '#E87511' },
    secondary: { bg: '#9747FF', fg: '#fff',            out: '#9747FF' },
    error:     { bg: '#D32F2F', fg: '#fff',            out: '#D32F2F' },
    warning:   { bg: '#EF6C00', fg: '#fff',            out: '#EF6C00' },
    info:      { bg: '#0288D1', fg: '#fff',            out: '#0288D1' },
    success:   { bg: '#2E7D32', fg: '#fff',            out: '#2E7D32' },
  }[color];
  const h = size === 'small' ? 24 : 32;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: h,
      padding: `0 ${size === 'small' ? 8 : 12}px`, borderRadius: 9999,
      background: variant === 'outlined' ? 'transparent' : colors.bg,
      color: variant === 'outlined' ? colors.out : colors.fg,
      border: variant === 'outlined' ? `1px solid ${colors.out}` : 0,
      fontFamily: 'Roboto', fontSize: size === 'small' ? 12 : 13,
    }}>
      {icon && <Icon name={icon} size={size === 'small' ? 14 : 18}
        style={{ marginRight: 4, marginLeft: -4 }} />}
      {label}
      {onDelete && (
        <span onClick={onDelete} style={{
          marginLeft: 4, marginRight: -4, width: size === 'small' ? 16 : 22,
          height: size === 'small' ? 16 : 22, borderRadius: '50%',
          background: variant === 'outlined' ? 'rgba(0,0,0,.26)' : 'rgba(255,255,255,.5)',
          color: variant === 'outlined' ? '#fff' : colors.bg,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, cursor: 'pointer',
        }}>×</span>
      )}
    </span>
  );
};

// ------- AppBar -------
const AppBar = ({ children, color = 'primary', style }) => {
  const bg = color === 'primary' ? '#E87511' : color === 'inherit' ? '#fff' : '#fff';
  const fg = color === 'primary' ? '#fff' : 'rgba(0,0,0,.87)';
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 1100, height: 64, background: bg, color: fg,
      boxShadow: '0 1px 10px 0 rgba(0,0,0,.12), 0 4px 5px 0 rgba(0,0,0,.14), 0 2px 4px -1px rgba(0,0,0,.2)',
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, ...style,
    }}>{children}</div>
  );
};

// ------- Card -------
const Card = ({ children, style }) => (
  <div style={{
    background: '#fff', borderRadius: 4,
    boxShadow: '0 1px 3px 0 rgba(0,0,0,.12), 0 1px 1px 0 rgba(0,0,0,.14), 0 2px 1px -1px rgba(0,0,0,.2)',
    overflow: 'hidden', ...style,
  }}>{children}</div>
);

// ------- Divider -------
const Divider = ({ style }) => (
  <hr style={{ border: 0, borderTop: '1px solid rgba(0,0,0,.12)', margin: 0, ...style }} />
);

// ------- Link -------
const Link = ({ children, onClick, style }) => (
  <a onClick={(e) => { e.preventDefault(); onClick?.(); }}
     style={{ color: '#E87511', fontFamily: 'Roboto', fontSize: 14, textDecoration: 'underline',
              textUnderlineOffset: 2, cursor: 'pointer', ...style }}>{children}</a>
);

// ------- Menu / popover -------
const Menu = ({ anchor, open, onClose, children }) => {
  useEffect(() => {
    if (!open) return;
    const fn = () => onClose?.();
    setTimeout(() => document.addEventListener('click', fn, { once: true }), 0);
    return () => document.removeEventListener('click', fn);
  }, [open]);
  if (!open || !anchor) return null;
  const rect = anchor.getBoundingClientRect();
  return (
    <div style={{
      position: 'fixed', top: rect.bottom + 6, left: Math.max(8, rect.right - 200),
      minWidth: 180, background: '#fff', borderRadius: 4,
      boxShadow: '0 5px 22px 0 rgba(0,0,0,.12), 0 8px 10px 1px rgba(0,0,0,.14), 0 5px 5px -3px rgba(0,0,0,.2)',
      zIndex: 1300, padding: '8px 0',
    }}>{children}</div>
  );
};
const MenuItem = ({ icon, children, onClick }) => {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick}
         onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
         style={{
           padding: '6px 16px', fontFamily: 'Roboto', fontSize: 14,
           color: 'rgba(0,0,0,.87)', cursor: 'pointer',
           background: h ? 'rgba(0,0,0,.04)' : 'transparent',
           display: 'flex', alignItems: 'center', gap: 12,
         }}>
      {icon && <Icon name={icon} size={20} style={{ color: 'rgba(0,0,0,.54)' }} />}
      {children}
    </div>
  );
};

Object.assign(window, {
  Icon, Button, IconButton, TextField, Checkbox, Avatar, Chip, AppBar, Card, Divider, Link, Menu, MenuItem,
});
