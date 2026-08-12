import { create } from 'zustand';
import type { ChatMessage, SSEStage } from '../types/ai.types';

interface ChatStoreState {
  sessionId?: string;
  messages: ChatMessage[];
  isStreaming: boolean;
  currentStage?: SSEStage;
  stageMessage?: string;
  setSessionId: (id: string) => void;
  addMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  setStreaming: (status: boolean, stage?: SSEStage, message?: string) => void;
}

export const useChatStore = create<ChatStoreState>((set) => ({
  sessionId: undefined,
  messages: [],
  isStreaming: false,
  currentStage: undefined,
  stageMessage: undefined,

  setSessionId: (id) => set({ sessionId: id }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearChat: () => set({ sessionId: undefined, messages: [], isStreaming: false, currentStage: undefined }),
  setStreaming: (status, stage, message) => set({ isStreaming: status, currentStage: stage, stageMessage: message }),
}));
