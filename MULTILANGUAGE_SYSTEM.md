# Sistema de Múltiplos Idiomas (i18n)

## 📖 Visão Geral

O aplicativo Looton agora suporta três idiomas:
- 🇧🇷 **Português** (padrão)
- 🇺🇸 **English** (Inglês)
- 🇪🇸 **Español** (Espanhol)

## 🏗️ Arquitetura

### Contexto de Idioma (`LanguageContext.tsx`)

O sistema de internacionalização é baseado em um contexto React que:

1. **Gerencia o estado do idioma atual**
2. **Persiste a preferência no AsyncStorage**
3. **Fornece função de tradução `t(key)`**

```typescript
import { useLanguage } from '../src/contexts/LanguageContext';

function MyComponent() {
  const { language, setLanguage, t } = useLanguage();
  
  return (
    <Text>{t('home.title')}</Text>
  );
}
```

### Estrutura de Traduções

As traduções estão organizadas por categorias:

```typescript
const translations = {
  pt: {
    'tab.games': 'Games',
    'tab.search': 'Buscar',
    'settings.title': 'Configurações',
    // ...
  },
  en: {
    'tab.games': 'Games',
    'tab.search': 'Search',
    'settings.title': 'Settings',
    // ...
  },
  es: {
    'tab.games': 'Juegos',
    'tab.search': 'Buscar',
    'settings.title': 'Ajustes',
    // ...
  }
}
```

## 📚 Categorias de Tradução

### 1. Navegação (Tabs)
- `tab.games` - Aba de jogos
- `tab.hardware` - Aba de hardware
- `tab.search` - Aba de busca
- `tab.watching` - Aba de lista de observação
- `tab.config` - Aba de configurações

### 2. Cabeçalho
- `header.title` - Título principal "Looton"
- `header.subtitle` - Subtítulo "Ofertas do Dia"

### 3. Tela Inicial (Home)
- `home.loading` - Mensagem de carregamento
- `home.error` - Mensagem de erro
- `home.noDeals` - Nenhuma oferta encontrada
- `home.refresh` - Atualizar
- `home.filters` - Filtros
- `home.clearFilters` - Limpar filtros
- `home.sortBy` - Ordenar por
- `home.bestPrice` - Melhor preço
- `home.biggestDiscount` - Maior desconto

### 4. Cards de Jogos
- `game.free` - Grátis
- `game.off` - OFF / DESC
- `game.viewDeal` - Ver oferta
- `game.addToWishlist` - Adicionar à lista
- `game.removeFromWishlist` - Remover da lista

### 5. Busca
- `search.placeholder` - Placeholder do input
- `search.searching` - Buscando...
- `search.noResults` - Sem resultados
- `search.games` - Jogos
- `search.dlcs` - DLCs
- `search.all` - Todos

### 6. Lista de Observação
- `wishlist.title` - Título da lista
- `wishlist.empty` - Lista vazia
- `wishlist.emptyDesc` - Descrição lista vazia
- `wishlist.currentPrice` - Preço atual
- `wishlist.desiredPrice` - Preço desejado
- `wishlist.updatePrice` - Atualizar preço
- `wishlist.remove` - Remover

### 7. Configurações
- `settings.title` - Configurações
- `settings.language` - Idioma
- `settings.currency` - Moeda
- `settings.notifications` - Notificações
- `settings.help` - Ajuda
- `settings.privacy` - Privacidade
- `settings.about` - Sobre

### 8. Seletor de Idioma
- `language.portuguese` - Português
- `language.english` - English
- `language.spanish` - Español

### 9. Moeda
- `currency.title` - Selecionar moeda
- `currency.search` - Buscar moeda

### 10. Notificações
- `notifications.title` - Notificações
- `notifications.dailyOffers` - Oferta do dia
- `notifications.dailyOffersDesc` - Descrição oferta do dia
- `notifications.watchedGames` - Jogos vigiados
- `notifications.watchedGamesDesc` - Descrição jogos vigiados
- `notifications.test` - Testar notificação
- `notifications.history` - Histórico
- `notifications.empty` - Nenhuma notificação
- `notifications.emptyDesc` - Descrição vazio
- `notifications.clearAll` - Limpar todas

### 11. Botões Genéricos
- `button.close` - Fechar
- `button.save` - Salvar
- `button.cancel` - Cancelar
- `button.confirm` - Confirmar
- `button.ok` - OK
- `button.yes` - Sim
- `button.no` - Não

### 12. Mensagens Toast
- `toast.success` - Sucesso!
- `toast.error` - Erro!
- `toast.copied` - Copiado!
- `toast.saved` - Salvo!

### 13. Hardware
- `hardware.title` - Hardware
- `hardware.search` - Placeholder de busca

### 14. Análise de Preços
- `price.lowest` - Preço mais baixo
- `price.good` - Preço bom
- `price.average` - Preço médio
- `price.high` - Preço alto
- `price.veryHigh` - Preço muito alto
- `price.normal` - Preço normal

### 15. Sobre/Versão
- `about.title` - Sobre o Looton
- `about.version` - Versão
- `about.description` - Descrição do app
- `about.tagline` - "Desenvolvido com"
- `about.taglineEnd` - "para gamers"

### 16. Detalhes do Jogo
- `gameDetails.tabs.games` - Aba Jogos
- `gameDetails.tabs.dlcs` - Aba DLCs & Expansões
- `gameDetails.searchPlaceholder` - Procurar por jogos
- `gameDetails.searchSteam` - Procurar jogos na Steam Store
- `gameDetails.accessStore` - Acesse a loja oficial
- `gameDetails.watch` - Vigiar
- `gameDetails.systemRequirements` - Requisitos do Sistema
- `gameDetails.minimumRequirements` - Requisitos Mínimos
- `gameDetails.recommendedRequirements` - Requisitos Recomendados
- `gameDetails.genres` - Gêneros

### 17. Estado Vazio da Lista de Observação
- `watchlist.emptyTitle` - Título quando lista vazia
- `watchlist.emptyMessage` - Mensagem quando lista vazia

## 🔧 Como Usar

### 1. Envolver o App com LanguageProvider

No arquivo `app/index.tsx`:

```typescript
import { LanguageProvider } from '../src/contexts/LanguageContext';

export default function Home() {
  return (
    <LanguageProvider>
      <HomeContent />
    </LanguageProvider>
  );
}
```

### 2. Usar o Hook no Componente

```typescript
function HomeContent() {
  const { language, setLanguage, t } = useLanguage();
  
  return (
    <View>
      <Text>{t('header.title')}</Text>
      <Text>{t('header.subtitle')}</Text>
    </View>
  );
}
```

### 3. Trocar Idioma

```typescript
// Trocar para inglês
await setLanguage('en');

// Trocar para espanhol
await setLanguage('es');

// Trocar para português
await setLanguage('pt');
```

### 4. Verificar Idioma Atual

```typescript
const { language } = useLanguage();

console.log('Idioma atual:', language); // 'pt', 'en' ou 'es'
```

## 🎨 Interface de Seleção

A seleção de idioma está disponível em **Config > Idioma**:

- Interface modal com as 3 opções
- Indicador visual do idioma selecionado (fundo azul + borda)
- Bandeiras para identificação rápida
- Mudança instantânea ao selecionar

## 💾 Persistência

O idioma selecionado é salvo automaticamente no AsyncStorage:

```typescript
// Chave de armazenamento
const LANGUAGE_STORAGE_KEY = '@app_language';

// Ao trocar idioma
await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');

// Ao carregar o app
const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
```

## ➕ Como Adicionar Novas Traduções

### 1. Adicionar a chave em `LanguageContext.tsx`

```typescript
const translations = {
  pt: {
    // ... traduções existentes
    'newFeature.title': 'Novo Recurso',
    'newFeature.description': 'Descrição do novo recurso'
  },
  en: {
    // ... traduções existentes
    'newFeature.title': 'New Feature',
    'newFeature.description': 'New feature description'
  },
  es: {
    // ... traduções existentes
    'newFeature.title': 'Nueva Función',
    'newFeature.description': 'Descripción de la nueva función'
  }
}
```

### 2. Usar no componente

```typescript
<Text>{t('newFeature.title')}</Text>
<Text>{t('newFeature.description')}</Text>
```

## 🧪 Testando

### Teste Manual

1. Abra o app
2. Vá para **Config**
3. Toque em **Idioma**
4. Selecione cada idioma e verifique:
   - Mudança imediata nas tabs
   - Mudança no cabeçalho
   - Mudança em todas as telas
   - Persistência após reiniciar o app

### Teste de Persistência

1. Selecione um idioma diferente do padrão
2. Feche completamente o app (force close)
3. Abra novamente
4. Verifique se o idioma selecionado foi mantido

## 📱 Comportamento

### Idioma Padrão
- **Português (pt)** é o idioma padrão
- Usado na primeira abertura do app
- Usado se houver erro ao carregar preferência salva

### Idiomas Suportados
- Validação automática de códigos de idioma
- Apenas 'pt', 'en' e 'es' são aceitos
- Códigos inválidos revertem para português

### Mudança de Idioma
- **Instantânea**: não requer reiniciar o app
- **Global**: afeta todas as telas simultaneamente
- **Persistente**: mantém preferência entre sessões

## 🌐 Formatação Regional

### Números e Moedas
O sistema de moedas já existente continua funcionando independentemente do idioma:

```typescript
const { formatPrice } = useCurrency();

// Formatação respeita a moeda selecionada, não o idioma
formatPrice(99.99); // "R$ 99,99" ou "$ 99.99" etc
```

### Datas
Atualmente as datas não são traduzidas, mas você pode adicionar:

```typescript
// Exemplo de formatação de data por idioma
const formatDate = (date: Date) => {
  const locale = language === 'pt' ? 'pt-BR' : 
                 language === 'es' ? 'es-ES' : 'en-US';
  
  return date.toLocaleDateString(locale);
};
```

## 🚀 Próximos Passos

### Traduções Pendentes

Algumas áreas ainda precisam de tradução:
- Mensagens de erro específicas
- Textos longos (política de privacidade, ajuda)
- Descrições de jogos (se aplicável)
- Labels de filtros avançados

### Melhorias Futuras

1. **Detecção automática de idioma** baseada no sistema
2. **Traduções dinâmicas** carregadas de API
3. **Mais idiomas** (francês, alemão, etc.)
4. **Pluralização** (1 item vs 2 items)
5. **Interpolação** de variáveis nas traduções

## 🔍 Troubleshooting

### Tradução não aparece

1. Verifique se a chave está correta: `t('categoria.chave')`
2. Verifique se a chave existe nos 3 idiomas
3. Verifique se o componente está usando `useLanguage()`
4. Verifique se está dentro do `<LanguageProvider>`

### Idioma não persiste

1. Verifique permissões do AsyncStorage
2. Verifique console para erros de salvamento
3. Teste manualmente:
   ```typescript
   await AsyncStorage.getItem('@app_language')
   ```

### Idioma não muda

1. Certifique-se que `setLanguage` é async e está sendo esperado:
   ```typescript
   await setLanguage('en');
   ```
2. Verifique se o modal fecha após selecionar
3. Force re-render se necessário

## 📝 Convenções de Código

### Nomenclatura de Chaves

- Use ponto (`.`) para separar categoria e chave
- Categorias em lowercase: `home`, `settings`, `game`
- Chaves em camelCase: `dailyOffers`, `currentPrice`
- Exemplo: `home.loading`, `settings.language`

### Organização

Agrupe traduções por **contexto funcional**, não por tela:
- ✅ `button.save`, `button.cancel`, `button.close`
- ❌ `homeScreen.saveButton`, `searchScreen.saveButton`

### Fallback

Se uma chave não existe, o sistema retorna a própria chave:
```typescript
t('chave.inexistente') // retorna 'chave.inexistente'
```

Isso facilita identificar traduções faltantes durante desenvolvimento.

## 🎯 Conclusão

O sistema de múltiplos idiomas está totalmente funcional e pronto para uso. A estrutura é escalável e permite fácil adição de novos idiomas e traduções conforme necessário.

Para qualquer dúvida ou sugestão, consulte o código em `src/contexts/LanguageContext.tsx`.
