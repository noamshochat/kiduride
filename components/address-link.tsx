'use client'

interface AddressLinkProps {
  address: string
  className?: string
}

export function AddressLink({ address, className = '' }: AddressLinkProps) {
  const encoded = encodeURIComponent(address)

  return (
    <span className="inline-flex flex-col gap-1">
      <span className={className}>{address}</span>
      <span className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => window.open(`https://waze.com/ul?q=${encoded}&navigate=yes`, '_blank', 'noopener,noreferrer')}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 active:bg-cyan-200 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C7.03 2 3 6.03 3 11c0 3.1 1.53 5.84 3.89 7.54l-.6 2.46 2.5-.78C9.82 20.7 10.89 21 12 21c4.97 0 9-4.03 9-9s-4.03-10-9-10z" fill="#33CCFF"/>
            <circle cx="9.5" cy="11.5" r="1" fill="#333"/>
            <circle cx="14.5" cy="11.5" r="1" fill="#333"/>
            <path d="M9.5 14.5c.7.7 1.6 1 2.5 1s1.8-.3 2.5-1" stroke="#333" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          Waze
        </button>
        <button
          type="button"
          onClick={() => window.open(`https://maps.google.com/?q=${encoded}`, '_blank', 'noopener,noreferrer')}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 active:bg-red-200 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/>
            <circle cx="12" cy="9" r="2.2" fill="white"/>
          </svg>
          Maps
        </button>
      </span>
    </span>
  )
}
