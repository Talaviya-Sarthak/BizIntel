import axios from 'axios';
import type { ChatResponse, SSEEventPayload } from '../types/ai.types';

const API_BASE = '/api/v1';

export async function sendChatMessage(message: string, sessionId?: string): Promise<ChatResponse> {
  const response = await axios.post<ChatResponse>(
    `${API_BASE}/ai/chat`,
    { message, sessionId },
    { withCredentials: true },
  );
  return response.data;
}

export function subscribeToAIStream(
  message: string,
  sessionId?: string,
  onEvent?: (payload: SSEEventPayload) => void,
  onError?: (err: any) => void,
): () => void {
  const url = `${API_BASE}/ai/stream?message=${encodeURIComponent(message)}${sessionId ? `&sessionId=${sessionId}` : ''}`;
  const eventSource = new EventSource(url, { withCredentials: true });

  eventSource.onmessage = (event) => {
    try {
      const data: SSEEventPayload = JSON.parse(event.data);
      if (onEvent) onEvent(data);
    } catch (e) {
      // Ignore parse errors
    }
  };

  eventSource.onerror = (err) => {
    if (onError) onError(err);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}
