import { loadEnv } from './loadEnv.js';

loadEnv();

const readEnvironmentVariable = (key: string): string | undefined => {
  const value = process.env[key];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
};

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseConfigError';
  }
}

export class SupabaseError extends Error {
  status: number;
  code?: string;
  details?: string;
  hint?: string;

  constructor(status: number, message: string, code?: string, details?: string, hint?: string) {
    super(message);
    this.name = 'SupabaseError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.hint = hint;
  }
}

interface SupabaseConfig {
  restUrl: string;
  key: string;
  schema: string;
}

const buildSupabaseConfig = (): SupabaseConfig => {
  const url = readEnvironmentVariable('SUPABASE_URL');
  const key =
    readEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY') ?? readEnvironmentVariable('SUPABASE_ANON_KEY');

  if (!url) {
    throw new SupabaseConfigError('SUPABASE_URL n\'est pas défini.');
  }

  if (!key) {
    throw new SupabaseConfigError(
      'Aucune clé Supabase fournie. Définissez SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY.'
    );
  }

  const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  const schema = readEnvironmentVariable('SUPABASE_SCHEMA') ?? 'public';

  return {
    restUrl: `${normalizedUrl}/rest/v1`,
    key,
    schema
  };
};

let cachedConfig: SupabaseConfig | undefined;

const getSupabaseConfig = (): SupabaseConfig => {
  if (!cachedConfig) {
    cachedConfig = buildSupabaseConfig();
  }
  return cachedConfig;
};

export const ensureSupabaseConfigured = () => {
  void getSupabaseConfig();
};

interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  query?: Record<string, string | undefined>;
  body?: unknown;
  prefer?: string[];
}

const buildUrl = (config: SupabaseConfig, path: string, query?: Record<string, string | undefined>) => {
  const url = new URL(`${config.restUrl}/${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.append(key, value);
      }
    }
  }

  return url;
};

const buildHeaders = (config: SupabaseConfig, method: RequestOptions['method'], prefer?: string[]) => {
  const headers: Record<string, string> = {
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
    Accept: 'application/json',
    'Accept-Profile': config.schema,
    'Content-Profile': config.schema
  };

  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  if (prefer && prefer.length > 0) {
    headers.Prefer = prefer.join(', ');
  }

  return headers;
};

interface SupabaseErrorPayload {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

export const supabaseRequest = async <T>(options: RequestOptions): Promise<T> => {
  const config = getSupabaseConfig();
  const url = buildUrl(config, options.path, options.query);
  const headers = buildHeaders(config, options.method, options.prefer);

  const response = await fetch(url, {
    method: options.method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    let payload: SupabaseErrorPayload | undefined;

    try {
      payload = (await response.json()) as SupabaseErrorPayload;
    } catch (error) {
      payload = undefined;
    }

    throw new SupabaseError(
      response.status,
      payload?.message ?? `Requête Supabase échouée avec le statut ${response.status}.`,
      payload?.code,
      payload?.details,
      payload?.hint
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};
