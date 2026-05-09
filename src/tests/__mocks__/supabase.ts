/**
 * Mock do cliente Supabase.
 *
 * Cada método retorna uma cadeia encadeável (builder pattern) que resolve
 * para { data: null, error: null } por padrão. Cada teste pode sobrescrever
 * o comportamento via vi.mocked ou mockResolvedValueOnce.
 */
import { vi } from 'vitest';

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
};

const mockBuilder = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  then: undefined as unknown,
};

// Torna o builder "thenable" (await funciona diretamente)
mockBuilder.then = (resolve: (v: unknown) => unknown) =>
  Promise.resolve({ data: null, error: null }).then(resolve);

export const supabase = {
  from: vi.fn(() => mockBuilder),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://mock-storage.com/image.jpg' } }),
    })),
  },
  channel: vi.fn(() => mockChannel),
  removeChannel: vi.fn(),
};

export { mockBuilder, mockChannel };
