import type { SettingsMap } from '@pignal/db';
import type { PignalEvent, EventListener } from '../events/event-bus';

/**
 * Create a webhook listener for the EventBus.
 * Reads webhook_url, webhook_events, webhook_secret from settings.
 * Fires HTTP POST to webhook_url with event payload.
 */
export function createWebhookListener(getSettings: () => Promise<SettingsMap>): EventListener {
  return async (event: PignalEvent) => {
    const settings = await getSettings();
    const webhookUrl = settings.webhook_url;
    if (!webhookUrl) return;

    // Check if this event type is in webhook_events
    const enabledEvents = (settings.webhook_events || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (enabledEvents.length > 0 && !enabledEvents.includes(event.type)) return;

    const body = JSON.stringify({
      event: event.type,
      timestamp: event.timestamp,
      data: event.payload,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Pignal-Event': event.type,
    };

    // HMAC signature if webhook_secret is set
    const secret = settings.webhook_secret;
    if (secret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      );
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
      const hex = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      headers['X-Pignal-Signature'] = `sha256=${hex}`;
    }

    // Fire and forget — webhook delivery is best-effort
    try {
      await fetch(webhookUrl, { method: 'POST', headers, body });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Webhook delivery failed for ${event.type}:`, err);
    }
  };
}
