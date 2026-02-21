'use client'

interface AddressLinkProps {
  address: string
  className?: string
}

export function AddressLink({ address, className = '' }: AddressLinkProps) {
  const encoded = encodeURIComponent(address)

  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <span className={className}>{address}</span>
      <span className="inline-flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => window.open(`https://waze.com/ul?q=${encoded}&navigate=yes`, '_blank', 'noopener,noreferrer')}
          className="p-1 rounded hover:bg-black/5 active:bg-black/10 transition-colors"
          title="Open in Waze"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C7.03 2 3 6.03 3 11c0 3.1 1.53 5.84 3.89 7.54l-.6 2.46 2.5-.78C9.82 20.7 10.89 21 12 21c4.97 0 9-4.03 9-9s-4.03-10-9-10z" fill="#33CCFF"/>
            <circle cx="9" cy="12" r="1.2" fill="#1a1a1a"/>
            <circle cx="15" cy="12" r="1.2" fill="#1a1a1a"/>
            <path d="M9.5 15c.7.8 1.7 1.3 2.5 1.3s1.8-.5 2.5-1.3" stroke="#1a1a1a" strokeWidth="1" strokeLinecap="round" fill="none"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => window.open(`https://maps.google.com/?q=${encoded}`, '_blank', 'noopener,noreferrer')}
          className="p-1 rounded hover:bg-black/5 active:bg-black/10 transition-colors"
          title="Open in Google Maps"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg>
        </button>
      </span>
    </span>
  )
}
