# Sistema de Anúncios Intersticiais - AdMob

## 📋 Visão Geral

Sistema inteligente de anúncios intersticiais (tela cheia) do Google AdMob com controle de frequência para não incomodar os usuários.

## 🔑 Credenciais

### App ID
- **Android/iOS**: `ca-app-pub-2976862302591431~7964761364`

### Interstitial Ad Unit ID
- **Android/iOS**: `ca-app-pub-2976862302591431/8433830309`

## 🎯 Estratégia de Exibição

### Controles Inteligentes

1. **Tempo Mínimo Entre Anúncios**
   - ⏱️ **5 minutos** entre cada anúncio
   - Garante que usuário não seja bombardeado
   - Persistido entre sessões (AsyncStorage)

2. **Ações Mínimas Necessárias**
   - 🎯 **3 ações** do usuário antes de mostrar anúncio
   - Evita anúncios imediatos ao abrir o app
   - Contador resetado após cada anúncio

3. **Pré-carregamento Inteligente**
   - 📥 Anúncio carregado automaticamente em background
   - Pronto para exibir instantaneamente quando critérios forem atendidos
   - Recarrega automaticamente após fechar anúncio

## 📍 Pontos de Rastreamento de Ações

### Ações que Incrementam o Contador:

1. **Trocar de Aba** ✅
   - Home → Buscar
   - Buscar → Hardware
   - Etc.

2. **Abrir Detalhes de Jogo** ✅
   - Clique em qualquer card de jogo
   - Incrementa ao abrir modal

3. **Fechar Detalhes de Jogo** ✅
   - Tenta mostrar anúncio ao fechar modal
   - Se critérios atendidos, exibe anúncio

### Futuros Pontos de Rastreamento (Sugestões):
- ❌ Adicionar jogo à lista de desejos
- ❌ Favoritar/Desfavoritar jogo
- ❌ Compartilhar jogo
- ❌ Buscar por jogo
- ❌ Aplicar filtros

## 🏗️ Arquitetura

### Arquivo Principal
**`src/services/InterstitialAdService.ts`**

```typescript
class InterstitialAdService {
  // Rastrear ação do usuário
  trackAction(): void
  
  // Tentar mostrar anúncio (verifica critérios)
  tryShowAd(): Promise<boolean>
  
  // Forçar carregamento de novo anúncio
  forceLoadAd(): void
  
  // Resetar contadores (para testes)
  resetCounters(): Promise<void>
  
  // Obter status atual
  getStatus(): AdStatus
}
```

### Configurações

```typescript
// Tempo mínimo entre anúncios (5 minutos)
const MIN_TIME_BETWEEN_ADS = 5 * 60 * 1000;

// Mínimo de ações antes de mostrar anúncio
const MIN_ACTIONS_BEFORE_AD = 3;
```

### Armazenamento (AsyncStorage)

```typescript
// Chaves de armazenamento
'@last_interstitial_ad'  // Timestamp do último anúncio
'@action_count'          // Contador de ações
```

## 📊 Fluxo de Exibição

### Diagrama de Decisão

```
Usuário faz ação
     ↓
Incrementa contador de ações
     ↓
Chama tryShowAd()
     ↓
Verificações:
  ├─ Passou 5min desde último anúncio? ──→ NÃO ──→ Não mostra
  ├─ Tem 3+ ações registradas? ──→ NÃO ──→ Não mostra
  ├─ Anúncio está carregado? ──→ NÃO ──→ Não mostra
  └─ TODAS OK ──→ SIM ──→ Mostra anúncio
                              ↓
                        Reseta contadores
                              ↓
                        Pré-carrega próximo anúncio
```

### Exemplo Prático

```
Tempo   | Ação                    | Contador | Pode Mostrar? | Motivo
--------|-------------------------|----------|---------------|---------------------------
0:00    | Abre app                | 0        | ❌            | 0 ações
0:15    | Troca para Buscar       | 1        | ❌            | 1 ação (precisa 3)
0:30    | Abre jogo God of War    | 2        | ❌            | 2 ações (precisa 3)
0:45    | Fecha detalhes          | 3        | ✅            | 3 ações + 0min OK
        | → ANÚNCIO MOSTRADO      | 0        |               | Contador resetado
6:00    | Troca para Hardware     | 1        | ❌            | 1 ação (precisa 3)
6:15    | Abre jogo Elden Ring    | 2        | ❌            | 2 ações
6:30    | Fecha detalhes          | 3        | ❌            | Apenas 5:45 desde último
8:00    | Troca para Favoritos    | 4        | ✅            | 4 ações + 7:15min OK
        | → ANÚNCIO MOSTRADO      | 0        |               | Contador resetado
```

## 🔧 Integração no App

### 1. Importar o Serviço

```typescript
import { interstitialAdService } from '../src/services/InterstitialAdService';
```

### 2. Rastrear Ações

```typescript
// Ao trocar de aba
onPress={() => {
  interstitialAdService.trackAction();
  interstitialAdService.tryShowAd();
  setActiveTab(tab.key);
}}

// Ao abrir detalhes
const handleGamePress = (deal) => {
  setSelectedDeal(deal);
  interstitialAdService.trackAction();
}

// Ao fechar detalhes
const handleCloseGameDetails = () => {
  setGameDetailsModalVisible(false);
  interstitialAdService.tryShowAd();
}
```

## 📈 Eventos Monitorados

### AdEventType.LOADED
```typescript
console.log('✅ Interstitial ad loaded successfully');
this.isAdLoaded = true;
```

### AdEventType.CLOSED
```typescript
console.log('🔄 Interstitial ad closed');
// Reseta contadores
this.lastAdTime = Date.now();
this.actionCount = 0;
// Pré-carrega próximo anúncio
this.loadAd();
```

### AdEventType.ERROR
```typescript
console.error('❌ Interstitial ad error:', error);
// Tenta novamente em 30 segundos
setTimeout(() => this.loadAd(), 30000);
```

## 🐛 Debug e Logs

### Logs Informativos

```
📥 Loading interstitial ad...
✅ Interstitial ad loaded successfully
📍 Action tracked: 3 actions since last ad
🎬 Showing interstitial ad
🔄 Interstitial ad closed, preloading next ad
```

### Logs de Bloqueio

```
⏱️ Cannot show ad: Only 2.5min passed (need 5min)
🎯 Cannot show ad: Only 2 actions (need 3)
📭 Cannot show ad: Ad not loaded yet
```

### Obter Status Atual

```typescript
const status = interstitialAdService.getStatus();
console.log(status);
// {
//   isAdLoaded: true,
//   isAdLoading: false,
//   timeSinceLastAd: 320000, // 5:20 em ms
//   actionCount: 2,
//   canShow: false
// }
```

## 🧪 Testes

### Usar Test Ads

Durante desenvolvimento, altere em `InterstitialAdService.ts`:

```typescript
// Trocar de:
const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-2976862302591431/8433830309';

// Para:
const INTERSTITIAL_AD_UNIT_ID = TestIds.INTERSTITIAL;
```

### Resetar Contadores

```typescript
await interstitialAdService.resetCounters();
console.log('🔄 Ad counters reset');
```

### Forçar Carregamento

```typescript
interstitialAdService.forceLoadAd();
```

## ⚙️ Customização

### Ajustar Tempo Entre Anúncios

```typescript
// De 5 minutos para 10 minutos
const MIN_TIME_BETWEEN_ADS = 10 * 60 * 1000;
```

### Ajustar Ações Necessárias

```typescript
// De 3 ações para 5 ações
const MIN_ACTIONS_BEFORE_AD = 5;
```

### Adicionar Novo Ponto de Rastreamento

```typescript
const handleFavoriteGame = (game) => {
  // Sua lógica de favoritar
  favoriteGame(game);
  
  // Rastrear ação
  interstitialAdService.trackAction();
  
  // Opcionalmente tentar mostrar anúncio
  interstitialAdService.tryShowAd();
}
```

## 📱 UX Best Practices

### ✅ O Que Fazer

1. **Momentos Naturais**: Mostre anúncios em transições naturais (fechar modal, trocar aba)
2. **Controle de Frequência**: Respeite o tempo mínimo entre anúncios
3. **Pré-carregamento**: Mantenha anúncio sempre pronto
4. **Feedback Visual**: Não mostrar spinner/loading antes do anúncio
5. **Persistência**: Salvar estado entre sessões

### ❌ O Que Evitar

1. ❌ Anúncios no meio de uma ação (ex: enquanto rola feed)
2. ❌ Múltiplos anúncios seguidos
3. ❌ Anúncio ao abrir o app pela primeira vez
4. ❌ Interromper gameplay ou leitura
5. ❌ Forçar anúncios sem critérios

## 🚀 Deploy

### Rebuild Necessário

Após adicionar anúncios intersticiais, rebuild obrigatório:

```bash
# Android
npx expo run:android

# iOS  
npx expo run:ios

# EAS Build
eas build --platform android
eas build --platform ios
```

## 📊 Métricas Recomendadas

### KPIs para Monitorar

1. **Fill Rate**: % de vezes que anúncio carrega com sucesso
2. **Impression Rate**: Quantos anúncios são mostrados vs tentativas
3. **eCPM**: Receita por mil impressões
4. **User Retention**: Impacto dos anúncios na retenção
5. **Session Length**: Tempo médio de sessão antes/depois de anúncios

### Metas Sugeridas

- **Fill Rate**: > 90%
- **Tempo Médio Entre Anúncios**: 8-12 minutos
- **Ações por Anúncio**: 5-8 ações
- **Taxa de Abandono**: < 5% após anúncio

## 🔗 Referências

- **AdMob Console**: https://apps.admob.com/
- **React Native Google Mobile Ads Docs**: https://docs.page/invertase/react-native-google-mobile-ads
- **Interstitial Best Practices**: https://support.google.com/admob/answer/6066980

## 📝 Checklist de Implementação

- [x] Criar InterstitialAdService
- [x] Implementar controle de tempo (5min)
- [x] Implementar controle de ações (3 ações)
- [x] Adicionar persistência (AsyncStorage)
- [x] Integrar rastreamento de troca de abas
- [x] Integrar rastreamento de abrir/fechar detalhes
- [x] Adicionar logs de debug
- [x] Implementar pré-carregamento automático
- [x] Tratamento de erros
- [ ] Testar em dispositivo real
- [ ] Validar no AdMob Console
- [ ] Monitorar métricas por 1 semana
- [ ] Ajustar configurações baseado em dados

## 🎯 Próximos Passos

1. **Adicionar mais pontos de rastreamento**:
   - Favoritar jogo
   - Adicionar à wishlist
   - Buscar jogos
   - Aplicar filtros

2. **A/B Testing**:
   - Testar 3 vs 5 ações mínimas
   - Testar 5min vs 8min entre anúncios

3. **Analytics**:
   - Integrar Firebase Analytics
   - Criar dashboard de métricas
   - Alertas para baixo fill rate

4. **Otimizações**:
   - Rewarded ads para features premium
   - Native ads no feed
   - Ad Mediation (múltiplas redes)
