# 📁 Estrutura do Frontend Refatorada

## Nova Organização

```
frontend/
├── src/                          # Código-fonte principal
│   ├── index.tsx                 # Ponto de entrada
│   ├── App.tsx                   # Componente raiz
│   ├── store.tsx                 # Context/State Management (Redux/Zustand)
│   ├── types.ts                  # Tipos TypeScript globais
│   ├── env.js                    # Variáveis de ambiente
│   ├── index.html                # HTML principal
│   ├── metadata.json             # Metadados da app
│   │
│   ├── components/               # Componentes React
│   │   ├── features/             # Componentes de features específicas
│   │   │   ├── pipeline/         # Feature: Pipeline/Funil de vendas
│   │   │   │   ├── Kanban.tsx    # Componente Kanban principal
│   │   │   │   └── PipelineSettings.tsx  # Configurações do funil
│   │   │   │
│   │   │   ├── leads/            # Feature: Gerenciamento de Leads
│   │   │   │   └── ImportLeads.tsx       # Importação de leads
│   │   │   │
│   │   │   ├── admin/            # Feature: Administração/Config
│   │   │   │   ├── Companies.tsx         # Gestão de empresas
│   │   │   │   ├── UsersPermissions.tsx  # Usuários e permissões
│   │   │   │   └── Branding.tsx         # Identidade visual
│   │   │   │
│   │   │   ├── settings/         # Feature: Configurações Gerais
│   │   │   │   └── Settings.tsx  # Telas de configuração
│   │   │   │
│   │   │   ├── Tasks.tsx         # Feature: Tarefas/Agenda
│   │   │   ├── Products.tsx      # Feature: Produtos
│   │   │   └── Reports.tsx       # Feature: Relatórios
│   │   │
│   │   └── shared/               # Componentes reutilizáveis/layout
│   │       ├── Layout.tsx        # Layout principal (sidebar, header)
│   │       ├── Logo.tsx          # Componente Logo
│   │       └── Notifications.tsx # Sistema de notificações
│   │
│   ├── utils/                    # Utilitários e funções auxiliares
│   │   ├── api.ts                # Funções de requisição HTTP
│   │   ├── formatters.ts         # Formatadores de dados
│   │   ├── validators.ts         # Validadores de input
│   │   └── helpers.ts            # Funções auxiliares
│   │
│   ├── hooks/                    # Custom React Hooks
│   │   ├── useAuth.ts            # Hook de autenticação
│   │   ├── useFetch.ts           # Hook para requisições
│   │   └── useLocalStorage.ts    # Hook para localStorage
│   │
│   └── constants/                # Constantes da aplicação
│       ├── colors.ts             # Palheta de cores
│       ├── messages.ts           # Mensagens da aplicação
│       └── config.ts             # Configurações gerais
│
├── vite.config.ts               # Configuração do Vite
├── tsconfig.json                # Configuração do TypeScript
├── package.json                 # Dependências do projeto
└── README.md                    # Documentação geral
```

## 🎯 Benefícios da Nova Estrutura

### ✅ **Melhor Organização**
- Componentes agrupados por feature (pipeline, leads, admin, etc.)
- Componentes reutilizáveis separados em `shared/`
- Código lógico em `utils/`, `hooks/` e `constants/`

### ✅ **Sem Duplicação**
- ~~Removidas~~ todas as cópias duplicadas da raiz
- Uma única fonte de verdade para cada componente
- Imports consistentes e claros

### ✅ **Escalabilidade**
- Fácil adicionar novas features em `components/features/`
- Hooks customizados centralizados em `hooks/`
- Utilitários reutilizáveis em `utils/`

### ✅ **Manutenção Simplificada**
- Estrutura intuitiva e previsível
- Desenvolvedor novo acha facilmente onde adicionar código
- Menos procura por arquivos duplicados

## 📋 Guia de Imports

### ✅ **Correto**
```tsx
// De um componente em features/pipeline/
import { useCRM } from '../../store';
import { Deal, DealStatus } from '../../types';
import Layout from '../shared/Layout';

// De um componente em shared/
import { useCRM } from '../../../store';
import { User } from '../../../types';

// De utils/
import { formatCurrency } from '../utils/formatters';
```

### ❌ **Errado (evitar)**
```tsx
// Não usar caminhos relativos inconsistentes
import { useCRM } from '../../../../store';

// Não importar de componentes fora do shared
import Kanban from '../features/pipeline/Kanban';
```

## 🚀 Como Adicionar uma Nova Feature

1. **Criar pasta em `components/features/[nome-feature]/`**
   ```bash
   mkdir src/components/features/my-feature
   ```

2. **Criar componentes dentro da pasta**
   ```tsx
   // src/components/features/my-feature/MyComponent.tsx
   import { useCRM } from '../../store';
   import { MyType } from '../../types';
   ```

3. **Exportar do `App.tsx`**
   ```tsx
   import MyComponent from './components/features/my-feature/MyComponent';
   ```

## 🔧 Atualizar Imports Após Refatoração

Se você mover arquivos, lembre-se de atualizar os imports:
- Dentro de `src/components/features/[X]/`: use `../../store` (2 níveis)
- Dentro de `src/components/shared/`: use `../../../store` (3 níveis)
- Dentro de `src/utils/hooks/`: use `../store` (1 nível)

## 📦 Próximas Refatorações Sugeridas

- [ ] Extrair lógica comum de componentes para hooks em `hooks/`
- [ ] Criar utilitários de formatação em `utils/formatters.ts`
- [ ] Definir constantes de API em `constants/config.ts`
- [ ] Implementar testes unitários para utils e hooks
- [ ] Adicionar documentação JSDoc para componentes complexos

---

**Última atualização**: Fevereiro 2026  
**Refatoração**: Organização e remoção de duplicatas
