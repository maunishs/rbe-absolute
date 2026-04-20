// Placeholder.jsx — SVG-based equipment placeholder cards so the page looks real
// Each one is a minimal silhouette on a soft tint; mimics a real machine photo.

const PlaceholderSVG = ({ img, style }) => {
  const bg = '#F5F5F5';
  const sky = '#EEEEEE';
  const ground = '#E0E0E0';
  const machine = '#E87511';
  const machineDark = '#B45C00';
  /** Cat 336 demo — soft peach so placeholders don’t compete with UI orange. */
  const catFill = '#FDF3EC';
  const catShade = '#F0D9C8';
  /** Light charcoal so tracks / buckets / glass read softly on #F5F5F5. */
  const silhouette = '#9A9A9A';
  const wheelHub = '#B5B5B5';
  const cabGlass = '#8C8C8C';
  const detail = '#7E7E7E';

  const common = (
    <>
      <rect x="0" y="0" width="400" height="260" fill={bg} />
      <rect x="0" y="180" width="400" height="80" fill={ground} />
      <rect x="0" y="150" width="400" height="30" fill={sky} opacity="0.6" />
    </>
  );

  const shapes = {
    'cat-excavator': (
      <>
        {/* tracks */}
        <rect x="80" y="180" width="220" height="24" rx="12" fill={silhouette} />
        <circle cx="95" cy="192" r="10" fill={wheelHub} />
        <circle cx="285" cy="192" r="10" fill={wheelHub} />
        {/* body */}
        <rect x="120" y="130" width="140" height="55" rx="4" fill={catFill} />
        <rect x="130" y="110" width="80" height="30" rx="4" fill={catFill} />
        <rect x="138" y="118" width="60" height="18" fill={cabGlass} />
        {/* boom */}
        <polygon points="240,145 320,80 335,90 260,160" fill={catFill} />
        <polygon points="325,85 360,120 350,135 315,100" fill={catShade} />
        {/* bucket */}
        <path d="M345 130 L375 130 L380 155 L350 158 Z" fill={silhouette} />
      </>
    ),
    'komatsu-dozer': (
      <>
        <rect x="70" y="170" width="260" height="36" rx="6" fill={silhouette} />
        <circle cx="90" cy="188" r="12" fill={wheelHub} />
        <circle cx="200" cy="188" r="12" fill={wheelHub} />
        <circle cx="310" cy="188" r="12" fill={wheelHub} />
        <rect x="120" y="120" width="140" height="55" fill={machine} />
        <rect x="150" y="100" width="80" height="30" fill={machine} />
        <rect x="158" y="106" width="65" height="20" fill={cabGlass} />
        {/* blade */}
        <rect x="40" y="130" width="20" height="75" fill={machineDark} />
        <polygon points="60,130 90,140 90,200 60,205" fill={machine} />
      </>
    ),
    'jd-grader': (
      <>
        <circle cx="90" cy="195" r="14" fill={silhouette} />
        <circle cx="180" cy="195" r="14" fill={silhouette} />
        <circle cx="240" cy="195" r="14" fill={silhouette} />
        <circle cx="310" cy="195" r="14" fill={silhouette} />
        <rect x="60" y="150" width="260" height="25" fill={machine} />
        <rect x="220" y="120" width="90" height="40" fill={machine} />
        <rect x="230" y="128" width="70" height="25" fill={cabGlass} />
        {/* blade */}
        <polygon points="120,165 210,175 200,195 130,190" fill={machineDark} />
      </>
    ),
    'volvo-adt': (
      <>
        <circle cx="105" cy="195" r="16" fill={silhouette} />
        <circle cx="260" cy="195" r="16" fill={silhouette} />
        <circle cx="300" cy="195" r="16" fill={silhouette} />
        <rect x="70" y="140" width="90" height="55" fill={machine} />
        <rect x="85" y="118" width="50" height="30" fill={cabGlass} />
        {/* dump bed */}
        <polygon points="160,110 340,110 330,185 170,185" fill={machineDark} />
      </>
    ),
    'kenworth-truck': (
      <>
        <circle cx="90" cy="195" r="14" fill={silhouette} />
        <circle cx="155" cy="195" r="14" fill={silhouette} />
        <circle cx="215" cy="195" r="14" fill={silhouette} />
        <circle cx="300" cy="195" r="14" fill={silhouette} />
        {/* cab */}
        <rect x="60" y="130" width="80" height="55" fill={machine} />
        <rect x="70" y="140" width="55" height="25" fill={cabGlass} />
        {/* dump body */}
        <polygon points="150,95 340,100 340,185 150,185" fill={machineDark} />
      </>
    ),
    'bobcat-skid': (
      <>
        <circle cx="130" cy="195" r="18" fill={silhouette} />
        <circle cx="260" cy="195" r="18" fill={silhouette} />
        <rect x="115" y="145" width="160" height="50" fill={machine} />
        <rect x="135" y="115" width="90" height="40" fill={machine} />
        <rect x="145" y="123" width="70" height="26" fill={cabGlass} />
        {/* arms + bucket */}
        <rect x="75" y="148" width="50" height="8" fill={machineDark} />
        <polygon points="40,140 75,140 75,172 45,168" fill={silhouette} />
      </>
    ),
    'genie-lift': (
      <>
        <rect x="80" y="175" width="150" height="30" fill={silhouette} />
        <circle cx="100" cy="200" r="12" fill={wheelHub} />
        <circle cx="210" cy="200" r="12" fill={wheelHub} />
        {/* telescopic boom */}
        <polygon points="150,165 320,50 340,58 170,180" fill={machine} />
        <rect x="310" y="40" width="40" height="28" fill={machineDark} />
        <rect x="315" y="30" width="30" height="12" fill={cabGlass} />
      </>
    ),
    'peterbilt-truck': (
      <>
        <circle cx="90" cy="195" r="14" fill={silhouette} />
        <circle cx="160" cy="195" r="14" fill={silhouette} />
        <circle cx="220" cy="195" r="14" fill={silhouette} />
        {/* long hood cab */}
        <rect x="55" y="115" width="100" height="70" fill={machine} />
        <rect x="70" y="125" width="60" height="30" fill={cabGlass} />
        {/* sleeper */}
        <rect x="155" y="105" width="110" height="80" fill={machineDark} />
        {/* stacks */}
        <rect x="155" y="70" width="8" height="40" fill={detail} />
        <rect x="255" y="70" width="8" height="40" fill={detail} />
      </>
    ),
    'jcb-backhoe': (
      <>
        <circle cx="100" cy="195" r="18" fill={silhouette} />
        <circle cx="285" cy="195" r="22" fill={silhouette} />
        <rect x="140" y="140" width="130" height="50" fill={machine} />
        <rect x="155" y="115" width="80" height="30" fill={machine} />
        <rect x="163" y="122" width="65" height="20" fill={cabGlass} />
        {/* loader arm front */}
        <polygon points="50,160 130,158 130,175 55,180" fill={machineDark} />
        <polygon points="40,160 60,180 40,185" fill={silhouette} />
        {/* backhoe rear */}
        <polygon points="270,150 320,80 335,85 280,160" fill={machineDark} />
        <path d="M320 80 L345 115 L335 125 L315 95 Z" fill={silhouette} />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice"
         style={{ width: '100%', height: '100%', display: 'block', ...style }}>
      {common}
      {shapes[img] || null}
    </svg>
  );
};

window.PlaceholderSVG = PlaceholderSVG;
