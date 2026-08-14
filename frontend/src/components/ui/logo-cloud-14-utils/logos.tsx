interface LogoProps {
  className?: string;
}

// 1. GitHub Logo
export const Logo01 = ({ className = "h-7 sm:h-8" }: LogoProps) => (
  <div className={`flex items-center gap-2.5 select-none ${className}`}>
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64 7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
    <span className="text-white font-bold text-base tracking-tight font-sans">GitHub</span>
  </div>
);

// 2. Google Logo
export const Logo02 = ({ className = "h-7 sm:h-8" }: LogoProps) => (
  <div className={`flex items-center gap-2.5 select-none ${className}`}>
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
    <span className="text-white font-bold text-base tracking-tight font-sans">Google</span>
  </div>
);

// 3. Slack Logo
export const Logo03 = ({ className = "h-7 sm:h-8" }: LogoProps) => (
  <div className={`flex items-center gap-2.5 select-none ${className}`}>
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#ECB22E" />
      <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#E01E5A" />
      <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#36C5F0" />
      <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.323A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#2EB67D" />
    </svg>
    <span className="text-white font-bold text-base tracking-tight font-sans">Slack</span>
  </div>
);

// 4. Spotify Logo (Replaced Stripe)
export const Logo04 = ({ className = "h-7 sm:h-8" }: LogoProps) => (
  <div className={`flex items-center gap-2.5 select-none ${className}`}>
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#1DB954" />
      <path d="M17.9 10.9C14.3 8.8 8.3 8.6 4.8 9.7c-.5.2-1.1-.1-1.3-.6-.2-.5.1-1.1.6-1.3 4.1-1.2 10.7-1 14.8 1.4.5.3.6.9.3 1.4-.3.5-.9.6-1.3.3zm-.1 2.8c-.2.4-.7.5-1.1.3-3-1.8-7.5-2.3-11-1.3-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 4-1.2 9-.6 12.4 1.4.3.2.4.8.2 1.1zm-1.2 2.7c-.2.3-.6.4-.9.2-2.6-1.6-5.9-2-9.8-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.2-1 7.9-.5 10.8 1.3.3.2.4.6.3.8z" fill="#ffffff" />
    </svg>
    <span className="text-white font-bold text-base tracking-tight font-sans">Spotify</span>
  </div>
);

// 5. Figma Logo
export const Logo05 = ({ className = "h-7 sm:h-8" }: LogoProps) => (
  <div className={`flex items-center gap-2.5 select-none ${className}`}>
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 24A4 4 0 0 1 4 20A4 4 0 0 1 8 16H12V20A4 4 0 0 1 8 24Z" fill="#0ACF83" />
      <path d="M4 12A4 4 0 0 1 8 8H12V16H8A4 4 0 0 1 4 12Z" fill="#A259FF" />
      <path d="M4 4A4 4 0 0 1 8 0H12V8H8A4 4 0 0 1 4 4Z" fill="#F24E1E" />
      <path d="M12 0H16A4 4 0 0 1 20 4A4 4 0 0 1 16 8H12V0Z" fill="#FF7262" />
      <circle cx="16" cy="12" r="4" fill="#1ABCFE" />
    </svg>
    <span className="text-white font-bold text-base tracking-tight font-sans">Figma</span>
  </div>
);

// 6. Vercel Logo
export const Logo06 = ({ className = "h-7 sm:h-8" }: LogoProps) => (
  <div className={`flex items-center gap-2.5 select-none ${className}`}>
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1L24 22H0L12 1Z" />
    </svg>
    <span className="text-white font-bold text-base tracking-tight font-sans">Vercel</span>
  </div>
);

// 7. Microsoft Logo
export const Logo07 = ({ className = "h-7 sm:h-8" }: LogoProps) => (
  <div className={`flex items-center gap-2.5 select-none ${className}`}>
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
    <span className="text-white font-bold text-base tracking-tight font-sans">Microsoft</span>
  </div>
);

// 8. Notion Logo (Replaced Linear)
export const Logo08 = ({ className = "h-7 sm:h-8" }: LogoProps) => (
  <div className={`flex items-center gap-2.5 select-none ${className}`}>
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l11.713-.84c.327-.023.654.116.864.373.21.257.28.606.187.91l-3.36 10.92c-.187.606-.723 1.05-1.353 1.096l-11.713.84c-.327.023-.654-.116-.864-.373-.21-.257-.28-.606-.187-.91l3.36-10.92c.187-.606.723-1.05 1.353-1.096zm.793 2.147l-2.45 7.98 9.567-.686 2.45-7.98-9.567.686z" />
    </svg>
    <span className="text-white font-bold text-base tracking-tight font-sans">Notion</span>
  </div>
);
