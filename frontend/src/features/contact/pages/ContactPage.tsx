import React, { useState } from 'react';
import { Navbar } from '../../landing/components/Navbar';
import { PlatformBackground } from '../../landing/components/PlatformBackground';
import { Button } from '../../../components/ui/Button';
import {
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <PlatformBackground>
      <div className="h-screen w-full flex flex-col justify-between overflow-hidden">
        <Navbar />

        {/* Main Non-Scrollable Centered Card Container */}
        <main className="flex-1 flex items-center justify-center px-4 pt-16 pb-4 relative z-10 w-full">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-2xl overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-[1.2fr_1fr] backdrop-blur-md">
            {/* Left Column: Get in touch info */}
            <div className="p-8 flex flex-col justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-50">
                  Get in touch
                </h1>
                <p className="mt-3 text-xs leading-relaxed text-zinc-400 max-w-sm">
                  If you have any questions regarding our Services or need help, please fill out the form here. We do our best to respond within 1 business day.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-100">Email</h3>
                      <p className="text-[11px] text-zinc-400 truncate">support@ps05.io</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-100">Phone</h3>
                      <p className="text-[11px] text-zinc-400">+1 (800) 555-0199</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-emerald-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-100">Response SLA</h3>
                    <p className="text-[11px] text-zinc-400">Under 2 hours during business hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Minimal Form */}
            <div className="p-8 border-t md:border-t-0 md:border-l border-zinc-800/80 bg-zinc-950/60 flex flex-col justify-center">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">Message Sent</h3>
                    <p className="mt-1 text-xs text-zinc-400 max-w-xs">
                      We'll respond to <span className="font-semibold text-zinc-200">{email}</span> shortly.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setEmail('');
                      setPhone('');
                      setMessage('');
                    }}
                    variant="outline"
                    className="h-8 text-xs border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 mt-2"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                  {errorMessage && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-400">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid gap-1">
                    <label htmlFor="contact-name" className="text-xs font-semibold text-zinc-200">
                      Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                    />
                  </div>

                  <div className="grid gap-1">
                    <label htmlFor="contact-email" className="text-xs font-semibold text-zinc-200">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                    />
                  </div>

                  <div className="grid gap-1">
                    <label htmlFor="contact-phone" className="text-xs font-semibold text-zinc-200">
                      Phone
                    </label>
                    <input
                      id="contact-phone"
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000 (optional)"
                      className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                    />
                  </div>

                  <div className="grid gap-1">
                    <label htmlFor="contact-message" className="text-xs font-semibold text-zinc-200">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help your enterprise team?"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    loading={submitting}
                    className="w-full h-10 mt-1 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-semibold transition-colors"
                  >
                    Submit
                  </Button>
                </form>
              )}
            </div>
          </div>
        </main>

        {/* Minimal Footer Bar */}
        <footer className="w-full border-t border-zinc-800/80 py-3 px-6 bg-zinc-950/80 backdrop-blur-sm z-10 flex items-center justify-between text-[11px] text-zinc-500">
          <span>© {new Date().getFullYear()} BizIntel-Enterprise Intelligence. All rights reserved.</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            All Systems Operational
          </span>
        </footer>
      </div>
    </PlatformBackground>
  );
}
