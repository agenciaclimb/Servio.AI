# 📅 Semana 1 - Plano de Ação Prático

**Data:** 25/11/2025 - 01/12/2025  
**Objetivo:** +8.76% coverage (26.24% → 35%)  
**Componentes:** ProfilePage.tsx, AIJobRequestWizard.tsx  
**Esforço:** 14 horas

---

## 🎯 Alvo Semana 1

| Componente             | Atual  | Target | Testes Necessários |
| ---------------------- | ------ | ------ | ------------------ |
| ProfilePage.tsx        | 0%     | 85%    | ~15-20 testes      |
| AIJobRequestWizard.tsx | 25.71% | 80%    | ~10-15 testes      |
| **Total**              | 12%    | 82%    | **25-35 testes**   |

---

## 📊 ProfilePage.tsx - Análise

### Estrutura Principal

```
✅ User profile display
✅ Reviews rendering
✅ Completed jobs list
✅ Star rating display
✅ SEO content generation (Gemini)
✅ Public vs private view
✅ Location map
✅ Portfolio gallery
```

### Estados & Dados

```typescript
- user: User | null
- allJobs: Job[]
- allUsers: User[]
- isLoading: boolean
- summary: string | null
- isSummaryLoading: boolean
- summaryError: string | null
- seoContent: SEOProfileContent | null
- isSeoLoading: boolean
```

### Cenários de Teste Críticos

**1. Carregamento de Perfil (Happy Path)**

```
✅ Carrega usuário por ID
✅ Busca jobs completos
✅ Busca reviews
✅ Calcula rating médio
```

**2. Diferentes Tipos de Usuário**

```
✅ prestador (provider) - mostra reviews
✅ cliente - mostra histórico de jobs
✅ admin - mostra todas as informações
```

**3. Estados de Carregamento**

```
✅ isLoading = true (spinners visíveis)
✅ isLoading = false (dados visíveis)
✅ isSummaryLoading = true (Gemini processando)
✅ Erro no fetch (error message)
```

**4. Listas Vazias**

```
✅ Sem jobs completados
✅ Sem reviews
✅ Sem portfolio items
```

**5. Visibilidade Pública vs Privada**

```
✅ isPublicView = true (mostra CTA de contato)
✅ isPublicView = false (botão back to dashboard)
```

---

## 🧪 Testes a Implementar - ProfilePage

### Dias 1-2: Setup & Happy Path

**Teste 1: Renderiza com dados padrão**

```typescript
it('should render profile with user data', async () => {
  const { mock } = mockAPI()
  render(
    <ProfilePage
      userId="provider@example.com"
      isPublicView={false}
      onBackToDashboard={vi.fn()}
      onLoginToContact={vi.fn()}
    />
  )

  await waitFor(() => {
    expect(screen.getByText(mockUser.name)).toBeInTheDocument()
    expect(screen.getByText(/completed jobs/i)).toBeInTheDocument()
  })
})
```

**Teste 2: Calcula rating corretamente**

```typescript
it('should calculate average rating from reviews', async () => {
  const reviews = [
    { rating: 5, comment: 'Excelente' },
    { rating: 4, comment: 'Bom' },
    { rating: 3, comment: 'OK' }
  ]

  render(<ProfilePage userId="..." />)

  await waitFor(() => {
    // Deve mostrar 4 estrelas (5+4+3)/3 = 4
    const stars = screen.getAllByRole('img', { hidden: true })
    expect(stars.filter(s => s.classList.contains('text-yellow'))).toHaveLength(4)
  })
})
```

### Dias 3-4: Estados & Condicionalidades

**Teste 3: Mostra loading state**

```typescript
it('should show loading spinner while fetching', () => {
  vi.mocked(API.fetchUserById).mockImplementation(
    () => new Promise(resolve => setTimeout(() => resolve(mockUser), 500))
  )

  render(<ProfilePage userId="..." />)
  expect(screen.getByText(/loading/i)).toBeInTheDocument()
})
```

**Teste 4: Diferencia prestador vs cliente**

```typescript
it('should show reviews section only for providers', async () => {
  const provider = { ...mockUser, type: 'prestador' as const }

  render(<ProfilePage userId="..." />)

  await waitFor(() => {
    expect(screen.getByText(/average rating/i)).toBeInTheDocument()
  })
})
```

**Teste 5: Public vs Private view**

```typescript
it('should show contact CTA in public view', async () => {
  render(
    <ProfilePage
      userId="..."
      isPublicView={true}
      onLoginToContact={vi.fn()}
    />
  )

  await waitFor(() => {
    expect(screen.getByText(/contact provider/i)).toBeInTheDocument()
  })
})
```

### Dias 5: Edge Cases

**Teste 6: Sem jobs completados**

```typescript
it('should show empty state when no completed jobs', async () => {
  mockAPI().jobs.mockReturnValue([])

  render(<ProfilePage userId="..." />)

  await waitFor(() => {
    expect(screen.getByText(/no completed jobs/i)).toBeInTheDocument()
  })
})
```

**Teste 7: Sem reviews**

```typescript
it('should handle provider with no reviews', async () => {
  const reviewlessJobs = mockJobs.map(j => ({ ...j, review: null }))

  render(<ProfilePage userId="..." />)

  await waitFor(() => {
    expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument()
  })
})
```

### Dias 6: SEO & Gemini

**Teste 8: Carrega conteúdo SEO**

```typescript
it('should fetch SEO content for providers', async () => {
  const mockGemini = vi.spyOn(geminiService, 'generateSEOProfileContent')

  render(<ProfilePage userId="provider@..." />)

  await waitFor(() => {
    expect(mockGemini).toHaveBeenCalledWith(mockUser, reviews)
  })
})
```

---

## 🎯 AIJobRequestWizard.tsx - Análise

### Estrutura Principal

```
✅ Step navigation (multi-step form)
✅ Form validation
✅ AI enhancement (Gemini)
✅ Job creation API call
✅ Success/Error handling
✅ Progress indication
```

### Passos do Wizard

```
Step 1: Job Details (título, categoria, descrição)
Step 2: Service Type & Budget
Step 3: Timeline & Urgency
Step 4: Review & Submit
```

### Testes Críticos

**Dia 1: Setup & Step Navigation**

**Teste 1: Renderiza passo 1**

```typescript
it('should render step 1 by default', () => {
  render(<AIJobRequestWizard onJobCreated={vi.fn()} />)
  expect(screen.getByText(/describe your job/i)).toBeInTheDocument()
})
```

**Teste 2: Navega entre steps**

```typescript
it('should navigate forward and backward', async () => {
  render(<AIJobRequestWizard />)

  // Preenche step 1
  await userEvent.type(screen.getByLabelText(/title/i), 'Plumber needed')

  // Clica Next
  await userEvent.click(screen.getByRole('button', { name: /next/i }))

  expect(screen.getByText(/service type/i)).toBeInTheDocument()

  // Clica Back
  await userEvent.click(screen.getByRole('button', { name: /back/i }))

  expect(screen.getByText(/describe your job/i)).toBeInTheDocument()
})
```

**Dias 2-3: Form Validation**

**Teste 3: Valida campos obrigatórios**

```typescript
it('should prevent advancing without required fields', async () => {
  render(<AIJobRequestWizard />)

  const nextButton = screen.getByRole('button', { name: /next/i })
  await userEvent.click(nextButton)

  expect(screen.getByText(/title is required/i)).toBeInTheDocument()
})
```

**Teste 4: Valida orçamento**

```typescript
it('should reject invalid budget values', async () => {
  render(<AIJobRequestWizard />)

  const budgetInput = screen.getByLabelText(/budget/i)
  await userEvent.type(budgetInput, '-100')

  await userEvent.click(screen.getByRole('button', { name: /next/i }))

  expect(screen.getByText(/budget must be positive/i)).toBeInTheDocument()
})
```

**Dia 4: AI Enhancement**

**Teste 5: Ativa AI enhancement**

```typescript
it('should call Gemini to enhance description', async () => {
  const mockEnhance = vi.spyOn(geminiService, 'enhanceJobDescription')

  render(<AIJobRequestWizard />)

  await userEvent.type(
    screen.getByLabelText(/description/i),
    'I need a plumber'
  )

  await userEvent.click(screen.getByRole('button', { name: /enhance with AI/i }))

  await waitFor(() => {
    expect(mockEnhance).toHaveBeenCalledWith('I need a plumber')
  })
})
```

**Teste 6: Mostra descrição enhancement**

```typescript
it('should display enhanced description', async () => {
  mockGemini().enhanceJobDescription.mockResolvedValue(
    'Professional plumber needed for urgent pipe repair...'
  )

  render(<AIJobRequestWizard />)

  // Preenche e enhance
  await userEvent.type(screen.getByLabelText(/description/i), 'Plumber needed')
  await userEvent.click(screen.getByRole('button', { name: /enhance/i }))

  await waitFor(() => {
    expect(screen.getByText(/Professional plumber needed/)).toBeInTheDocument()
  })
})
```

**Dia 5: Submission**

**Teste 7: Submit com sucesso**

```typescript
it('should create job on final submit', async () => {
  const mockCreate = vi.spyOn(API, 'createJob')
  const mockOnCreated = vi.fn()

  render(<AIJobRequestWizard onJobCreated={mockOnCreated} />)

  // Preencher todos os steps...
  // ...

  await userEvent.click(screen.getByRole('button', { name: /create job/i }))

  await waitFor(() => {
    expect(mockCreate).toHaveBeenCalled()
    expect(mockOnCreated).toHaveBeenCalled()
  })
})
```

**Teste 8: Error handling**

```typescript
it('should show error message if creation fails', async () => {
  vi.spyOn(API, 'createJob').mockRejectedValueOnce(
    new Error('API Error')
  )

  render(<AIJobRequestWizard />)

  // Preencher e submit...

  await waitFor(() => {
    expect(screen.getByText(/error creating job/i)).toBeInTheDocument()
  })
})
```

---

## 📝 Checklist Semana 1

### ProfilePage (15-20 testes)

- [ ] Teste 1: Renderiza com dados
- [ ] Teste 2: Rating calculation
- [ ] Teste 3: Loading state
- [ ] Teste 4: User type differentiation (prestador vs cliente)
- [ ] Teste 5: Public vs Private
- [ ] Teste 6: Empty jobs list
- [ ] Teste 7: No reviews
- [ ] Teste 8: SEO generation
- [ ] Teste 9: Back button navigation
- [ ] Teste 10: Star rating render
- [ ] Teste 11: Completed jobs filter
- [ ] Teste 12: Error handling
- [ ] Teste 13: Multiple reviews
- [ ] Teste 14: Null data handling
- [ ] Teste 15: Map rendering (se location)
- [ ] Teste 16: Portfolio gallery
- [ ] Teste 17: Contact CTA in public
- [ ] Teste 18: Login prompt
- [ ] Teste 19: Different user types
- [ ] Teste 20: SEO schema tags

### AIJobRequestWizard (10-15 testes)

- [ ] Teste 1: Renderiza step 1
- [ ] Teste 2: Navigation forward/backward
- [ ] Teste 3: Validation on step 1
- [ ] Teste 4: Budget validation
- [ ] Teste 5: Category selection
- [ ] Teste 6: AI enhancement
- [ ] Teste 7: Display enhanced description
- [ ] Teste 8: Timeline selection
- [ ] Teste 9: Urgency selection
- [ ] Teste 10: Final review
- [ ] Teste 11: Job creation API call
- [ ] Teste 12: Success callback
- [ ] Teste 13: Error handling
- [ ] Teste 14: All required fields validation
- [ ] Teste 15: Budget edge cases

---

## 🔧 Setup Necessário

### Mocks Globais

```typescript
// tests/setup.ts
vi.mock('../services/api');
vi.mock('../services/geminiService');
vi.mock('firebase/auth');

// Mock user data
const mockUser = {
  email: 'provider@example.com',
  name: 'João Silva',
  type: 'prestador',
  bio: 'Professional plumber',
  location: 'São Paulo',
  status: 'ativo',
  memberSince: '2024-01-01',
  verificationStatus: 'verificado',
};

// Mock reviews
const mockReviews = [
  { rating: 5, comment: 'Excellent work' },
  { rating: 4, comment: 'Good service' },
];
```

### Fixtures

```typescript
// tests/fixtures/profileData.ts
export const mockProfileData = {
  user: mockUser,
  jobs: mockJobs,
  reviews: mockReviews,
};
```

---

## 📈 Progresso Esperado

```
Dia 1: Setup + ProfilePage Testes 1-2 (5 testes) → 28%
Dia 2: ProfilePage Testes 3-4 (5 testes) → 30%
Dia 3: ProfilePage Testes 5-6 (5 testes) → 32%
Dia 4: ProfilePage Testes 7-8 + AIWizard Setup (8 testes) → 33%
Dia 5: AIWizard Testes 1-2 (5 testes) → 34%
Dia 6: AIWizard Testes 3-8 (10 testes) → 35%
Dia 7: Review & Ajustes (2-3 testes) → 35%+

TOTAL: 25-35 testes | +8.76% coverage gain
```

---

## ✅ Como Executar

### Criar arquivo de teste

```bash
cp TEST_TEMPLATE_GUIDE.md tests/ProfilePage.test.tsx
# Adaptar template para ProfilePage
```

### Rodar testes

```bash
npm run test -- ProfilePage.test.tsx --coverage
```

### Acompanhar coverage

```bash
npm run test -- --coverage
# Abrir coverage/index.html
```

### Commit por dia

```bash
git add tests/ProfilePage.test.tsx
git commit -m "test(ProfilePage): add tests 1-2 (5 scenarios)"
git push origin main
```

---

**Começar Agora! 🚀**  
Próximo passo: `npm run test -- --coverage` para baseline  
Depois: Criar `tests/ProfilePage.test.tsx`
