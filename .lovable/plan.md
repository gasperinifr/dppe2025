

## Menu lateral de navegação

Adicionar uma sidebar global mínima usando o componente shadcn `Sidebar`, com modo ícone quando recolhida.

### Itens do menu

- **Dashboard** (`/`) — ícone `LayoutDashboard`
- **Importar CSV** — ícone `Upload`, abre o diálogo de importação já existente
- **Sair** — ícone `LogOut`, faz logout e redireciona para `/auth`

### Estrutura de arquivos

**Novo: `src/components/AppSidebar.tsx`**
- Usa `Sidebar` com `collapsible="icon"`
- Renderiza os 3 itens em `SidebarMenu` / `SidebarMenuButton`
- Usa `NavLink` do projeto para destacar a rota ativa
- Recebe callbacks `onImport` e `onLogout` via context simples ou props

**Novo: `src/components/AppLayout.tsx`**
- Envolve `SidebarProvider` + `AppSidebar` + `SidebarInset`
- Header fica dentro do `SidebarInset`, com `SidebarTrigger` à esquerda (sempre visível)
- Rotas filhas renderizam via `<Outlet />`

**Editar: `src/App.tsx`**
- Envolver `/` (e futuras rotas autenticadas) em `<Route element={<AppLayout />}>`
- Manter `/auth` fora do layout (sem sidebar na tela de login)

**Editar: `src/pages/Index.tsx`**
- Remover o `<Header>` interno (passa para o layout)
- Expor estado `importOpen` via um contexto leve OU mover o `ImportDatasetDialog` para o layout, controlado por um `useState` compartilhado via context (`SidebarActionsContext`)

**Novo: `src/contexts/SidebarActionsContext.tsx`**
- Context com `{ openImport: () => void, logout: () => void }`
- `AppLayout` provê os valores; `AppSidebar` consome para os botões; `Index` consome para abrir o mesmo diálogo a partir do botão "Importar CSV" da tela vazia

### Comportamento

- Sidebar inicia **expandida** no desktop, recolhe para **faixa de ícones** (~3rem) ao clicar no `SidebarTrigger`
- No mobile vira off-canvas automático (comportamento padrão do componente)
- Item ativo destacado com `bg-sidebar-accent` via `NavLink activeClassName`
- Tooltip mostra o nome do item quando colapsado

### Detalhes visuais

- Logo IFSC compacto no `SidebarHeader` (esconde texto quando colapsado)
- Toggle de tema move-se para o `SidebarFooter`
- `SidebarTrigger` posicionado no topo do `SidebarInset`, antes do conteúdo principal

