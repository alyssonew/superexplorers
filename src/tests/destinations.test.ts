/**
 * Testes de integração para as operações Supabase dos destinos:
 *  - fetchDestinations (SELECT)
 *  - handleSave: criar destino (INSERT)
 *  - handleSave: editar destino (UPDATE)
 *  - handleDelete (DELETE)
 *  - fetchCategories (SELECT)
 *  - handleAddCategory (INSERT)
 *  - handleDeleteCategory (DELETE)
 *  - uploadImageToSupabase (Storage upload + getPublicUrl)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => import('./__mocks__/supabase'));

// ─── Helpers que espelham a lógica da página ──────────────────────────────────

const fetchDestinations = async () => {
  const { data, error } = await supabase.from('destinations').select('*').order('name', { ascending: true }) as any;
  if (error) throw error;
  return data ?? [];
};

const createDestination = async (formData: object) => {
  const { error } = await supabase.from('destinations').insert([formData]) as any;
  if (error) throw error;
};

const updateDestination = async (id: string, formData: object) => {
  const { error } = await supabase.from('destinations').update(formData).eq('id', id) as any;
  if (error) throw error;
};

const deleteDestination = async (id: string) => {
  const { error } = await supabase.from('destinations').delete().eq('id', id) as any;
  if (error) throw error;
};

const fetchCategories = async () => {
  const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true }) as any;
  if (error) throw error;
  return data ?? [];
};

const addCategory = async (name: string) => {
  const { error } = await supabase.from('categories').insert([{ name }]) as any;
  if (error) throw error;
};

const deleteCategory = async (id: string) => {
  const { error } = await supabase.from('categories').delete().eq('id', id) as any;
  if (error) throw error;
};

const uploadImageToSupabase = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `test.${fileExt}`;
  const filePath = `destinations/${fileName}`;

  const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('images').getPublicUrl(filePath);
  return data.publicUrl;
};

// ─── Mock de dados ────────────────────────────────────────────────────────────

const MOCK_DESTINATIONS = [
  { id: '1', name: 'Bonito, MS', description: 'Rio cristalino', category: 'Ecoturismo', imageUrl: 'https://img.com/1.jpg', featured: true },
  { id: '2', name: 'Jalapão, TO', description: 'Dunas douradas', category: 'Aventura', imageUrl: 'https://img.com/2.jpg', featured: false },
];

const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'Aventura & Natureza' },
  { id: 'cat-2', name: 'Ecoturismo Premium' },
];

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('Destinos — fetchDestinations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna lista de destinos com sucesso', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: MOCK_DESTINATIONS, error: null }),
    } as any));

    const result = await fetchDestinations();
    expect(result).toEqual(MOCK_DESTINATIONS);
    expect(supabase.from).toHaveBeenCalledWith('destinations');
  });

  it('lança erro se Supabase retornar erro', async () => {
    const mockError = { message: 'Permissão negada', code: '42501' };
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    } as any));

    await expect(fetchDestinations()).rejects.toEqual(mockError);
  });

  it('retorna array vazio quando data é null', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as any));

    const result = await fetchDestinations();
    expect(result).toEqual([]);
  });
});

describe('Destinos — createDestination', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama supabase.from("destinations").insert com os dados corretos', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockImplementation(() => ({
      insert: insertMock,
    } as any));

    const formData = { name: 'Maceió, AL', description: 'Praias paradisíacas', category: 'Paraíso Tropical', imageUrl: 'https://img.com/3.jpg', featured: false };
    await createDestination(formData);

    expect(supabase.from).toHaveBeenCalledWith('destinations');
    expect(insertMock).toHaveBeenCalledWith([formData]);
  });

  it('lança erro se insert falhar', async () => {
    const mockError = { message: 'Violação de chave única' };
    vi.mocked(supabase.from).mockImplementation(() => ({
      insert: vi.fn().mockResolvedValue({ error: mockError }),
    } as any));

    await expect(createDestination({ name: 'Duplicado' })).rejects.toEqual(mockError);
  });
});

describe('Destinos — updateDestination', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama update().eq() com id correto', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    vi.mocked(supabase.from).mockImplementation(() => ({ update: updateMock } as any));

    await updateDestination('1', { name: 'Bonito Atualizado' });

    expect(updateMock).toHaveBeenCalledWith({ name: 'Bonito Atualizado' });
    expect(eqMock).toHaveBeenCalledWith('id', '1');
  });

  it('lança erro se update falhar', async () => {
    const mockError = { message: 'Registro não encontrado' };
    const eqMock = vi.fn().mockResolvedValue({ error: mockError });
    vi.mocked(supabase.from).mockImplementation(() => ({
      update: vi.fn().mockReturnValue({ eq: eqMock }),
    } as any));

    await expect(updateDestination('999', {})).rejects.toEqual(mockError);
  });
});

describe('Destinos — deleteDestination', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama delete().eq() com o id correto', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
    vi.mocked(supabase.from).mockImplementation(() => ({ delete: deleteMock } as any));

    await deleteDestination('1');

    expect(deleteMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith('id', '1');
  });

  it('lança erro se delete falhar', async () => {
    const mockError = { message: 'Erro ao excluir' };
    vi.mocked(supabase.from).mockImplementation(() => ({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: mockError }),
      }),
    } as any));

    await expect(deleteDestination('1')).rejects.toEqual(mockError);
  });
});

describe('Categorias — fetchCategories', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna lista de categorias', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: MOCK_CATEGORIES, error: null }),
    } as any));

    const result = await fetchCategories();
    expect(result).toEqual(MOCK_CATEGORIES);
    expect(supabase.from).toHaveBeenCalledWith('categories');
  });

  it('retorna array vazio se não há categorias', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as any));

    expect(await fetchCategories()).toEqual([]);
  });
});

describe('Categorias — addCategory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('insere nova categoria com o nome correto', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockImplementation(() => ({ insert: insertMock } as any));

    await addCategory('Nova Categoria');

    expect(insertMock).toHaveBeenCalledWith([{ name: 'Nova Categoria' }]);
  });

  it('lança erro se inserção de categoria falhar', async () => {
    const mockError = { message: 'Categoria já existe' };
    vi.mocked(supabase.from).mockImplementation(() => ({
      insert: vi.fn().mockResolvedValue({ error: mockError }),
    } as any));

    await expect(addCategory('Duplicada')).rejects.toEqual(mockError);
  });
});

describe('Categorias — deleteCategory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exclui categoria pelo id', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
    vi.mocked(supabase.from).mockImplementation(() => ({ delete: deleteMock } as any));

    await deleteCategory('cat-1');
    expect(eqMock).toHaveBeenCalledWith('id', 'cat-1');
  });
});

describe('Storage — uploadImageToSupabase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('faz upload e retorna URL pública', async () => {
    const mockFile = new File(['conteudo'], 'foto.jpg', { type: 'image/jpeg' });

    const result = await uploadImageToSupabase(mockFile);

    expect(supabase.storage.from).toHaveBeenCalledWith('images');
    expect(result).toBe('https://mock-storage.com/image.jpg');
  });

  it('lança erro se o upload falhar', async () => {
    const mockError = { message: 'Bucket não encontrado' };
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: mockError }),
      getPublicUrl: vi.fn(),
    } as any);

    const mockFile = new File(['conteudo'], 'foto.jpg', { type: 'image/jpeg' });
    await expect(uploadImageToSupabase(mockFile)).rejects.toEqual(mockError);
  });
});
