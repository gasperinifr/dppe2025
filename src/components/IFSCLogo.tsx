export function IFSCLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" rx="12" fill="currentColor" className="text-white/20" />
      <text 
        x="50" 
        y="40" 
        textAnchor="middle" 
        fill="white" 
        fontSize="24" 
        fontWeight="bold"
        fontFamily="system-ui"
      >
        IFSC
      </text>
      <text 
        x="50" 
        y="65" 
        textAnchor="middle" 
        fill="white" 
        fontSize="10"
        fontFamily="system-ui"
      >
        Instituto Federal
      </text>
      <text 
        x="50" 
        y="78" 
        textAnchor="middle" 
        fill="white" 
        fontSize="10"
        fontFamily="system-ui"
      >
        Santa Catarina
      </text>
    </svg>
  );
}
