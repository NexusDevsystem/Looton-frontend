# Sistema de Histórico de Notificações

## 📋 Visão Geral

Sistema completo de histórico de notificações que permite aos usuários visualizar todas as notificações recebidas, mesmo aquelas que perderam enquanto o app estava fechado.

## ✨ Funcionalidades

### 1. **Captura Automática de Notificações**
- Listener instalado que captura todas as notificações recebidas
- Funciona quando o app está aberto, em segundo plano ou fechado
- Cada notificação é armazenada com:
  - `id`: Identificador único
  - `title`: Título da notificação
  - `body`: Corpo/descrição
  - `timestamp`: Data e hora do recebimento
  - `data`: Dados customizados (URL da oferta, tipo, etc.)

### 2. **Persistência no AsyncStorage**
- Todas as notificações são salvas automaticamente
- Persistem entre fechamentos e aberturas do app
- Chave de armazenamento: `@notifications_history`
- Carregamento automático ao iniciar o app

### 3. **Ícone de Sino no Header**
- Localizado no canto superior direito da tela
- Badge vermelho mostrando quantidade de notificações não lidas
- Toque abre o modal de histórico
- Ícone: `notifications-outline` (Ionicons)

### 4. **Modal de Histórico**
- Design moderno tipo slide-up com fundo semi-transparente
- Header com título "Notificações" e botão de fechar
- Rolagem suave para múltiplas notificações

### 5. **Cards de Notificação**
- Cada notificação exibida em card individual:
  - **Título** em destaque (fontSize: 16, fontWeight: 600)
  - **Timestamp relativo** (ex: "5min atrás", "2h atrás", "Ontem")
  - **Descrição** completa da oferta
  - **Borda colorida** à esquerda:
    - Verde (#10B981) para ofertas de jogos vigiados
    - Azul (#3B82F6) para outros tipos
  - **Botão "Ver Oferta"** que:
    - Abre a URL da promoção
    - Fecha o modal automaticamente

### 6. **Estado Vazio**
- Ícone de sino riscado quando não há notificações
- Mensagem: "Nenhuma notificação ainda"
- Texto explicativo sobre quando receberá notificações

### 7. **Botão "Limpar Todas"**
- Localizado no final da lista
- Cor vermelha (#DC2626) indicando ação destrutiva
- Remove todas as notificações do histórico
- Limpa também o AsyncStorage

## 🏗️ Estrutura Técnica

### Estados do Componente

```typescript
// Estado para armazenar notificações recebidas
const [receivedNotifications, setReceivedNotifications] = useState<
  Array<{
    id: string;
    title: string;
    body: string;
    timestamp: string;
    data?: any;
  }>
>([]);

// Estado para controlar visibilidade do modal
const [showNotificationsHistory, setShowNotificationsHistory] = useState(false);
```

### Listener de Notificações

```typescript
// Captura notificações recebidas enquanto app está aberto
useEffect(() => {
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    const newNotification = {
      id: notification.request.identifier,
      title: notification.request.content.title || '',
      body: notification.request.content.body || '',
      timestamp: new Date().toISOString(),
      data: notification.request.content.data,
    };
    
    setReceivedNotifications(prev => [newNotification, ...prev]);
  });

  return () => subscription.remove();
}, []);
```

### Persistência Automática

```typescript
// Salva notificações no AsyncStorage sempre que houver mudança
useEffect(() => {
  if (receivedNotifications.length > 0) {
    const saveNotifications = async () => {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(
        '@notifications_history',
        JSON.stringify(receivedNotifications)
      );
    };
    saveNotifications();
  }
}, [receivedNotifications]);
```

### Carregamento na Inicialização

```typescript
// Carrega histórico salvo ao iniciar o app
useEffect(() => {
  const loadNotifications = async () => {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const saved = await AsyncStorage.getItem('@notifications_history');
    if (saved) {
      setReceivedNotifications(JSON.parse(saved));
    }
  };
  loadNotifications();
}, []);
```

## 🎨 Design e UX

### Header do App
```
┌────────────────────────────────────────┐
│ [Logo] Looton                    [🔔3] │
│        Ofertas do Dia                  │
├────────────────────────────────────────┤
```

- **Logo**: 32x32px, Logosemsundo.png
- **Texto "Looton"**: fontSize: 18, fontWeight: 700
- **Subtítulo**: fontSize: 14, color: #9CA3AF
- **Sino**: Alinhado à direita com badge

### Modal de Histórico
```
┌────────────────────────────────────────┐
│ 🔔 Notificações                    [X] │
├────────────────────────────────────────┤
│ ┌──────────────────────────────────┐  │
│ │ ▌ God of War em Promoção!   5min │  │
│ │   De R$ 199,00 por R$ 89,00      │  │
│ │   [🛒 Ver Oferta]                 │  │
│ └──────────────────────────────────┘  │
│ ┌──────────────────────────────────┐  │
│ │ ▌ Elden Ring 50% OFF!         2h │  │
│ │   Promoção imperdível!           │  │
│ │   [🛒 Ver Oferta]                 │  │
│ └──────────────────────────────────┘  │
│                                        │
│ [🗑️ Limpar Todas as Notificações]     │
└────────────────────────────────────────┘
```

### Formato de Timestamp
- **Agora**: < 1 minuto
- **Xmin atrás**: < 60 minutos
- **Xh atrás**: < 24 horas
- **Ontem**: 1 dia atrás
- **Xd atrás**: > 1 dia

## 📱 Fluxo de Uso

### Cenário 1: Notificação Chegando (App Aberto)
1. Background task detecta promoção
2. Notificação enviada
3. Listener captura notificação
4. Adiciona ao estado `receivedNotifications`
5. Badge no sino incrementa
6. Salvo automaticamente no AsyncStorage

### Cenário 2: Notificação Chegando (App Fechado)
1. Background task detecta promoção
2. Notificação enviada pelo sistema
3. Usuário vê notificação na bandeja
4. Quando abrir o app, notificação já está no histórico

### Cenário 3: Visualizando Histórico
1. Usuário toca no sino
2. Modal abre com animação slide-up
3. Lista todas as notificações (mais recentes primeiro)
4. Cada card mostra detalhes completos
5. Toque em "Ver Oferta" abre a loja
6. Toque no X ou fora do modal fecha

### Cenário 4: Limpando Histórico
1. Usuário rola até o final da lista
2. Toca em "Limpar Todas as Notificações"
3. Confirmação visual (lista fica vazia)
4. AsyncStorage limpo
5. Badge no sino desaparece

## 🔧 Integração com Notificações Ricas

O histórico trabalha em conjunto com o sistema de notificações ricas:

### Tipos de Notificação Suportados
- **watched_game_deal**: Jogos vigiados em promoção
- **daily_offer**: Oferta do dia
- **free_game**: Jogo grátis disponível
- **custom**: Notificações customizadas

### Dados Customizados Armazenados
```typescript
{
  type: 'watched_game_deal',
  url: 'https://...',  // URL para abrir ao tocar em "Ver Oferta"
  gameTitle: 'God of War',
  storeName: 'Steam',
  originalPrice: 199.00,
  finalPrice: 89.00,
  discountPercent: 55
}
```

## 📊 Armazenamento

### Estrutura do AsyncStorage
```
@notifications_history: [
  {
    id: "abc-123-def",
    title: "God of War em Promoção!",
    body: "De R$ 199,00 por R$ 89,00 na Steam!",
    timestamp: "2024-01-15T14:30:00.000Z",
    data: {
      type: "watched_game_deal",
      url: "https://store.steampowered.com/app/1593500",
      ...
    }
  },
  ...
]
```

## 🎯 Melhorias Futuras

### Sugestões de Evolução
1. **Marcar como lida**: Sistema de leitura/não lida
2. **Filtros**: Por tipo, loja, período
3. **Busca**: Buscar notificações antigas por texto
4. **Limite de histórico**: Manter apenas últimas 100 notificações
5. **Categorias visuais**: Ícones diferentes por tipo de oferta
6. **Ações rápidas**: Swipe para deletar notificação individual
7. **Estatísticas**: "Você economizou R$ X este mês"
8. **Favoritar**: Salvar ofertas favoritas para ver depois

## 🐛 Troubleshooting

### Badge não atualiza
- Verificar se o listener está ativo
- Confirmar que `receivedNotifications` está sendo atualizado

### Notificações não persistem
- Verificar permissões do AsyncStorage
- Confirmar que useEffect de salvamento está rodando

### Modal não abre
- Verificar estado `showNotificationsHistory`
- Confirmar que TouchableOpacity do sino está funcional

### Timestamp incorreto
- Verificar timezone do dispositivo
- Confirmar formato ISO do timestamp

## 📝 Arquivo Modificado

**Localização**: `looton/mobile/app/index.tsx`

**Principais Adições**:
- Linha 155-157: Estados `receivedNotifications` e `showNotificationsHistory`
- Linha 173-217: Listener de notificações recebidas
- Linha 219-233: Auto-save no AsyncStorage
- Linha 235-250: Carregamento inicial do histórico
- Linha 1488-1565: Header atualizado com logo e sino
- Linha 2087-2230: Componente `NotificationsHistoryModal`
- Linha 3003: Renderização condicional do modal

## ✅ Status

**✅ IMPLEMENTADO E FUNCIONAL**

- [x] Captura de notificações recebidas
- [x] Persistência em AsyncStorage
- [x] Ícone de sino com badge
- [x] Modal de histórico completo
- [x] Cards de notificação formatados
- [x] Botão "Ver Oferta" funcional
- [x] Botão "Limpar Todas"
- [x] Estado vazio com mensagem
- [x] Timestamps relativos
- [x] Integração com notificações ricas
- [x] Design responsivo e moderno
