/**
 * Testes das funções utilitárias de ManageExpeditions:
 *  - formatDateToPtBR: converte "2026-10-12" → "12 Out 2026"
 *  - parsePtBRToISO: converte "12 Out 2026" → "2026-10-12"
 *  - filteredExpeditions: filtra por título ou localização
 */
import { describe, it, expect } from 'vitest';

// ─── Funções extraídas diretamente de ManageExpeditions ───────────────────────

const formatDateToPtBR = (isoDate: string): string => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
};

const parsePtBRToISO = (ptDate: string): string => {
  const months: Record<string, string> = {
    'Jan':'01','Fev':'02','Mar':'03','Abr':'04','Mai':'05','Jun':'06',
    'Jul':'07','Ago':'08','Set':'09','Out':'10','Nov':'11','Dez':'12'
  };
  const parts = ptDate.split(' ');
  if (parts.length === 3 && months[parts[1]]) {
    return `${parts[2]}-${months[parts[1]]}-${parts[0].padStart(2,'0')}`;
  }
  return '';
};

// ─── Helpers de filtro ────────────────────────────────────────────────────────

interface Expedition {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  imageUrl: string;
  hotelName: string;
  hotelImages: string[];
  totalNights: number;
}

const filterExpeditions = (expeditions: Expedition[], searchTerm: string) =>
  expeditions.filter(e =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

// ─── Testes ───────────────────────────────────────────────────────────────────

const MOCK_EXPEDITIONS: Expedition[] = [
  {
    id: '1',
    title: 'Travessia do Jalapão',
    location: 'Jalapão, TO',
    startDate: '12 Out 2026',
    endDate: '19 Out 2026',
    description: 'Uma expedição fotográfica',
    imageUrl: 'https://example.com/img.jpg',
    hotelName: 'Glamping Korubo',
    hotelImages: [],
    totalNights: 7,
  },
  {
    id: '2',
    title: 'Ecoturismo de Imersão',
    location: 'Bonito, MS',
    startDate: '05 Nov 2026',
    endDate: '10 Nov 2026',
    description: 'Flutuação em rios cristalinos',
    imageUrl: 'https://example.com/img2.jpg',
    hotelName: 'Zagaia Eco Resort',
    hotelImages: [],
    totalNights: 5,
  },
];

describe('formatDateToPtBR', () => {
  it('converte data ISO padrão corretamente', () => {
    expect(formatDateToPtBR('2026-10-12')).toBe('12 Out 2026');
  });

  it('converte todos os meses corretamente', () => {
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    months.forEach((mes, i) => {
      const monthStr = String(i + 1).padStart(2, '0');
      expect(formatDateToPtBR(`2026-${monthStr}-01`)).toBe(`01 ${mes} 2026`);
    });
  });

  it('retorna string vazia para input vazio', () => {
    expect(formatDateToPtBR('')).toBe('');
  });

  it('mantém dia com dois dígitos', () => {
    expect(formatDateToPtBR('2026-11-05')).toBe('05 Nov 2026');
  });
});

describe('parsePtBRToISO', () => {
  it('converte "12 Out 2026" para "2026-10-12"', () => {
    expect(parsePtBRToISO('12 Out 2026')).toBe('2026-10-12');
  });

  it('converte "05 Nov 2026" para "2026-11-05"', () => {
    expect(parsePtBRToISO('05 Nov 2026')).toBe('2026-11-05');
  });

  it('retorna string vazia para formato inválido', () => {
    expect(parsePtBRToISO('data inválida')).toBe('');
    expect(parsePtBRToISO('')).toBe('');
    expect(parsePtBRToISO('12/10/2026')).toBe('');
  });

  it('é o inverso de formatDateToPtBR', () => {
    const iso = '2026-08-20';
    expect(parsePtBRToISO(formatDateToPtBR(iso))).toBe(iso);
  });
});

describe('filterExpeditions', () => {
  it('retorna todas as expedições com busca vazia', () => {
    expect(filterExpeditions(MOCK_EXPEDITIONS, '')).toHaveLength(2);
  });

  it('filtra por título (case-insensitive)', () => {
    const result = filterExpeditions(MOCK_EXPEDITIONS, 'jalapão');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('filtra por localização', () => {
    const result = filterExpeditions(MOCK_EXPEDITIONS, 'bonito');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('retorna lista vazia para busca sem correspondência', () => {
    expect(filterExpeditions(MOCK_EXPEDITIONS, 'xyz-nao-existe')).toHaveLength(0);
  });

  it('é case-insensitive para localização', () => {
    expect(filterExpeditions(MOCK_EXPEDITIONS, 'BONITO')).toHaveLength(1);
  });
});
