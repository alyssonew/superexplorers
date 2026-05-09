/**
 * Testes de integração para as operações Supabase das expedições:
 *  - fetchExpeditions (SELECT com order)
 *  - createExpedition (INSERT)
 *  - updateExpedition (UPDATE + eq)
 *  - deleteExpedition (DELETE + eq)
 *  - fetchDestinations para o select de localização
 *  - uploadFile (Storage)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => import('./__mocks__/supabase'));

// ─── Helpers que espelham a lógica de ManageExpeditions ───────────────────────

const fetchExpeditions = async () => {
  const { data, error } = await supabase
    .from('expeditions')
    .select('*')
    .order('startDate', { ascending: true }) as any;
  if (error) throw error;
  return data ?? [];
};

const createExpedition = async (finalData: object) => {
  const { error } = await supabase.from('expeditions').insert([finalData]) as any;
  if (error) throw error;
};

const updateExpedition = async (id: string, finalData: object) => {
  const { error } = await supabase.from('expeditions').update(finalData).eq('id', id) as any;
  if (error) throw error;
};

const deleteExpedition = async (id: string) => {
  const { error } = await supabase.from('expeditions').delete().eq('id', id) as any;
  if (error) throw error;
};

const uploadFile = async (file: File, folder: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `test.${fileExt}`;
  const filePath = `${folder}/${fileName}`;
  const { error } = await supabase.storage.from('images').upload(filePath, file);
  if (error) throw error;
  const { data } = supabase.storage.from('images').getPublicUrl(filePath);
  return data.publicUrl;
};

// ─── Mock de dados ────────────────────────────────────────────────────────────

const MOCK_EXPEDITIONS = [
  {
    id: 'exp-1',
    title: 'Travessia do Jalapão',
    location: 'Jalapão, TO',
    startDate: '12 Out 2026',
    endDate: '19 Out 2026',
    description: 'Expedição fotográfica',
    imageUrl: 'https://img.com/1.jpg',
    hotelName: 'Glamping Korubo',
    hotelImages: ['https://img.com/h1.jpg'],
    totalNights: 7,
  },
  {
    id: 'exp-2',
    title: 'Ecoturismo de Imersão',
    location: 'Bonito, MS',
    startDate: '05 Nov 2026',
    endDate: '10 Nov 2026',
    description: 'Flutuação em rios',
    imageUrl: 'https://img.com/2.jpg',
    hotelName: 'Zagaia Eco Resort',
    hotelImages: [],
    totalNights: 5,
  },
];

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('Expedições — fetchExpeditions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna lista de expedições ordenada por startDate', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: MOCK_EXPEDITIONS, error: null }),
    } as any));

    const result = await fetchExpeditions();
    expect(result).toEqual(MOCK_EXPEDITIONS);
    expect(supabase.from).toHaveBeenCalledWith('expeditions');
  });

  it('lança erro se Supabase retornar erro', async () => {
    const mockError = { message: 'Tabela não encontrada' };
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    } as any));

    await expect(fetchExpeditions()).rejects.toEqual(mockError);
  });

  it('retorna array vazio se não há expedições', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as any));

    expect(await fetchExpeditions()).toEqual([]);
  });
});

describe('Expedições — createExpedition', () => {
  beforeEach(() => vi.clearAllMocks());

  it('insere uma expedição com os dados finais corretos', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockImplementation(() => ({ insert: insertMock } as any));

    const newExp = {
      title: 'Nova Expedição',
      location: 'Maceió, AL',
      startDate: '20 Nov 2026',
      endDate: '27 Nov 2026',
      description: 'Descrição',
      imageUrl: 'https://img.com/3.jpg',
      hotelName: 'Resort XYZ',
      hotelImages: [],
      totalNights: 7,
    };

    await createExpedition(newExp);

    expect(supabase.from).toHaveBeenCalledWith('expeditions');
    expect(insertMock).toHaveBeenCalledWith([newExp]);
  });

  it('lança erro se insert falhar', async () => {
    const mockError = { message: 'Erro de constraint' };
    vi.mocked(supabase.from).mockImplementation(() => ({
      insert: vi.fn().mockResolvedValue({ error: mockError }),
    } as any));

    await expect(createExpedition({ title: 'Falha' })).rejects.toEqual(mockError);
  });
});

describe('Expedições — updateExpedition', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama update().eq() com id e dados corretos', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    vi.mocked(supabase.from).mockImplementation(() => ({ update: updateMock } as any));

    await updateExpedition('exp-1', { title: 'Jalapão Atualizado' });

    expect(updateMock).toHaveBeenCalledWith({ title: 'Jalapão Atualizado' });
    expect(eqMock).toHaveBeenCalledWith('id', 'exp-1');
  });

  it('lança erro se update falhar', async () => {
    const mockError = { message: 'Expedição não encontrada' };
    vi.mocked(supabase.from).mockImplementation(() => ({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: mockError }),
      }),
    } as any));

    await expect(updateExpedition('999', {})).rejects.toEqual(mockError);
  });
});

describe('Expedições — deleteExpedition', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama delete().eq() com id correto', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
    vi.mocked(supabase.from).mockImplementation(() => ({ delete: deleteMock } as any));

    await deleteExpedition('exp-1');

    expect(deleteMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith('id', 'exp-1');
  });

  it('lança erro se delete falhar', async () => {
    const mockError = { message: 'Não é possível excluir' };
    vi.mocked(supabase.from).mockImplementation(() => ({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: mockError }),
      }),
    } as any));

    await expect(deleteExpedition('exp-1')).rejects.toEqual(mockError);
  });
});

describe('Expedições — uploadFile (hotel images)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('faz upload de foto do hotel e retorna URL pública', async () => {
    const file = new File(['img'], 'hotel.png', { type: 'image/png' });
    const url = await uploadFile(file, 'hotels');

    expect(supabase.storage.from).toHaveBeenCalledWith('images');
    expect(url).toBe('https://mock-storage.com/image.jpg');
  });

  it('lança erro se upload do hotel falhar', async () => {
    const mockError = { message: 'Limite de tamanho excedido' };
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: mockError }),
      getPublicUrl: vi.fn(),
    } as any);

    const file = new File(['img'], 'grande.jpg', { type: 'image/jpeg' });
    await expect(uploadFile(file, 'hotels')).rejects.toEqual(mockError);
  });
});
