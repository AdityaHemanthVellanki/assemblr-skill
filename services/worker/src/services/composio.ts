/**
 * Composio API client. Decoupled from core logic — only used by adapters.
 */
export class ComposioClient {
  private baseUrl = 'https://backend.composio.dev/api/v1';
  private apiKey: string;

  constructor() {
    const key = process.env.COMPOSIO_API_KEY;
    if (!key) throw new Error('COMPOSIO_API_KEY not set');
    this.apiKey = key;
  }

  async request<T>(method: string, path: string, body?: Record<string, unknown>, query?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), {
      method,
      headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Composio ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  async initiateConnection(appName: string, entityId: string, redirectUrl?: string) {
    return this.request<{ connectionId: string; redirectUrl: string }>('POST', '/connectedAccounts', {
      integrationId: appName,
      entityId,
      ...(redirectUrl ? { redirectUrl } : {}),
    });
  }

  async getConnection(connectionId: string) {
    return this.request<{ id: string; status: string; appName: string }>('GET', `/connectedAccounts/${connectionId}`);
  }

  async executeAction(connectionId: string, actionName: string, params: Record<string, unknown>) {
    return this.request<{ data: unknown }>('POST', `/actions/${actionName}/execute`, {
      connectedAccountId: connectionId,
      input: params,
    });
  }
}
