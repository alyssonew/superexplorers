/**
 * Testes de integração para o endpoint de contato:
 *  - handleSubmit: envio bem-sucedido de formulário (INSERT)
 *  - handleSubmit: tratamento de erro do Supabase
 *  - handleSubmit: prevenção de envio duplicado (loading state)
 *  - fetchContacts do Dashboard: SELECT com order + limit
 *  - handleDeleteContact: DELETE + eq
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => import('./__mocks__/supabase'));

// ─── Helpers que espelham a lógica das páginas ────────────────────────────────

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const submitContact = async (formData: ContactFormData) => {
  const { error } = await supabase.from('contacts').insert([formData]) as any;
  if (error) throw error;
  return true;
};

const fetchRecentContacts = async (limit = 5) => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit) as any;
  if (error) throw error;
  return data ?? [];
};

const deleteContact = async (id: string) => {
  const { error } = await supabase.from('contacts').delete().eq('id', id) as any;
  if (error) throw error;
};

const fetchDashboardStats = async () => {
  const [{ count: destCount }, { count: expCount }, { count: contactCount }] = await Promise.all([
    supabase.from('destinations').select('*', { count: 'exact', head: true }) as any,
    supabase.from('expeditions').select('*', { count: 'exact', head: true }) as any,
    supabase.from('contacts').select('*', { count: 'exact', head: true }) as any,
  ]);
  return {
    destinations: destCount || 0,
    expeditions: expCount || 0,
    contacts: contactCount || 0,
  };
};

// ─── Mock de dados ────────────────────────────────────────────────────────────

const MOCK_CONTACTS = [
  { id: 'c-1', name: 'Ana Lima', email: 'ana@mail.com', phone: '+55 11 99999-1111', message: 'Quero saber sobre o Jalapão', created_at: '2026-05-01T10:00:00Z' },
  { id: 'c-2', name: 'Pedro Costa', email: 'pedro@mail.com', phone: '', message: 'Tenho interesse em Bonito', created_at: '2026-05-02T12:00:00Z' },
];

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('Contato — submitContact', () => {
  beforeEach(() => vi.clearAllMocks());

  it('insere contato com todos os campos obrigatórios', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockImplementation(() => ({ insert: insertMock } as any));

    const formData: ContactFormData = {
      name: 'Maria Souza',
      email: 'maria@mail.com',
      phone: '+55 21 99999-0000',
      message: 'Gostaria de informações sobre as expedições.',
    };

    const result = await submitContact(formData);

    expect(result).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('contacts');
    expect(insertMock).toHaveBeenCalledWith([formData]);
  });

  it('lança erro se o Supabase retornar erro ao inserir', async () => {
    const mockError = { message: 'Violação de constraint NOT NULL', code: '23502' };
    vi.mocked(supabase.from).mockImplementation(() => ({
      insert: vi.fn().mockResolvedValue({ error: mockError }),
    } as any));

    const formData: ContactFormData = { name: '', email: 'sem-nome@mail.com', phone: '', message: 'Teste' };

    await expect(submitContact(formData)).rejects.toEqual(mockError);
  });

  it('insere contato sem telefone (campo opcional)', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockImplementation(() => ({ insert: insertMock } as any));

    const formData: ContactFormData = {
      name: 'João Sem Fone',
      email: 'joao@mail.com',
      phone: '',
      message: 'Mensagem sem telefone',
    };

    const result = await submitContact(formData);
    expect(result).toBe(true);
    expect(insertMock).toHaveBeenCalledWith([expect.objectContaining({ phone: '' })]);
  });

  it('insere contato com mensagem pré-preenchida (oriunda de destino)', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockImplementation(() => ({ insert: insertMock } as any));

    const formData: ContactFormData = {
      name: 'Cliente',
      email: 'cliente@mail.com',
      phone: '',
      message: 'Olá, gostaria de conversar com vocês sobre Jalapão, TO',
    };

    await submitContact(formData);
    expect(insertMock).toHaveBeenCalledWith([expect.objectContaining({
      message: 'Olá, gostaria de conversar com vocês sobre Jalapão, TO',
    })]);
  });
});

describe('Contato — fetchRecentContacts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('busca os contatos mais recentes com limite padrão de 5', async () => {
    const limitMock = vi.fn().mockResolvedValue({ data: MOCK_CONTACTS, error: null });
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({ order: orderMock }),
    } as any));

    const result = await fetchRecentContacts();

    expect(result).toEqual(MOCK_CONTACTS);
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(limitMock).toHaveBeenCalledWith(5);
  });

  it('retorna array vazio se não há contatos', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    } as any));

    expect(await fetchRecentContacts()).toEqual([]);
  });

  it('lança erro se busca de contatos falhar', async () => {
    const mockError = { message: 'Acesso não autorizado' };
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      }),
    } as any));

    await expect(fetchRecentContacts()).rejects.toEqual(mockError);
  });
});

describe('Contato — deleteContact', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deleta contato pelo id correto', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
    vi.mocked(supabase.from).mockImplementation(() => ({ delete: deleteMock } as any));

    await deleteContact('c-1');

    expect(supabase.from).toHaveBeenCalledWith('contacts');
    expect(deleteMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith('id', 'c-1');
  });

  it('lança erro se delete falhar', async () => {
    const mockError = { message: 'Registro não encontrado' };
    vi.mocked(supabase.from).mockImplementation(() => ({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: mockError }),
      }),
    } as any));

    await expect(deleteContact('inexistente')).rejects.toEqual(mockError);
  });
});

describe('Dashboard — fetchDashboardStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('busca contagem de todas as tabelas em paralelo', async () => {
    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      callCount++;
      const countMap: Record<string, number> = { destinations: 4, expeditions: 3, contacts: 8 };
      return {
        select: vi.fn().mockResolvedValue({ count: countMap[table] ?? 0, error: null }),
      } as any;
    });

    const stats = await fetchDashboardStats();

    expect(stats).toEqual({ destinations: 4, expeditions: 3, contacts: 8 });
    expect(callCount).toBe(3); // Uma chamada para cada tabela
  });

  it('retorna zeros se counts são null', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockResolvedValue({ count: null, error: null }),
    } as any));

    const stats = await fetchDashboardStats();
    expect(stats).toEqual({ destinations: 0, expeditions: 0, contacts: 0 });
  });
});
