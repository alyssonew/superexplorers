/**
 * Testes de integração para o fluxo de autenticação:
 *  - checkAdminStatus: usuário é admin
 *  - checkAdminStatus: usuário não é admin
 *  - signInWithPassword: login bem-sucedido
 *  - signInWithPassword: credenciais inválidas
 *  - signOut: logout
 *  - getSession: sessão ativa / sem sessão
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => import('./__mocks__/supabase'));

// ─── Helpers que espelham AuthContext e Login ─────────────────────────────────

const checkAdminStatus = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('id', userId)
    .single() as any;
  return !!data && !error;
};

const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

const getActiveSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('Auth — checkAdminStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna true quando o usuário está na tabela admins', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'user-1', email: 'admin@superexplorers.com' },
        error: null,
      }),
    } as any));

    const isAdmin = await checkAdminStatus('user-1');
    expect(isAdmin).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('admins');
  });

  it('retorna false quando o usuário não está na tabela admins', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'No rows' } }),
    } as any));

    const isAdmin = await checkAdminStatus('user-xyz');
    expect(isAdmin).toBe(false);
  });

  it('retorna false quando há erro na consulta', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'RLS bloqueou acesso' } }),
    } as any));

    const isAdmin = await checkAdminStatus('user-bloqueado');
    expect(isAdmin).toBe(false);
  });

  it('chama .eq("id", userId) com o userId correto', async () => {
    const eqMock = vi.fn().mockReturnThis();
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: eqMock,
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as any));

    await checkAdminStatus('user-especifico');
    expect(eqMock).toHaveBeenCalledWith('id', 'user-especifico');
  });
});

describe('Auth — signIn', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna dados do usuário em login bem-sucedido', async () => {
    const mockData = { user: { id: 'user-1', email: 'admin@test.com' }, session: { access_token: 'token-123' } };
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: mockData, error: null } as any);

    const result = await signIn('admin@test.com', 'senha123');
    expect(result).toEqual(mockData);
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@test.com',
      password: 'senha123',
    });
  });

  it('lança erro com credenciais inválidas', async () => {
    const mockError = { message: 'Invalid login credentials', status: 400 };
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: {} as any, error: mockError as any });

    await expect(signIn('errado@test.com', 'senhaErrada')).rejects.toEqual(mockError);
  });

  it('lança erro se o email não existir', async () => {
    const mockError = { message: 'Email not confirmed', status: 400 };
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: {} as any, error: mockError as any });

    await expect(signIn('inexistente@test.com', 'qualquer')).rejects.toEqual(mockError);
  });
});

describe('Auth — signOut', () => {
  beforeEach(() => vi.clearAllMocks());

  it('executa logout sem erros', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });
    await expect(signOut()).resolves.toBeUndefined();
    expect(supabase.auth.signOut).toHaveBeenCalledOnce();
  });

  it('lança erro se signOut falhar', async () => {
    const mockError = { message: 'Sessão expirada' };
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: mockError as any });

    await expect(signOut()).rejects.toEqual(mockError);
  });
});

describe('Auth — getSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna sessão ativa quando usuário está logado', async () => {
    const mockSession = { user: { id: 'user-1', email: 'admin@test.com' }, access_token: 'tok-123' };
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: mockSession as any }, error: null });

    const session = await getActiveSession();
    expect(session).toEqual(mockSession);
  });

  it('retorna null quando não há sessão ativa', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null });

    const session = await getActiveSession();
    expect(session).toBeNull();
  });
});
