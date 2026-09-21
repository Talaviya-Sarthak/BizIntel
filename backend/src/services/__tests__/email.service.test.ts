import { describe, it, expect, vi } from 'vitest';
import { sendWelcomeEmail } from '../email.service';

describe('EmailService', () => {
  it('should be defined and callable', () => {
    expect(sendWelcomeEmail).toBeDefined();
    expect(typeof sendWelcomeEmail).toBe('function');
  });

  it('should handle welcome email dispatch gracefully', async () => {
    const result = await sendWelcomeEmail('testuser@example.com', 'Test User');
    expect(typeof result).toBe('boolean');
  });
});
