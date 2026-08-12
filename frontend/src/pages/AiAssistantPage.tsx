import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { sendChatMessage, subscribeToAIStream } from '../api/ai.api';
import { ArtifactList } from '../components/artifacts/ArtifactList';
import { StreamingStage } from '../components/chat/StreamingStage';
import { ToolIndicator } from '../components/chat/ToolIndicator';
import { DynamicChartRenderer } from '../components/charts/DynamicChartRenderer';
import { CitationList } from '../components/citations/CitationList';
import { useChatStore } from '../store/useChatStore';
import type { ChatMessage, VisualizationResult } from '../types/ai.types';

export const AiAssistantPage: React.FC = () => {
  const [input, setInput] = useState('');
  const { sessionId, messages, isStreaming, currentStage, stageMessage, setSessionId, addMessage, setStreaming } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, currentStage]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const query = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Add User Message
    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    addMessage(userMsg);

    // Start Streaming Indicator
    setStreaming(true, 'Thinking...', 'Classifying query intent...');

    // Subscribe to SSE Stream updates
    const unsubscribe = subscribeToAIStream(
      query,
      sessionId,
      (payload) => {
        setStreaming(true, payload.stage, payload.message);
      },
      () => {},
    );

    try {
      const res = await sendChatMessage(query, sessionId);
      unsubscribe();

      if (res.sessionId) {
        setSessionId(res.sessionId);
      }

      const assistantMsg: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        visualizations: res.visualizations,
        artifacts: res.artifacts,
        citations: res.citations,
        metadata: res.metadata,
      };
      addMessage(assistantMsg);
    } catch (err: any) {
      unsubscribe();
      addMessage({
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Unable to process query: ${err?.response?.data?.message || err?.message || 'Server connection error'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-[850px] mx-auto px-4 font-sans text-zinc-100 bg-[#090909]">
      {/* Top Bar */}
      <div className="flex items-center justify-between py-3 border-b border-zinc-800/60 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <h1 className="text-sm font-semibold text-zinc-200">Enterprise AI Assistant</h1>
        </div>
        {sessionId && (
          <div className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
            Session Active
          </div>
        )}
      </div>

      {/* Centered Chat Conversation Stream */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 mb-4 shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-zinc-100">Enterprise AI Assistant</h2>
            <p className="text-xs text-zinc-400 max-w-md mt-1.5 leading-relaxed">
              Ask questions about sales analytics, quantitative trading backtests, retail catalog data, or uploaded enterprise documents.
            </p>

            {/* Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8 max-w-xl w-full">
              {[
                { title: 'Sales Analytics', prompt: 'Show monthly sales for 2025' },
                { title: 'Trading Backtest', prompt: 'Compare SMA Crossover vs RSI Strategy' },
                { title: 'Document RAG', prompt: 'What is the company refund policy?' },
                { title: 'Revenue Ranking', prompt: 'Who are top customers by revenue?' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(item.prompt);
                    if (textareaRef.current) textareaRef.current.focus();
                  }}
                  className="group p-3 text-left rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 transition-all text-xs"
                >
                  <div className="font-medium text-zinc-200 flex items-center justify-between">
                    <span>{item.title}</span>
                    <span className="text-zinc-500 group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                  <div className="text-zinc-500 mt-1 text-[11px] truncate">"{item.prompt}"</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg: ChatMessage) => (
            <div key={msg.id} className="space-y-2">
              {msg.role === 'user' ? (
                // User Bubble (Right Aligned Minimalist Monochrome)
                <div className="flex justify-end">
                  <div className="max-w-xl px-4 py-2.5 rounded-2xl bg-zinc-800 text-zinc-100 text-sm leading-relaxed shadow-sm">
                    {msg.content}
                  </div>
                </div>
              ) : (
                // Assistant Message (Left Aligned Premium Markdown Prose)
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-200 shrink-0 mt-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 space-y-2 min-w-0 text-sm text-zinc-200">
                    {/* Collapsible Execution Details Toggle */}
                    {msg.metadata && <ToolIndicator metadata={msg.metadata} />}

                    {/* React Markdown Answer Rendering */}
                    <div className="prose prose-invert prose-zinc prose-sm max-w-none leading-relaxed text-zinc-200">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>

                    {/* Inline Visualizations */}
                    {msg.visualizations && msg.visualizations.length > 0 && (
                      <div className="mt-4">
                        {msg.visualizations.map((viz: VisualizationResult) => (
                          <DynamicChartRenderer key={viz.id} visualization={viz} />
                        ))}
                      </div>
                    )}

                    {/* Document Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <CitationList citations={msg.citations} />
                    )}

                    {/* Downloadable Report Artifacts (Only rendered when non-empty) */}
                    {msg.artifacts && msg.artifacts.length > 0 && (
                      <ArtifactList artifacts={msg.artifacts} />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Live SSE Streaming Stage Indicator */}
        <StreamingStage isStreaming={isStreaming} stage={currentStage} message={stageMessage} />
        <div ref={messagesEndRef} />
      </div>

      {/* ChatGPT / Claude Style Input Composer */}
      <div className="py-3 bg-[#090909]">
        <form
          onSubmit={handleSend}
          className="relative flex items-end rounded-2xl bg-zinc-900 border border-zinc-800 focus-within:border-zinc-600 transition-all p-2 shadow-lg"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            disabled={isStreaming}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none max-h-44 min-h-[40px] leading-relaxed"
          />

          <div className="flex items-center gap-1.5 pb-1 pr-1">
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="p-2 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white text-black transition-all shadow-sm shrink-0"
              title="Send Message"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 px-3 mt-1.5">
          <span>Enterprise AI Assistant</span>
          <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for line break</span>
        </div>
      </div>
    </div>
  );
};
