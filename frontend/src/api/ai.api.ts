import type { ChatResponse, SSEEventPayload } from '../types/ai.types';
import { api } from '../lib/api';
import { getAccessToken } from '../lib/authToken';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || '/api/v1';

export async function sendChatMessage(message: string, sessionId?: string): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>(
    `${API_BASE}/ai/chat`,
    { message, sessionId },
  );
  return data;
}

export function subscribeToAIStream(
  message: string,
  sessionId?: string,
  onEvent?: (payload: SSEEventPayload) => void,
  onError?: (err: any) => void,
): () => void {
  const url = `${API_BASE}/ai/stream?message=${encodeURIComponent(message)}${sessionId ? `&sessionId=${sessionId}` : ''}`;
  const controller = new AbortController();

  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  fetch(url, {
    credentials: 'include',
    headers,
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        onError?.(new Error(`SSE request failed: ${response.status}`));
        return;
      }
      const reader = response.body?.getReader();
      if (!reader) {
        onError?.(new Error('No response body'));
        return;
      }
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: SSEEventPayload = JSON.parse(line.slice(6));
              onEvent?.(data);
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError?.(err);
      }
    });

  return () => {
    controller.abort();
  };
}
