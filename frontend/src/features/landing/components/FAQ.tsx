import { useState } from 'react';
import { Plus } from 'lucide-react';

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
    <section id="faq" className="relative py-16 sm:py-24 border-t-2 border-white bg-black">
      <div className="container-shell max-w-4xl mx-auto">
        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl uppercase">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm font-bold uppercase tracking-wider text-muted max-w-xl mx-auto">
            Everything you need to know about our enterprise intelligence platform, backtesting engine, and AI assistant.
          </p>
        </div>

        {/* 5 Accordion Questions List */}
        <div className="flex flex-col gap-4">
          {FAQS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="border-2 border-white bg-ink-card p-5 shadow-brutal-sm rounded-md"
              >
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="w-full flex items-center justify-between text-left focus-visible:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-black uppercase text-white pr-4">
                    {item.question}
                  </span>
                  <div
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center border-2 border-white bg-black text-white hover:bg-lime hover:text-black transition-all rounded-md ${
                      isOpen ? 'rotate-45 bg-lime text-black' : ''
                    }`}
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t-2 border-white text-xs sm:text-sm text-muted font-medium leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
