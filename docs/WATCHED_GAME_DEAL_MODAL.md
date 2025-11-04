# 🎯 Modal de Promoção de Jogos Vigiados

## Visão Geral

Sistema completo que exibe um **modal bonito e persuasivo** quando o usuário clica em uma notificação de jogo vigiado em promoção. O modal foi criado para **induzir o usuário a comprar** mostrando informações essenciais de forma atraente.

## 🎨 Design do Modal

### Características Visuais

1. **Imagem de Destaque**
   - Capa do jogo em tela cheia (240px altura)
   - Gradient overlay na parte inferior
   - Badge de desconto destacado (-XX%)
   - Botão de fechar elegante

2. **Tag de Promoção**
   - "OFERTA ESPECIAL" com ícone de raio
   - Fundo amarelo translúcido
   - Chama atenção imediatamente

3. **Informações do Jogo**
   - Título em destaque (24px, bold)
   - Nome da loja com ícone
   - Preços comparativos (De → Por)

4. **Indicador de Economia**
   - Card verde com gradient
   - Mostra economia em R$ e %
   - Ícone de tendência para baixo

5. **Botões de Ação**
   - **Primário**: "Ver na Loja Oficial" (gradient roxo, ícone carrinho)
   - **Secundário**: "Ver Detalhes Completos" (fundo cinza)

6. **Senso de Urgência**
   - Texto: "Promoções podem acabar a qualquer momento!"
   - Ícone de relógio laranja

## 📱 Fluxo de Funcionamento

```
Notificação de jogo vigiado
         ↓
Usuário clica na notificação
         ↓
App.tsx captura o clique
         ↓
Extrai dados (título, preços, loja, imagem)
         ↓
Abre WatchedGameDealModal
         ↓
Usuário vê informações persuasivas
         ↓
OPÇÃO 1: Clica "Ver na Loja Oficial"
  → Abre URL da loja no navegador
  → Modal fecha
         ↓
OPÇÃO 2: Clica "Ver Detalhes Completos"
  → EventBus emite evento 'openGameDetails'
  → index.tsx recebe evento
  → Busca dados completos do jogo
  → Abre GameDetailsModal
  → WatchedGameDealModal fecha
         ↓
OPÇÃO 3: Clica fora ou no X
  → Modal fecha
```

## 🔧 Arquivos Criados/Modificados

### 1. **WatchedGameDealModal.tsx** (NOVO)
**Localização**: `src/components/WatchedGameDealModal.tsx`

**Props**:
```typescript
interface WatchedGameDealModalProps {
  visible: boolean;
  onClose: () => void;
  gameData: {
    title: string;
    coverUrl?: string;
    oldPrice: number;
    newPrice: number;
    discount: number;
    store: string;
    url: string;
    appId?: string;
  } | null;
}
```

**Principais Componentes**:
- Imagem com gradient overlay
- Badge de desconto
- Tag de oferta especial
- Comparação de preços (De/Por)
- Card de economia
- Botões de ação (primário/secundário)
- Texto de urgência

### 2. **EventBus.ts** (NOVO)
**Localização**: `src/lib/EventBus.ts`

Sistema simples de pub/sub para comunicação entre componentes:

**Métodos**:
- `on(event, callback)` - Registrar listener
- `off(event, callback)` - Remover listener
- `emit(event, ...args)` - Emitir evento
- `once(event, callback)` - Listener que executa uma vez

**Uso**:
```typescript
// Emitir evento
EventBus.emit('openGameDetails', { appId: '123456' });

// Escutar evento
EventBus.on('openGameDetails', (data) => {
  console.log('AppId:', data.appId);
});
```

### 3. **App.tsx** (MODIFICADO)
**Mudanças**:
- ✅ Importado `WatchedGameDealModal`
- ✅ Adicionado state `dealModalVisible` e `dealData`
- ✅ Listener de notificações atualizado para capturar dados
- ✅ Modal renderizado no final do componente

**Código Adicionado**:
```typescript
const [dealModalVisible, setDealModalVisible] = useState(false);
const [dealData, setDealData] = useState<any>(null);

// No listener de notificações
if (data.type === 'watched_game_deal') {
  setDealData({
    title: data.title,
    coverUrl: data.coverUrl,
    oldPrice: data.oldPrice,
    newPrice: data.newPrice,
    discount: data.discount,
    store: data.store,
    url: data.url,
    appId: data.appId,
  });
  setDealModalVisible(true);
}

// No render
<WatchedGameDealModal
  visible={dealModalVisible}
  onClose={() => setDealModalVisible(false)}
  gameData={dealData}
/>
```

### 4. **app/index.tsx** (MODIFICADO)
**Mudanças**:
- ✅ Importado `EventBus`
- ✅ Adicionado `useEffect` para escutar evento `openGameDetails`
- ✅ Busca dados do jogo quando evento é emitido
- ✅ Abre `GameDetailsModal` com dados completos

**Código Adicionado**:
```typescript
useEffect(() => {
  const handleOpenGameDetails = async (data: { appId: string }) => {
    const response = await fetch(`https://looton.onrender.com/api/game-details/${data.appId}`);
    const gameData = await response.json();
    
    if (gameData) {
      setSelectedGameDetails(gameData);
      setGameDetailsModalVisible(true);
    }
  };

  EventBus.on('openGameDetails', handleOpenGameDetails);
  return () => EventBus.off('openGameDetails', handleOpenGameDetails);
}, []);
```

## 🎯 Estratégias de Persuasão

### 1. **Hierarquia Visual**
- Imagem grande → Desconto → Preços → Ação
- Guia o olhar do usuário naturalmente

### 2. **Contraste de Cores**
- Verde para economia (positivo)
- Vermelho para desconto (urgência)
- Roxo para ação principal (destaque)
- Laranja para urgência (atenção)

### 3. **Economia Destacada**
- Mostra quanto o usuário vai economizar
- Exibido em R$ e porcentagem
- Card separado com gradient verde

### 4. **Urgência Sutil**
- "Promoções podem acabar a qualquer momento!"
- Ícone de relógio
- Não é agressiva, mas lembra da oportunidade

### 5. **Múltiplas Opções**
- **CTA Principal**: Ir direto para loja (alta conversão)
- **CTA Secundária**: Ver mais detalhes (pesquisa)
- **Saída**: Fechar (sem pressão)

### 6. **Informação Progressiva**
- Modal pequeno → Mostra essencial
- Se interessado → Detalhes completos
- Se convencido → Loja oficial

## 📊 Dados Passados pela Notificação

Quando uma notificação de jogo vigiado é enviada, ela inclui:

```typescript
{
  type: 'watched_game_deal',
  appId: '123456',
  title: 'Nome do Jogo',
  coverUrl: 'https://...',
  oldPrice: 149.90,
  newPrice: 74.95,
  discount: 50,
  store: 'Steam',
  url: 'https://store.steampowered.com/...'
}
```

Todos esses dados são capturados e passados para o modal.

## 🎨 Paleta de Cores

```typescript
// Badge de Desconto
backgroundColor: '#DC2626' (vermelho intenso)
color: '#FFF'

// Tag de Oferta
backgroundColor: 'rgba(251, 191, 36, 0.15)' (amarelo translúcido)
color: '#FBBF24' (amarelo brilhante)

// Economia
gradient: ['#10B981', '#059669'] (verde esmeralda)
color: '#FFF'

// Botão Principal
gradient: ['#8B5CF6', '#7C3AED'] (roxo vibrante)
color: '#FFF'

// Urgência
color: '#F59E0B' (laranja)
```

## 📐 Dimensões

- **Modal Width**: SCREEN_WIDTH - 32px (max 420px)
- **Imagem Height**: 240px
- **Border Radius**: 20px (container), 12px (elementos internos)
- **Padding**: 20px (conteúdo)
- **Gap entre elementos**: 12px-20px

## 🚀 Fluxo de Conversão

1. **Notificação Push** → Desperta interesse
2. **Modal Atraente** → Reforça a oportunidade
3. **Informações Claras** → Facilita decisão
4. **CTA Destacado** → Induz à ação
5. **Link Direto** → Remove fricção

## 🔄 Integrações

### Com WatchedGamesNotificationService
- Recebe notificações de jogos em promoção
- Extrai dados da notificação
- Exibe modal automaticamente

### Com GameDetailsModal
- Via EventBus para comunicação
- Permite ver informações completas
- Mantém contexto da promoção

### Com Linking (React Native)
- Abre URL da loja no navegador
- Usa `Linking.openURL()`
- Fecha modal após abrir

## 💡 Boas Práticas Implementadas

1. **Pressable com stopPropagation**: Evita fechar ao clicar no conteúdo
2. **LinearGradient**: Transições suaves de cor
3. **numberOfLines**: Evita overflow de texto
4. **resizeMode="cover"**: Imagem sempre preenche área
5. **activeOpacity**: Feedback tátil nos botões
6. **shadowColor/elevation**: Depth visual
7. **EventBus cleanup**: Remove listeners ao desmontar

## 📱 Responsividade

- Adapta ao tamanho da tela (max 420px)
- Margens de 16px nas laterais
- Imagens responsivas
- Texto com numberOfLines para evitar overflow
- SafeArea respeitada

## 🎯 Métricas de Sucesso

Para medir efetividade, adicione tracking:

```typescript
// Ao abrir modal
EventBus.emit('analytics', { 
  event: 'notification_modal_opened',
  game: gameData.title 
});

// Ao clicar em "Ver na Loja"
EventBus.emit('analytics', { 
  event: 'cta_store_clicked',
  game: gameData.title 
});

// Ao clicar em "Ver Detalhes"
EventBus.emit('analytics', { 
  event: 'cta_details_clicked',
  game: gameData.title 
});
```

## 🐛 Troubleshooting

### Modal não abre
- Verificar se notificação tem `type: 'watched_game_deal'`
- Conferir se todos os dados estão presentes
- Checar console para erros

### Imagem não carrega
- Validar URL da imagem
- Adicionar placeholder (ícone de controle)
- Verificar conectividade

### Link não abre
- Confirmar `Linking` está importado
- Validar formato da URL
- Testar permissões de deep linking

---

**Versão:** 1.4.0  
**Última Atualização:** Janeiro 2025  
**Status:** ✅ Produção - 100% Funcional
