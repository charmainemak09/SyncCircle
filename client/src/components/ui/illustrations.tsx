export function TeamCollaborationIllustration() {
  return (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <defs>
        <linearGradient id="teamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(262, 83%, 58%)" />
          <stop offset="50%" stopColor="hsl(322, 84%, 64%)" />
          <stop offset="100%" stopColor="hsl(217, 91%, 60%)" />
        </linearGradient>
        <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
      </defs>
      
      {/* Background circles */}
      <circle cx="80" cy="60" r="40" fill="hsl(43, 96%, 56%)" opacity="0.1" />
      <circle cx="320" cy="80" r="30" fill="hsl(142, 86%, 28%)" opacity="0.1" />
      <circle cx="350" cy="220" r="50" fill="hsl(262, 83%, 58%)" opacity="0.1" />
      
      {/* Team members */}
      <g>
        {/* Person 1 */}
        <circle cx="120" cy="140" r="25" fill="url(#teamGradient)" />
        <circle cx="120" cy="135" r="8" fill="white" />
        <path d="M108 150 Q120 145 132 150 L132 160 Q120 155 108 160 Z" fill="white" />
        
        {/* Person 2 */}
        <circle cx="200" cy="120" r="25" fill="hsl(142, 86%, 28%)" />
        <circle cx="200" cy="115" r="8" fill="white" />
        <path d="M188 130 Q200 125 212 130 L212 140 Q200 135 188 140 Z" fill="white" />
        
        {/* Person 3 */}
        <circle cx="280" cy="140" r="25" fill="hsl(43, 96%, 56%)" />
        <circle cx="280" cy="135" r="8" fill="white" />
        <path d="M268 150 Q280 145 292 150 L292 160 Q280 155 268 160 Z" fill="white" />
      </g>
      
      {/* Connection lines */}
      <line x1="145" y1="140" x2="175" y2="130" stroke="url(#teamGradient)" strokeWidth="3" opacity="0.6" />
      <line x1="225" y1="130" x2="255" y2="140" stroke="url(#teamGradient)" strokeWidth="3" opacity="0.6" />
      
      {/* Form/survey cards floating */}
      <g>
        <rect x="50" y="200" width="80" height="60" rx="8" fill="url(#cardGradient)" stroke="hsl(262, 83%, 58%)" strokeWidth="2" />
        <line x1="60" y1="220" x2="120" y2="220" stroke="hsl(262, 83%, 58%)" strokeWidth="2" />
        <line x1="60" y1="235" x2="100" y2="235" stroke="hsl(322, 84%, 64%)" strokeWidth="2" />
        <line x1="60" y1="250" x2="110" y2="250" stroke="hsl(217, 91%, 60%)" strokeWidth="2" />
        
        <rect x="270" y="200" width="80" height="60" rx="8" fill="url(#cardGradient)" stroke="hsl(142, 86%, 28%)" strokeWidth="2" />
        <line x1="280" y1="220" x2="340" y2="220" stroke="hsl(142, 86%, 28%)" strokeWidth="2" />
        <line x1="280" y1="235" x2="320" y2="235" stroke="hsl(43, 96%, 56%)" strokeWidth="2" />
        <line x1="280" y1="250" x2="330" y2="250" stroke="hsl(25, 95%, 53%)" strokeWidth="2" />
      </g>
      
      {/* Floating elements */}
      <circle cx="60" cy="80" r="4" fill="hsl(43, 96%, 56%)" />
      <circle cx="340" cy="50" r="3" fill="hsl(322, 84%, 64%)" />
      <circle cx="380" cy="180" r="5" fill="hsl(217, 91%, 60%)" />
    </svg>
  );
}

export function FormsIllustration() {
  return (
    <svg viewBox="0 0 300 250" className="w-full h-full">
      <defs>
        <linearGradient id="formGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(142, 86%, 28%)" />
          <stop offset="100%" stopColor="hsl(43, 96%, 56%)" />
        </linearGradient>
      </defs>
      
      {/* Background shapes */}
      <rect x="20" y="20" width="260" height="210" rx="15" fill="white" stroke="url(#formGradient)" strokeWidth="3" />
      
      {/* Form header */}
      <rect x="40" y="40" width="220" height="30" rx="8" fill="url(#formGradient)" opacity="0.2" />
      <line x1="50" y1="55" x2="180" y2="55" stroke="url(#formGradient)" strokeWidth="3" />
      
      {/* Form fields */}
      <rect x="40" y="90" width="220" height="20" rx="4" fill="hsl(43, 96%, 56%)" opacity="0.3" />
      <rect x="40" y="120" width="180" height="20" rx="4" fill="hsl(262, 83%, 58%)" opacity="0.3" />
      <rect x="40" y="150" width="200" height="20" rx="4" fill="hsl(217, 91%, 60%)" opacity="0.3" />
      
      {/* Checkboxes */}
      <rect x="40" y="185" width="15" height="15" rx="3" fill="hsl(142, 86%, 28%)" />
      <path d="M45 192 L48 195 L52 188" stroke="white" strokeWidth="2" fill="none" />
      
      <rect x="40" y="205" width="15" height="15" rx="3" fill="none" stroke="hsl(262, 83%, 58%)" strokeWidth="2" />
      
      {/* Decorative elements */}
      <circle cx="250" cy="180" r="8" fill="hsl(322, 84%, 64%)" opacity="0.6" />
      <circle cx="270" cy="200" r="5" fill="hsl(43, 96%, 56%)" opacity="0.6" />
    </svg>
  );
}

export function AnalyticsIllustration() {
  return (
    <svg viewBox="0 0 350 200" className="w-full h-full">
      <defs>
        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(217, 91%, 60%)" />
          <stop offset="50%" stopColor="hsl(262, 83%, 58%)" />
          <stop offset="100%" stopColor="hsl(322, 84%, 64%)" />
        </linearGradient>
      </defs>
      
      {/* Chart background */}
      <rect x="50" y="30" width="250" height="140" rx="10" fill="white" stroke="url(#chartGradient)" strokeWidth="2" />
      
      {/* Bar chart */}
      <rect x="80" y="120" width="30" height="30" fill="hsl(43, 96%, 56%)" />
      <rect x="120" y="100" width="30" height="50" fill="hsl(142, 86%, 28%)" />
      <rect x="160" y="90" width="30" height="60" fill="hsl(262, 83%, 58%)" />
      <rect x="200" y="110" width="30" height="40" fill="hsl(322, 84%, 64%)" />
      <rect x="240" y="80" width="30" height="70" fill="hsl(217, 91%, 60%)" />
      
      {/* Chart lines */}
      <line x1="60" y1="50" x2="290" y2="50" stroke="hsl(220, 8.9%, 46.1%)" strokeWidth="1" opacity="0.3" />
      <line x1="60" y1="80" x2="290" y2="80" stroke="hsl(220, 8.9%, 46.1%)" strokeWidth="1" opacity="0.3" />
      <line x1="60" y1="110" x2="290" y2="110" stroke="hsl(220, 8.9%, 46.1%)" strokeWidth="1" opacity="0.3" />
      <line x1="60" y1="140" x2="290" y2="140" stroke="hsl(220, 8.9%, 46.1%)" strokeWidth="1" opacity="0.3" />
      
      {/* Floating metrics */}
      <circle cx="320" cy="60" r="20" fill="hsl(43, 96%, 56%)" opacity="0.2" />
      <text x="320" y="65" textAnchor="middle" fill="hsl(142, 86%, 28%)" fontSize="12" fontWeight="bold">95%</text>
      
      <circle cx="20" cy="100" r="15" fill="hsl(262, 83%, 58%)" opacity="0.2" />
      <text x="20" y="105" textAnchor="middle" fill="hsl(262, 83%, 58%)" fontSize="10" fontWeight="bold">24</text>
    </svg>
  );
}

export function EmptyStateIllustration() {
  return (
    <svg viewBox="0 0 300 200" className="w-full h-full">
      <defs>
        <linearGradient id="emptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(43, 96%, 56%)" />
          <stop offset="100%" stopColor="hsl(25, 95%, 53%)" />
        </linearGradient>
      </defs>
      
      {/* Background elements */}
      <circle cx="150" cy="100" r="60" fill="url(#emptyGradient)" opacity="0.1" />
      <circle cx="150" cy="100" r="40" fill="url(#emptyGradient)" opacity="0.1" />
      
      {/* Main illustration */}
      <rect x="120" y="70" width="60" height="60" rx="8" fill="white" stroke="url(#emptyGradient)" strokeWidth="3" />
      
      {/* Plus icon */}
      <line x1="150" y1="85" x2="150" y2="115" stroke="url(#emptyGradient)" strokeWidth="4" />
      <line x1="135" y1="100" x2="165" y2="100" stroke="url(#emptyGradient)" strokeWidth="4" />
      
      {/* Floating dots */}
      <circle cx="100" cy="60" r="3" fill="hsl(322, 84%, 64%)" opacity="0.6" />
      <circle cx="200" cy="60" r="4" fill="hsl(217, 91%, 60%)" opacity="0.6" />
      <circle cx="90" cy="140" r="2" fill="hsl(262, 83%, 58%)" opacity="0.6" />
      <circle cx="210" cy="140" r="3" fill="hsl(142, 86%, 28%)" opacity="0.6" />
    </svg>
  );
}

export function NotificationIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <linearGradient id="notifGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(322, 84%, 64%)" />
          <stop offset="100%" stopColor="hsl(262, 83%, 58%)" />
        </linearGradient>
      </defs>
      
      {/* Bell shape */}
      <path d="M100 40 Q85 40 85 55 L85 110 Q85 125 75 125 L125 125 Q115 125 115 110 L115 55 Q115 40 100 40 Z" fill="url(#notifGradient)" />
      
      {/* Bell clapper */}
      <circle cx="100" cy="135" r="8" fill="url(#notifGradient)" />
      
      {/* Notification badge */}
      <circle cx="130" cy="50" r="15" fill="hsl(0, 72.2%, 50.6%)" />
      <text x="130" y="55" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">3</text>
      
      {/* Sound waves */}
      <path d="M140 80 Q155 80 155 100 Q155 120 140 120" stroke="hsl(43, 96%, 56%)" strokeWidth="3" fill="none" opacity="0.6" />
      <path d="M145 70 Q165 70 165 100 Q165 130 145 130" stroke="hsl(43, 96%, 56%)" strokeWidth="2" fill="none" opacity="0.4" />
      
      <path d="M60 80 Q45 80 45 100 Q45 120 60 120" stroke="hsl(43, 96%, 56%)" strokeWidth="3" fill="none" opacity="0.6" />
      <path d="M55 70 Q35 70 35 100 Q35 130 55 130" stroke="hsl(43, 96%, 56%)" strokeWidth="2" fill="none" opacity="0.4" />
    </svg>
  );
}