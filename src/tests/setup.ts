import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Stub window.confirm (usado em modais de confirmação de exclusão)
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(() => true),
});

// Stub window.alert
Object.defineProperty(window, 'alert', {
  writable: true,
  value: vi.fn(),
});

// Stub IntersectionObserver (usado por motion/react whileInView)
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverStub,
});

// Stub URL.createObjectURL (usado em previews de upload de imagem)
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'blob:mock-url'),
});
