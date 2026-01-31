# Sistema de Notificações Automáticas para Jogos Vigiados

## 📋 Visão Geral

Sistema completo de monitoramento automático de preços para jogos marcados como "vigiados" pelo usuário. O sistema detecta automaticamente quando um jogo vigiado entra em promoção e notifica o usuário com detalhes da oferta.

**✨ FUNCIONA MESMO COM O APP FECHADO!** Utiliza background tasks do Expo para verificar promoções a cada 1 hora, independentemente do estado do app.

## 🎯 Funcionalidades

### Detecção Automática de Promoções
- ✅ Monitora todos os jogos na wishlist/favoritos do usuário
- ✅ Verifica preços a cada 1 hora automaticamente
- ✅ Detecta APENAS novas promoções (quedas de preço)
- ✅ Compara preço atual com o último preço conhecido
- ✅ Notifica somente quando há desconto ativo

### Sistema de Cache Inteligente
- 💾 Armazena histórico de preços no AsyncStorage
- 📊 Registra preço, desconto, timestamp e loja
- 🔄 Atualiza cache após cada verificação
- 🎯 Evita notificações duplicadas para mesma promoção

### Notificações Ricas
- 🔥 Título destacado: "🔥 [Nome do Jogo] em Promoção!"
- 💰 Corpo detalhado: "De R$ X por R$ Y (Z% OFF) na [Loja]! Economize R$ W!"
- 🎨 Cor verde (#10B981) identificando promoções
- 🔔 Som, vibração e badge configurados
- 📱 Prioridade MAX no Android

## 🏗️ Arquitetura

### Arquivos Principais

#### `BackgroundWatchedGamesService.ts` (NOVO!)
```
src/services/BackgroundWatchedGamesService.ts
```

**Responsável pelo background fetch:**
- `registerBackgroundFetch()` - Registra tarefa de background
- `unregisterBackgroundFetch()` - Remove tarefa de background
- `getBackgroundFetchStatus()` - Verifica status da tarefa
- `BACKGROUND_FETCH_TASK` - Task Manager definição

**Configuração:**
```typescript
{
  minimumInterval: 60 * 60, // 1 hora
  stopOnTerminate: false,   // Continua mesmo se app for fechado
  startOnBoot: true,        // Inicia quando dispositivo reiniciar
}
```

#### `WatchedGamesNotificationService.ts`
```
src/services/WatchedGamesNotificationService.ts
```

**Funções exportadas:**
- `checkWatchedGamesForDeals()` - Função principal de verificação automática
- `isWatchedGamesNotificationEnabled()` - Verificar se notificações estão ativas
- `setWatchedGamesNotificationEnabled(enabled)` - Ativar/desativar notificações
- `getLastCheckTimestamp()` - Obter data da última verificação
- `clearPriceCache()` - Limpar cache (útil para testes)

**Funções internas:**
- `setupWatchedGamesChannel()` - Configura canal Android com prioridade MAX
- `getPriceCache()` - Carrega cache de preços do AsyncStorage
- `savePriceCache(cache)` - Salva cache atualizado
- `fetchCurrentGamePrice(appId, store)` - Busca preço atual via API
- `sendPromotionNotification(game, oldPrice, newPrice, discount, store)` - Envia notificação

#### `app/index.tsx`
```typescript
// Verificação automática a cada 1 hora (linha ~183)
useEffect(() => {
  const checkWatchedGamesAutomatically = async () => {
    const module = await import('../src/services/WatchedGamesNotificationService');
    await module.checkWatchedGamesForDeals();
  };
  
  // Executar imediatamente ao abrir o app
  checkWatchedGamesAutomatically();
  
  // Intervalo de 1 hora
  const intervalId = setInterval(checkWatchedGamesAutomatically, 3600000);
  
  return () => clearInterval(intervalId);
}, []);
```

### Interface PriceCache
```typescript
interface PriceCache {
  [gameId: string]: {
    price: number;        // Preço atual
    discount: number;     // Porcentagem de desconto
    timestamp: number;    // Momento da última verificação
    store: string;        // Loja onde está a oferta
  };
}
```

### Interface WishlistItem
```typescript
interface WishlistItem {
  appId: number;          // ID do jogo (Steam AppId)
  title: string;          // Nome do jogo
  currentPrice: number;   // Preço atual
  desiredPrice: number;   // Preço desejado pelo usuário
  coverUrl: string;       // URL da capa
  store: string;          // Loja (Steam, Epic, etc)
  url: string;            // Link para a oferta
  addedAt: string;        // Data de adição à wishlist
  notified?: boolean;     // Flag se já foi notificado
}
```

## 🔄 Fluxo de Funcionamento

```
1. App abre
   ↓
2. useEffect executa checkWatchedGamesForDeals()
   ↓
3. Carrega lista de jogos vigiados (WishlistService)
   ↓
4. Para cada jogo:
   ├─ Busca preço atual via API
   ├─ Carrega último preço conhecido do cache
   ├─ Compara: currentPrice < lastKnownPrice?
   ├─ Tem desconto ativo?
   └─ Se SIM → Envia notificação
   ↓
5. Atualiza cache com novos preços
   ↓
6. Aguarda 1 hora
   ↓
7. Repete processo (volta ao passo 3)
```

## 🎮 Exemplo de Uso (Cenário Real)

### Cenário: Usuário quer comprar WRC
```
Dia 1 (Segunda-feira):
- Usuário pesquisa "WRC" no app
- Vê que não está em promoção (R$ 199,90)
- Adiciona aos favoritos/wishlist
- Sistema registra: preço R$ 199,90 no cache

Dia 4 (Quinta-feira 10h):
- Sistema verifica automaticamente todos os jogos
- Detecta que WRC agora está R$ 99,95 (50% OFF)
- Compara: 99.95 < 199.90? SIM
- Tem desconto? SIM (50%)
- 🔔 ENVIA NOTIFICAÇÃO:
  "🔥 WRC em Promoção!"
  "De R$ 199,90 por R$ 99,95 (50% OFF) na Steam! 
   Economize R$ 99,95!"
```

## 🛠️ Configuração

### Chaves de AsyncStorage
```typescript
const WATCHED_GAMES_ENABLED = 'watchedGamesNotificationsEnabled';
const LAST_PRICES_CACHE = 'lastKnownPricesCache';
const LAST_CHECK_TIMESTAMP = 'lastWatchedGamesCheckTimestamp';
```

### Canal Android
```typescript
{
  id: 'watched-games',
  name: 'Jogos Vigiados',
  importance: MAX,
  color: '#10B981',  // Verde
  sound: 'default',
  vibrationPattern: [0, 250, 250, 250]
}
```

### Intervalo de Verificação
- **Padrão:** 1 hora (3.600.000 ms)
- **Primeira execução:** Imediata ao abrir o app
- **Configurável em:** `app/index.tsx` linha ~195

## 📱 UI - Controles do Usuário

### Modal de Notificações (app/index.tsx)
```typescript
// Toggle para ativar/desativar
<TouchableOpacity onPress={toggleWatchedGamesNotification}>
  <Text>Jogos Vigiados</Text>
  <Switch value={watchedGamesEnabled} />
</TouchableOpacity>

// Botão de teste manual
<TouchableOpacity onPress={checkWatchedGames}>
  <Icon name="search" />
  <Text>Verificar Agora</Text>
</TouchableOpacity>
```

## 🧪 Testando o Sistema

### Teste Manual Rápido
```typescript
// No console do app
import { checkWatchedGamesForDeals } from './src/services/WatchedGamesNotificationService';

// Executar verificação
const count = await checkWatchedGamesForDeals();
console.log(`${count} notificação(ões) enviada(s)`);
```

### Limpar Cache para Re-testar
```typescript
import { clearPriceCache } from './src/services/WatchedGamesNotificationService';
await clearPriceCache();
// Agora qualquer promoção ativa será detectada como "nova"
```

### Logs de Debug
O serviço emite logs detalhados:
```
🔍 Verificando 3 jogo(s) vigiado(s)...
🎯 PROMOÇÃO ENCONTRADA: WRC - De R$ 199.90 para R$ 99.95
✅ Notificação enviada para WRC! ID: [uuid]
✅ Verificação concluída: 1 notificação(ões) enviada(s)
```

## ⚙️ Customizações Possíveis

### Alterar Intervalo de Verificação
```typescript
// Em app/index.tsx, linha ~195
const HOUR_IN_MS = 3600000;
const intervalId = setInterval(checkWatchedGamesAutomatically, HOUR_IN_MS);

// Exemplo: 30 minutos
const intervalId = setInterval(checkWatchedGamesAutomatically, 1800000);
```

### Alterar Critérios de Notificação
```typescript
// Em WatchedGamesNotificationService.ts, linha ~189
const hasNewDeal = currentPrice < lastKnownPrice;
const meetsDesiredPrice = currentPrice <= item.desiredPrice;
const hasDiscount = discount > 0;

// Exemplo: Notificar se desconto >= 30%
if (hasNewDeal && discount >= 30) {
  await sendPromotionNotification(...);
}
```

### Customizar Mensagem da Notificação
```typescript
// Em WatchedGamesNotificationService.ts, linha ~108
title: `🔥 ${game.title} em Promoção!`,
body: `De R$ ${oldPrice} por R$ ${newPrice}${discountText} na ${store}!`

// Exemplo: Formato mais curto
title: `${game.title} - ${discount}% OFF`,
body: `R$ ${newPrice} na ${store}`
```

## 🔒 Considerações de Privacidade

- ✅ Todos os dados ficam no dispositivo (AsyncStorage)
- ✅ Nenhum dado de wishlist é enviado para servidores externos
- ✅ Usuário controla ativação/desativação completa do sistema
- ✅ Cache pode ser limpo a qualquer momento

## 🚀 Próximos Passos (Melhorias Futuras)

- [ ] Background fetch para verificações mesmo com app fechado
- [ ] Configuração de intervalo personalizado pelo usuário
- [ ] Filtros de desconto mínimo (ex: só notificar se > 50% OFF)
- [ ] Histórico de promoções perdidas
- [ ] Analytics de economia (quanto o usuário economizou)
- [ ] Notificações agrupadas (múltiplos jogos em 1 notificação)

## 📚 Dependências

```json
{
  "expo-notifications": "~0.30.2",
  "@react-native-async-storage/async-storage": "2.0.0",
  "react-native": "0.81.4"
}
```

## 🐛 Troubleshooting

### Notificações não aparecem
1. Verificar permissões de notificação concedidas
2. Verificar se `watchedGamesEnabled` está `true`
3. Checar logs: `console.log` mostra se verificação está rodando
4. Limpar cache e testar com jogo que está em promoção

### Verificação não está rodando automaticamente
1. Verificar se o componente `app/index.tsx` está montado
2. Checar console por erros no `useEffect`
3. Verificar se intervalo não foi clearado prematuramente

### Muitas notificações duplicadas
1. Verificar se cache está sendo salvo corretamente
2. Checar lógica de comparação `currentPrice < lastKnownPrice`
3. Revisar se múltiplos intervalos estão ativos simultaneamente

---

**Desenvolvido para Looton - Gaming Deals Aggregator**
