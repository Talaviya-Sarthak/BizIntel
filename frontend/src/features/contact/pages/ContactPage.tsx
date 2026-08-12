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
        <main className="flex-1 flex items-center justify-center px-4 pt-20 pb-4 relative z-10 w-full">
          <div className="border-2 border-white bg-ink-card shadow-brutal overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-[1.2fr_1fr] rounded-md">
            {/* Left Column: Get in touch info */}
            <div className="p-8 flex flex-col justify-between gap-6 bg-black">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
                  Get in touch
                </h1>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted max-w-sm">
                  If you have any questions regarding our Services or need help, please fill out the form here. We do our best to respond within 1 business day.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center border-2 border-white bg-ink-card text-white rounded-md">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">Email</h3>
                      <p className="text-[11px] text-muted font-bold truncate">support@ps05.io</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center border-2 border-white bg-ink-card text-white rounded-md">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">Phone</h3>
                      <p className="text-[11px] text-muted font-bold">+1 (800) 555-0199</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center border-2 border-lime bg-lime/10 text-lime rounded-md">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-lime">Response SLA</h3>
                    <p className="text-[11px] text-muted font-bold">Under 2 hours during business hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Minimal Form */}
            <div className="p-8 border-t md:border-t-0 md:border-l-2 border-white bg-ink-soft flex flex-col justify-center">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
                  <div className="h-14 w-14 border-2 border-lime bg-lime/10 flex items-center justify-center text-lime rounded-md">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">Message Sent</h3>
                    <p className="mt-1 text-xs text-muted font-bold">
                      We'll respond to <span className="text-white">{email}</span> shortly.
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
                    className="w-full mt-2"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {errorMessage && (
                    <div className="flex items-center gap-2 border-2 border-pink bg-pink/5 p-2.5 text-xs font-bold uppercase tracking-wider text-pink">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid gap-1.5">
                    <label htmlFor="contact-name" className="text-xs font-bold uppercase tracking-wider text-white">
                      Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder=""
                      className="h-10 w-full border-2 border-white bg-black px-3 text-sm text-white placeholder:text-muted outline-none transition-all rounded-md focus:border-lime focus:shadow-[4px_4px_0px_#C6FF00]"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="contact-email" className="text-xs font-bold uppercase tracking-wider text-white">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder=""
                      className="h-10 w-full border-2 border-white bg-black px-3 text-sm text-white placeholder:text-muted outline-none transition-all rounded-md focus:border-lime focus:shadow-[4px_4px_0px_#C6FF00]"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="contact-phone" className="text-xs font-bold uppercase tracking-wider text-white">
                      Phone
                    </label>
                    <input
                      id="contact-phone"
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder=""
                      className="h-10 w-full border-2 border-white bg-black px-3 text-sm text-white placeholder:text-muted outline-none transition-all rounded-md focus:border-lime focus:shadow-[4px_4px_0px_#C6FF00]"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="contact-message" className="text-xs font-bold uppercase tracking-wider text-white">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder=""
                      className="w-full border-2 border-white bg-black p-3 text-sm text-white placeholder:text-muted outline-none transition-all rounded-md focus:border-lime focus:shadow-[4px_4px_0px_#C6FF00] resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    loading={submitting}
                    className="w-full mt-2"
                  >
                    Submit
                  </Button>
                </form>
              )}
            </div>
          </div>
        </main>

        {/* Minimal Footer Bar */}
        <footer className="w-full border-t-2 border-white py-3.5 px-6 bg-black z-10 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted">
          <span>© {new Date().getFullYear()} BizIntel-Enterprise Intelligence. All rights reserved.</span>
          <span className="inline-flex items-center gap-2 border border-lime bg-lime/10 px-2 py-0.5 text-lime rounded-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />
            All Systems Operational
          </span>
        </footer>
      </div>
    </PlatformBackground>
  );
}
