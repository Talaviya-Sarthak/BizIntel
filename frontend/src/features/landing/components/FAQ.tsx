import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import {
  TextShift,
  FadeLift,
  StaggerGroup,
  StaggerItem,
} from '../../../components/motion';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: '1',
    question: 'What is the BizIntel-Enterprise Intelligence Platform?',
    answer:
      'BizIntel is a unified enterprise intelligence platform that converges quantitative strategy backtesting, DataMart SQL analytics, and dataset-aware AI assistants into a single governed workspace.',
  },
  {
    id: '2',
    question: 'What is strategy backtesting and how does it work?',
    answer:
      'Backtesting executes quantitative trading or operational strategies against historical datasets to evaluate CAGR, Sharpe ratio, and drawdown benchmarks prior to live deployment.',
  },
  {
    id: '3',
    question: 'How does BizIntel prevent look-ahead bias in backtests?',
    answer:
      'The backtesting engine strictly sequences dataset snapshots point-in-time. Strategy signals generated at timestamp T can only evaluate data available on or before timestamp T.',
  },
  {
    id: '4',
    question: 'What analytics capabilities does the DataMart module provide?',
    answer:
      'DataMart transforms raw transactional data into high-speed SQL queries, multi-dimensional KPI aggregations, anomaly detection, and live executive dashboards powered by DuckDB.',
  },
  {
    id: '5',
    question: 'What can the Retail AI Assistant do?',
    answer:
      'The Retail AI Assistant translates natural language queries into executable SQL, automatically detecting dataset trends, anomalies, and generating actionable business recommendations.',
  },
];

export function FAQ() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="relative py-12 sm:py-16 border-t border-zinc-800/80 overflow-hidden">
      <div className="container-shell max-w-4xl mx-auto">
        {/* Title */}
        <div className="text-center mb-10">
          <TextShift
            direction="up"
            distance={18}
            duration={0.65}
            as="h2"
            className="text-3xl font-extrabold tracking-tight text-zinc-50 sm:text-5xl font-display uppercase"
          >
            Frequently Asked Questions
          </TextShift>

          <FadeLift delay={0.15} distance={16} duration={0.55}>
            <p className="mt-3 text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
              Everything you need to know about our enterprise intelligence platform, backtesting engine, and AI assistant.
            </p>
          </FadeLift>
        </div>

        {/* 5 Accordion Questions List with StaggerGroup */}
        <StaggerGroup staggerDelay={0.07} initialDelay={0.1} className="flex flex-col gap-3">
          {FAQS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <StaggerItem key={item.id}>
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 transition-colors duration-200 hover:border-zinc-700/80">
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    className="w-full flex items-center justify-between text-left focus-visible:outline-none cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm sm:text-base font-bold text-zinc-100 pr-4">
                      {item.question}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.21, 0.47, 0.32, 0.98] }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-zinc-800/50 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}

export default FAQ;
