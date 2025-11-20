# 📱 Notificações Ricas - Jogos Vigiados

## 🎨 Aparência Visual Melhorada

### Versão Simples (Colapsada)
```
┌─────────────────────────────────────────────┐
│  🎮  LOOTON                        agora     │
├─────────────────────────────────────────────┤
│  🔥 The Walking Dead em Promoção!           │
│  Steam • 90% OFF                            │
│                                             │
│  De R$ 134.99 por R$ 13.49 (90% OFF)       │
│  na Steam! Economize R$ 121.50!             │
└─────────────────────────────────────────────┘
```

### Versão Expandida (Com Botões de Ação)
```
┌─────────────────────────────────────────────┐
│  🎮  LOOTON                        agora     │
├─────────────────────────────────────────────┤
│  🔥 The Walking Dead em Promoção!           │
│  Steam • 90% OFF                            │
│                                             │
│  De R$ 134.99 por R$ 13.49 (90% OFF)       │
│  na Steam! Economize R$ 121.50!             │
│                                             │
│  ┌──────────────┐  ┌─────────────────────┐ │
│  │ 🛒 Ver Oferta │  │ 📤 Compartilhar     │ │
│  └──────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────┘
   ■ Verde (#10B981) - Cor de destaque
```

## ✨ Recursos Implementados

### 1. **Título Rico**
```typescript
title: "🔥 The Walking Dead em Promoção!"
```
- Emoji 🔥 para chamar atenção
- Nome completo do jogo
- Indicação clara de promoção

### 2. **Subtítulo Informativo**
```typescript
subtitle: "Steam • 90% OFF"
```
- Nome da loja
- Porcentagem de desconto
- Separador visual (•)

### 3. **Corpo Detalhado**
```typescript
body: "De R$ 134.99 por R$ 13.49 (90% OFF) na Steam! Economize R$ 121.50!"
```
- Preço original (De R$ ...)
- Preço com desconto (por R$ ...)
- Porcentagem de desconto
- Loja
- Valor economizado

### 4. **Botões de Ação Interativos**

#### Botão 1: "🛒 Ver Oferta"
```typescript
{
  identifier: 'VIEW_DEAL',
  buttonTitle: '🛒 Ver Oferta',
  options: {
    opensAppToForeground: true, // Abre o app
  },
}
```
**Ação:** Abre o app e pode navegar para a página do jogo ou abrir link externo

#### Botão 2: "📤 Compartilhar"
```typescript
{
  identifier: 'SHARE_DEAL',
  buttonTitle: '📤 Compartilhar',
  options: {
    opensAppToForeground: false, // Não abre o app
  },
}
```
**Ação:** Abre menu de compartilhamento do Android/iOS

### 5. **Dados Anexados (Data Payload)**
```typescript
data: {
  appId: 1449690,
  title: "The Walking Dead: The Telltale Definitive Series",
  url: "https://store.steampowered.com/app/1449690/",
  oldPrice: 134.99,
  newPrice: 13.49,
  discount: 90,
  store: "Steam",
  coverUrl: "https://...",
  type: "watched_game_deal"
}
```

## 🎯 Comportamentos por Ação

### Quando usuário clica na notificação principal:
```javascript
// App abre normalmente
// Pode navegar para página do jogo usando data.appId
```

### Quando usuário clica em "🛒 Ver Oferta":
```javascript
// Listener detecta actionIdentifier === 'VIEW_DEAL'
// Opções:
// 1. Abrir URL da loja (Linking.openURL(data.url))
// 2. Navegar para tela de detalhes do jogo no app
```

### Quando usuário clica em "📤 Compartilhar":
```javascript
// Listener detecta actionIdentifier === 'SHARE_DEAL'
// Chama Share.share() com:
Share.share({
  message: `🔥 ${data.title} está em PROMOÇÃO!\n` +
           `De R$ ${data.oldPrice} por R$ ${data.newPrice} (${data.discount}% OFF)\n` +
           `Confira: ${data.url}`,
  title: 'Promoção no Looton'
})
```

## 🎨 Customizações Visuais

### Cores
```typescript
color: '#10B981'  // Verde vibrante
```

### Prioridade
```typescript
priority: Notifications.AndroidNotificationPriority.MAX
```
- Aparece como "heads-up" notification
- Fica no topo da lista
- Não é silenciada facilmente

### Vibração
```typescript
vibrate: [0, 250, 250, 250]
```
- Padrão: pausa → vibra → pausa → vibra

### Som
```typescript
sound: 'default'
```
- Som padrão do sistema

### Badge
```typescript
badge: 1
```
- Número no ícone do app

### Visibilidade na Tela Bloqueada
```typescript
lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
```
- Mostra conteúdo completo mesmo com tela bloqueada

## 📊 Exemplos de Diferentes Cenários

### Cenário 1: Grande Desconto (> 70%)
```
🔥 Cyberpunk 2077 em Promoção!
Steam • 85% OFF

De R$ 199.90 por R$ 29.99 (85% OFF) na Steam! 
Economize R$ 169.91!

[🛒 Ver Oferta]  [📤 Compartilhar]
```

### Cenário 2: Desconto Médio (30-70%)
```
🔥 Elden Ring em Promoção!
Steam • 50% OFF

De R$ 249.90 por R$ 124.95 (50% OFF) na Steam! 
Economize R$ 124.95!

[🛒 Ver Oferta]  [📤 Compartilhar]
```

### Cenário 3: Desconto Pequeno (< 30%)
```
🔥 Baldur's Gate 3 em Promoção!
Steam • 20% OFF

De R$ 199.90 por R$ 159.92 (20% OFF) na Steam! 
Economize R$ 39.98!

[🛒 Ver Oferta]  [📤 Compartilhar]
```

### Cenário 4: Jogo Gratuito (Epic Games)
```
🔥 Monument Valley GRÁTIS!
Epic Games • 100% OFF

De R$ 14.99 por R$ 0.00 (100% OFF) na Epic Games! 
Economize R$ 14.99!

[🛒 Resgatar]  [📤 Compartilhar]
```

## 🔧 Implementação Técnica

### App.tsx - Configuração de Categorias
```typescript
await Notifications.setNotificationCategoryAsync('WATCHED_GAME_PROMOTION', [
  {
    identifier: 'VIEW_DEAL',
    buttonTitle: '🛒 Ver Oferta',
    options: { opensAppToForeground: true },
  },
  {
    identifier: 'SHARE_DEAL',
    buttonTitle: '📤 Compartilhar',
    options: { opensAppToForeground: false },
  },
]);
```

### App.tsx - Listener de Ações
```typescript
Notifications.addNotificationResponseReceivedListener(response => {
  const { actionIdentifier, notification } = response;
  const data = notification.request.content.data;
  
  if (data.type === 'watched_game_deal') {
    if (actionIdentifier === 'VIEW_DEAL') {
      // Abrir oferta
    } else if (actionIdentifier === 'SHARE_DEAL') {
      // Compartilhar
    }
  }
});
```

### WatchedGamesNotificationService.ts - Criação da Notificação
```typescript
const notificationContent = {
  title: `🔥 ${game.title} em Promoção!`,
  body: `De R$ ${oldPrice} por R$ ${newPrice} (${discount}% OFF) na ${store}! Economize R$ ${priceReduction}!`,
  subtitle: `${store} • ${discount}% OFF`,
  categoryIdentifier: 'WATCHED_GAME_PROMOTION',
  // ... outras configurações
};
```

## 🚀 Melhorias Futuras Possíveis

### 1. Imagem Grande (Big Picture)
```
┌─────────────────────────────────────────────┐
│  [════════ IMAGEM DO JOGO ════════]         │
│                                             │
│  🔥 The Walking Dead em Promoção!           │
│  De R$ 134.99 por R$ 13.49 (90% OFF)       │
│                                             │
│  [🛒 Ver Oferta]  [📤 Compartilhar]        │
└─────────────────────────────────────────────┘
```

### 2. Notificações Agrupadas
```
┌─────────────────────────────────────────────┐
│  🎮  LOOTON                        agora     │
│  3 jogos vigiados em promoção!              │
│                                             │
│  • The Walking Dead (90% OFF)               │
│  • Cyberpunk 2077 (50% OFF)                 │
│  • Elden Ring (30% OFF)                     │
│                                             │
│  [Ver Todas]                                │
└─────────────────────────────────────────────┘
```

### 3. Progresso de Watchlist
```
┌─────────────────────────────────────────────┐
│  🎮 Seu histórico de economia               │
│                                             │
│  Você economizou R$ 345.50 este mês!        │
│  [▓▓▓▓▓▓▓░░░] 7/10 jogos em promoção       │
└─────────────────────────────────────────────┘
```

## 📱 Compatibilidade

- ✅ **Android 8.0+** - Suporte completo a botões de ação
- ✅ **Android 7.0** - Notificações ricas sem botões
- ✅ **Android 6.0-** - Notificações simples
- ✅ **iOS 10+** - Suporte a categorias e ações

## 🎯 Próximos Passos

Para testar as notificações ricas:
1. Rebuild do app (para incluir as novas categorias)
2. Adicionar um jogo aos favoritos
3. Aguardar verificação automática (1 hora) ou clicar em "Verificar Agora"
4. Receber notificação com botões de ação! 🎉
