import React, { useState } from 'react';
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

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const query = input.trim();
    setInput('');

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

    // Subscribe to SSE Stream updates for stage feedback
    const unsubscribe = subscribeToAIStream(
      query,
      sessionId,
      (payload) => {
        setStreaming(true, payload.stage, payload.message);
      },
      () => {
        // Fallback on SSE stream error
      },
    );

    try {
      // Execute backend AI pipeline
      const res = await sendChatMessage(query, sessionId);
      unsubscribe();

      if (res.sessionId) {
        setSessionId(res.sessionId);
      }

      // Add Assistant Response Message
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
        content: `⚠️ Error executing query: ${err?.response?.data?.message || err?.message || 'Server error'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-6xl mx-auto px-4 py-2">
      {/* Top Title Bar */}
      <div className="flex items-center justify-between py-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>✨ Enterprise AI Assistant</span>
          </h1>
          <p className="text-xs text-slate-400">
            Natural language multi-turn analytics, quantitative backtesting, and RAG document intelligence
          </p>
        </div>
        {sessionId && (
          <div className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 font-mono">
            Session: {sessionId.substring(0, 14)}...
          </div>
        )}
      </div>

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400">
            <div className="p-4 rounded-full bg-indigo-950/50 text-indigo-400 mb-3 border border-indigo-900/50">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-200">How can I assist your enterprise today?</h3>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              Ask questions about sales analytics, quantitative trading strategies, retail product catalog search, or enterprise document knowledge base.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 max-w-lg w-full">
              {[
                'Show monthly sales for 2025',
                'Compare SMA Crossover vs RSI Strategy',
                'What is the company refund policy?',
                'Who are top customers by revenue?',
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(suggestion);
                  }}
                  className="p-2.5 text-left text-xs rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-300 transition-colors"
                >
                  💡 "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg: ChatMessage) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-3xl rounded-2xl p-4 shadow-sm text-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                {msg.role === 'assistant' && msg.metadata && (
                  <ToolIndicator metadata={msg.metadata} />
                )}

                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                {/* Render Visualizations generated by backend */}
                {msg.visualizations && msg.visualizations.length > 0 && (
                  <div className="mt-3">
                    {msg.visualizations.map((viz: VisualizationResult) => (
                      <DynamicChartRenderer key={viz.id} visualization={viz} />
                    ))}
                  </div>
                )}

                {/* Render Document Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <CitationList citations={msg.citations} />
                )}

                {/* Render Downloadable Artifacts */}
                {msg.artifacts && msg.artifacts.length > 0 && (
                  <ArtifactList artifacts={msg.artifacts} />
                )}

                <div
                  className={`text-[10px] mt-2 text-right ${
                    msg.role === 'user' ? 'text-indigo-200' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Live SSE Streaming Stage Indicator */}
        <StreamingStage isStreaming={isStreaming} stage={currentStage} message={stageMessage} />
      </div>

      {/* Input Form Bar */}
      <form onSubmit={handleSend} className="pt-2 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about sales analytics, trading backtests, or document RAG..."
          disabled={isStreaming}
          className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-md flex items-center gap-1.5"
        >
          <span>Send</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
    </div>
  );
};
