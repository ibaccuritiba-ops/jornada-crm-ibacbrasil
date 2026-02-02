# 📋 Padrões de Codificação - Frontend

## Estrutura de Componentes

### Padrão 1: Componente Simples (Apresentação)
```tsx
import React from 'react';
import { MyType } from '../../types';

interface MyComponentProps {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, children, onClick }) => {
  return (
    <div onClick={onClick}>
      <h1>{title}</h1>
      {children}
    </div>
  );
};

export default MyComponent;
```

### Padrão 2: Componente com Lógica (Container)
```tsx
import React, { useState, useEffect } from 'react';
import { useCRM } from '../../store';
import { Deal } from '../../types';

interface MyContainerProps {
  dealId: string;
}

const MyContainer: React.FC<MyContainerProps> = ({ dealId }) => {
  const { deals } = useCRM();
  const [data, setData] = useState<Deal | null>(null);

  useEffect(() => {
    const deal = deals.find(d => d.id === dealId);
    setData(deal || null);
  }, [deals, dealId]);

  if (!data) return <div>Carregando...</div>;

  return (
    <div>
      <h1>{data.id}</h1>
    </div>
  );
};

export default MyContainer;
```

## Organização de Arquivos

### Componentes de Features
```
components/
└── features/
    └── [feature-name]/
        ├── [Main].tsx           # Componente principal (pode ser container)
        ├── [Component].tsx      # Componentes auxiliares
        ├── hooks.ts             # Hooks específicos da feature (se houver)
        ├── types.ts             # Tipos específicos (se houver muitos)
        └── utils.ts             # Utilitários específicos (se houver)
```

### Componentes Shared
```
components/
└── shared/
    ├── [Component].tsx          # Um componente por arquivo
    └── [Layout].tsx
```

## Padrões de Imports

### ✅ Regra: Imports devem seguir o padrão de profundidade

```tsx
// Em: components/features/pipeline/Kanban.tsx
import { useCRM } from '../../store';           // 2 níveis: features/pipeline/
import { Deal } from '../../types';
import Logo from '../shared/Logo';

// Em: components/shared/Layout.tsx
import { useCRM } from '../../../store';        // 3 níveis: components/shared/
import { User } from '../../../types';

// Em: utils/helpers.ts
import { API_URL } from './env';                // Relative a utils/
import { formatCurrency } from './formatters';
```

## Padrões de Nomenclatura

### Componentes
- **PascalCase**: `UserCard.tsx`, `DealModal.tsx`
- **Nomes descritivos**: `DeleteConfirmModal.tsx` (não `Modal.tsx`)

### Funções e Constantes
- **camelCase**: `formatCurrency`, `calculateDiscount`, `isValidEmail`

### Tipos e Interfaces
- **PascalCase**: `interface UserProps`, `type DealStatus`

### Variáveis
- **camelCase**: `const userData = ...`, `let isLoading = false`

## Padrões React

### 1. **Sempre tipdar Props**
```tsx
interface MyComponentProps {
  title: string;
  count?: number;  // opcional
  onSubmit: (data: string) => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, count = 0, onSubmit }) => {
  // ...
};
```

### 2. **Usar `useMemo` para computações pesadas**
```tsx
const expensiveData = useMemo(() => {
  return deals.filter(d => d.status === 'OPEN').map(d => ({
    ...d,
    total: d.amount * 1.1
  }));
}, [deals]);
```

### 3. **Usar `useCallback` para event handlers**
```tsx
const handleClick = useCallback((id: string) => {
  updateDeal(id, { status: 'CLOSED' });
}, []);

// Em JSX
<button onClick={() => handleClick(dealId)}>Fechar</button>
```

### 4. **Separar lógica em hooks**
```tsx
// hooks/useDealLogic.ts
export const useDealLogic = (dealId: string) => {
  const { deals, updateDeal } = useCRM();
  const deal = deals.find(d => d.id === dealId);
  
  const close = useCallback(() => {
    if (deal) updateDeal(deal.id, { status: 'CLOSED' });
  }, [deal, updateDeal]);

  return { deal, close };
};

// Em componente
const MyComponent = ({ dealId }) => {
  const { deal, close } = useDealLogic(dealId);
  return <button onClick={close}>Fechar</button>;
};
```

## Padrões de Estado

### ✅ Usar Context do Zustand/Redux (Global)
```tsx
// Para dados que afetam toda a app
const { deals, updateDeal } = useCRM();
```

### ✅ Usar useState (Local)
```tsx
// Para UI state temporário
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({ name: '' });
```

### ❌ Evitar
```tsx
// Não duplicar estado que vem do store
const { deals } = useCRM();
const [localDeals, setLocalDeals] = useState(deals); // ❌ Problema: duplica dados

// Melhor:
const { deals } = useCRM();
// Usar diretamente
```

## Padrões de Estilos

### Usar Tailwind CSS
```tsx
<div className="flex gap-4 p-6 rounded-lg bg-white shadow-md">
  <button className="btn-liquid-glass bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">
    Ação
  </button>
</div>
```

## Validação de Dados

### Sempre validar inputs do usuário
```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!formData.name.trim()) {
    alert('Nome é obrigatório');
    return;
  }
  
  // Prosseguir com submissão
  submitData(formData);
};
```

## Tratamento de Erros

### Sempre ter fallback
```tsx
const UserCard: React.FC<{ userId: string }> = ({ userId }) => {
  const { users } = useCRM();
  const user = users.find(u => u.id === userId);

  if (!user) {
    return <div className="text-red-500">Usuário não encontrado</div>;
  }

  return <div>{user.name}</div>;
};
```

## Padrão de Async/Await

### Com feedback visual
```tsx
const handleSave = async () => {
  setLoading(true);
  try {
    const result = await updateDeal(dealId, data);
    showSuccessMessage('Salvo com sucesso!');
  } catch (error) {
    showErrorMessage('Erro ao salvar');
  } finally {
    setLoading(false);
  }
};
```

---

**Última atualização**: Fevereiro 2026
