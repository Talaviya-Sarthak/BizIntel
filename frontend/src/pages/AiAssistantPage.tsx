import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage, subscribeToAIStream } from '../api/ai.api';
import { ArtifactList } from '../components/artifacts/ArtifactList';
import { StreamingStage } from '../components/chat/StreamingStage';
import { ToolIndicator } from '../components/chat/ToolIndicator';
import { MarkdownRenderer } from '../components/chat/MarkdownRenderer';
import { DynamicChartRenderer } from '../components/charts/DynamicChartRenderer';
import { CitationList } from '../components/citations/CitationList';
import { useChatStore } from '../store/useChatStore';
import type { ChatMessage, VisualizationResult } from '../types/ai.types';

export const AiAssistantPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const {
    sessionId,
    messages,
    isStreaming,
    currentStage,
    stageMessage,
    setSessionId,
    addMessage,
    clearChat,
    setStreaming,
  } = useChatStore();
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

  const handleSend = async (queryText?: string) => {
    const query = (queryText || input).trim();
    if (!query || isStreaming) return;

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
    setStreaming(true, 'Thinking...', 'Analyzing query and datasets...');

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
        content: `⚠️ Unable to process request: ${err?.response?.data?.message || err?.message || 'Server connection error'}`,
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

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      handleSend(lastUserMessage.content);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#171717] text-zinc-100 font-sans overflow-hidden">
      {/* Top Header Bar with Session & Clear Controls */}
      <div className="w-full bg-[#171717] border-b border-white/[0.06] px-8 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-zinc-200">AI Intelligence Assistant</span>
          {messages.length > 0 && (
            <span className="text-[11px] text-zinc-400 font-mono">
              ({messages.length} message{messages.length === 1 ? '' : 's'} stored)
            </span>
          )}
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearChat}
            disabled={isStreaming}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
            title="Clear saved conversation history"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Scrollable Conversation Container */}
      <div className="flex-1 overflow-y-auto w-full px-8 pt-6 pb-6 scroll-smooth">
        <div className="max-w-[900px] mx-auto space-y-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[55vh] text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-100 mb-4 shadow-md">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Enterprise AI Assistant</h2>
              <p className="text-sm text-zinc-400 max-w-md mt-2 leading-relaxed">
                Analyze sales datasets, inspect schemas, evaluate quantitative trading backtests, or query knowledge base documents.
              </p>

              {/* Contextual Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10 max-w-2xl w-full">
                {[
                  { title: 'Analyze Dataset', prompt: 'Analyze this sales dataset' },
                  { title: 'Top Products', prompt: 'Top products by revenue' },
                  { title: 'Inspect Schema', prompt: 'What columns exist?' },
                  { title: 'Knowledge RAG', prompt: 'What is the refund policy?' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleSend(item.prompt);
                    }}
                    className="group p-4 text-left rounded-2xl bg-[#1c1c1c] hover:bg-zinc-800/80 border border-white/[0.06] transition-all text-xs shadow-sm"
                  >
                    <div className="font-semibold text-zinc-200 flex items-center justify-between text-sm">
                      <span>{item.title}</span>
                      <span className="text-zinc-500 group-hover:translate-x-0.5 transition-transform">→</span>
                    </div>
                    <div className="text-zinc-400 mt-1.5 text-xs truncate">"{item.prompt}"</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg: ChatMessage) => (
              <div key={msg.id} className="space-y-3">
                {msg.role === 'user' ? (
                  // User Message (Right Aligned Rounded Bubble)
                  <div className="flex justify-end">
                    <div className="max-w-2xl px-5 py-3 rounded-2xl bg-zinc-800 text-zinc-100 text-sm leading-relaxed shadow-sm border border-zinc-700/50">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  // Assistant Message
                  <div className="flex items-start gap-4 group">
                    <div className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100 shrink-0 mt-1 shadow-xs">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 space-y-3 min-w-0 text-sm text-zinc-200">
                      {/* Developer Diagnostic Component */}
                      {msg.metadata && <ToolIndicator metadata={msg.metadata} />}

                      {/* Custom Enterprise Markdown Renderer */}
                      <MarkdownRenderer content={msg.content} />

                      {/* Visualizations */}
                      {msg.visualizations && msg.visualizations.length > 0 && (
                        <div className="mt-5">
                          {msg.visualizations.map((viz: VisualizationResult) => (
                            <DynamicChartRenderer key={viz.id} visualization={viz} />
                          ))}
                        </div>
                      )}

                      {/* Document Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <CitationList citations={msg.citations} />
                      )}

                      {/* Explicit Export Artifacts */}
                      {msg.artifacts && msg.artifacts.length > 0 && (
                        <ArtifactList artifacts={msg.artifacts} />
                      )}

                      {/* Action Bar: Copy & Regenerate */}
                      <div className="flex items-center gap-3 pt-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-zinc-500">
                        <button
                          onClick={() => copyToClipboard(msg.id, msg.content)}
                          className="hover:text-zinc-200 transition-colors flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                        <span>•</span>
                        <button
                          onClick={handleRegenerate}
                          className="hover:text-zinc-200 transition-colors flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Regenerate</span>
                        </button>
                      </div>
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
      </div>

      {/* Sticky Bottom Input Composer Bar */}
      <div className="w-full bg-[#171717] border-t border-white/[0.06] py-4 shrink-0">
        <div className="max-w-[900px] mx-auto px-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-end rounded-2xl bg-[#1c1c1c] border border-white/[0.08] focus-within:border-white/20 transition-all p-3 shadow-xl"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message or ask an analytics question..."
              disabled={isStreaming}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none max-h-48 min-h-[44px] leading-relaxed"
            />

            <div className="flex items-center gap-2 pb-1 pr-1">
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="p-2.5 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white text-black transition-all shadow-sm shrink-0"
                title="Send Message"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 px-2 mt-2">
            <span>Enterprise AI Assistant</span>
            <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for line break</span>
          </div>
        </div>
      </div>
    </div>
  );
};
