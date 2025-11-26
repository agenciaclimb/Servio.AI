# 🧪 Template Padrão de Teste - 80% Coverage

Documento com estrutura padrão para criar testes que alcancem 85%+ de coverage.

## Estrutura Recomendada

```typescript
// 1. IMPORTS
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// 2. MOCKS GLOBAIS
vi.mock('firebase/auth', () => ({...}))
vi.mock('./services/api', () => ({...}))

// 3. HELPER FUNCTIONS
function renderWithAuth(component) { ... }
function renderWithRouter(component) { ... }

// 4. TEST SUITES
describe('ComponentName', () => {
  // Happy Path
  // Error Handling
  // Edge Cases
  // User Interactions
  // Async Operations
  // Conditional Rendering
  // State Changes
  // Accessibility
})
```

## 9 Categorias de Testes Essenciais

### 1. Happy Path (Cenário Ideal)

```typescript
it('should render component with default props', () => {
  render(<MyComponent />)
  expect(screen.getByText(/expected text/i)).toBeInTheDocument()
})
```

### 2. Error Handling

```typescript
it('should display error when API fails', async () => {
  mockAPI.mockRejectedValueOnce(new Error('API Error'))
  render(<MyComponent />)
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument()
  })
})
```

### 3. Edge Cases

```typescript
it('should handle empty input', () => {
  render(<MyComponent data={[]} />)
  expect(screen.getByText(/no data/i)).toBeInTheDocument()
})
```

### 4. User Interactions

```typescript
it('should update on user input', async () => {
  render(<MyComponent />)
  const input = screen.getByRole('textbox')
  await userEvent.type(input, 'text')
  expect(input).toHaveValue('text')
})
```

### 5. Async Operations

```typescript
it('should show loading then data', async () => {
  render(<MyComponent />)
  expect(screen.getByText(/loading/i)).toBeInTheDocument()
  await waitFor(() => {
    expect(screen.getByText(/data/i)).toBeInTheDocument()
  })
})
```

### 6. Conditional Rendering

```typescript
it('should render admin controls only for admins', () => {
  render(<MyComponent user={adminUser} />)
  expect(screen.getByText(/admin/i)).toBeInTheDocument()
})
```

### 7. State Changes

```typescript
it('should update state on action', async () => {
  render(<MyComponent />)
  expect(screen.getByText(/count: 0/)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button'))
  expect(screen.getByText(/count: 1/)).toBeInTheDocument()
})
```

### 8. Accessibility

```typescript
it('should be keyboard navigable', async () => {
  render(<MyComponent />)
  const button = screen.getByRole('button')
  button.focus()
  expect(document.activeElement).toBe(button)
})
```

### 9. Data Variations

```typescript
it('should handle different data states', () => {
  // Test with null
  render(<MyComponent data={null} />)
  // Test with undefined
  render(<MyComponent data={undefined} />)
  // Test with empty array
  render(<MyComponent data={[]} />)
  // Test with populated data
  render(<MyComponent data={[...mockData]} />)
})
```

## Mocks Reutilizáveis

### Mock Firebase

```typescript
vi.mock('firebase/auth', () => ({
  getAuth: () => ({
    currentUser: { uid: 'test-uid', email: 'test@example.com' },
  }),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback({ uid: 'test-uid' });
    return vi.fn();
  }),
}));
```

### Mock API

```typescript
vi.mock('./services/api', () => ({
  callBackendAPI: vi.fn(async endpoint => {
    if (endpoint.includes('/users/')) return { data: mockUser };
    if (endpoint.includes('/jobs')) return { data: [] };
    return { success: true };
  }),
}));
```

### Mock Gemini AI

```typescript
vi.mock('./services/geminiService', () => ({
  enhanceJobDescription: vi.fn(() => 'Enhanced text'),
  generateProviderBio: vi.fn(() => 'Generated bio'),
}));
```

## Checklist para 85%+ Coverage

- ✅ Todos os `if/else` branches
- ✅ Todos os `ternary` operators
- ✅ Todos os `switch` cases
- ✅ Todos os event handlers (onClick, onChange, etc)
- ✅ Estados iniciais vs atualizados
- ✅ Dados presentes vs ausentes (null/undefined/empty array)
- ✅ Sucesso vs falha de API
- ✅ Diferentes tipos de usuário (admin vs regular)
- ✅ Modal abrir/fechar
- ✅ Paginação (primeira página, última página, etc)
- ✅ Validações (válido vs inválido)
- ✅ Loading states
- ✅ Error messages
- ✅ Keyboard navigation
- ✅ Form submission
- ✅ Async operations (loading → success → error)

## Dicas Importantes

### 1. Use `screen` em vez de destructuring

```typescript
// ✅ BOAS
const { getByRole } = render(<App />)
await screen.findByText('...')

// ❌ RUINS
const input = wrapper.find('input')
```

### 2. Teste comportamento, não implementação

```typescript
// ✅ BOM - testa comportamento
expect(mockFn).toHaveBeenCalledWith('expected');

// ❌ RUIM - testa implementação
expect(component.instance().state.isOpen).toBe(true);
```

### 3. Use `waitFor` para async

```typescript
// ✅ BOM
await waitFor(() => expect(...).toBe(...))

// ❌ RUIM
setTimeout(() => expect(...).toBe(...), 100)
```

### 4. Mock dependencies externas

```typescript
// ✅ BOM
vi.mock('./firebaseConfig');

// ❌ RUIM
// Importar e usar Firebase real no teste
```

### 5. Use dados realistas

```typescript
// ✅ BOM
const mockUser = { email: 'test@example.com', type: 'cliente' };

// ❌ RUIM
const mockUser = {}; // objeto vazio não representa realidade
```

## Verificar Coverage Interativo

```bash
# Gerar coverage report
npm run test -- --coverage

# Abrir relatório HTML
npm run test -- --coverage && open coverage/index.html

# Verificar específico arquivo
npm run test -- --coverage src/components/ProfilePage

# Watch mode com coverage
npm run test -- --coverage --watch
```

O relatório HTML mostra **quais linhas não estão cobertas** - use para saber exatamente o que testar!

## Performance de Testes

- Usar `singleThread: true` no vitest.config (mais lento mas mais confiável)
- Mockar tudo (Firebase, API, timers)
- Usar `beforeEach`/`afterEach` para cleanup
- Não fazer operações reais de network/database
- Usar `vi.useFakeTimers()` para delays

## Próximos Passos

1. Escolher um componente crítico (ProfilePage, ClientDashboard, etc)
2. Usar este template como base
3. Executar `npm run test -- --coverage` para ver linhas não cobertas
4. Adicionar testes até atingir 85%
5. Repetir com próximo componente

**Meta: +53.76% coverage em 6 semanas = 80% total! 🎯**
