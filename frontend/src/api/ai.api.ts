import type { ChatResponse, SSEEventPayload } from '../types/ai.types';
import { api } from '../lib/api';
import { getAccessToken } from '../lib/authToken';

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function sendChatMessage(message: string, sessionId?: string): Promise<ChatResponse> {
  const headers = authHeaders();
  console.log('[ai.api] sendChatMessage: authHeaders =', JSON.stringify(headers));
  const { data } = await api.post<ChatResponse>(
    '/ai/chat',
    { message, sessionId },
    { headers, timeout: 600_000 },
  );
  return data;
}

export function subscribeToAIStream(
  message: string,
  sessionId?: string,
  onEvent?: (payload: SSEEventPayload) => void,
  onError?: (err: any) => void,
): () => void {
  const baseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || '/api/v1';
  const url = `${baseUrl}/ai/stream?message=${encodeURIComponent(message)}${sessionId ? `&sessionId=${sessionId}` : ''}`;
  const controller = new AbortController();
  const headers = { Accept: 'text/event-stream', ...authHeaders() };
  console.log('[ai.api] subscribeToAIStream: headers =', JSON.stringify(headers));

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
