# Google Play Billing - Configuração de Assinaturas

Este guia explica como configurar as assinaturas no Google Play Console para o app Looton.

## 📋 Pré-requisitos

1. Conta Google Play Developer ativa
2. App publicado no Google Play Console (pode ser em teste fechado)
3. Conta bancária configurada para receber pagamentos

## 🔧 Configuração no Google Play Console

### 1. Criar Produtos de Assinatura

1. Acesse o [Google Play Console](https://play.google.com/console)
2. Selecione seu app **Looton**
3. No menu lateral, vá em **Monetização** → **Produtos** → **Assinaturas**
4. Clique em **Criar assinatura**

### 2. Configurar Assinatura Mensal

**ID do Produto:** `looton_premium_monthly`

- **Nome:** Looton Premium Mensal
- **Descrição:** Acesso premium ao Looton com renovação mensal
- **Período de renovação:** 1 mês
- **Preço:** 
  - Brasil: R$ 9,90
  - Estados Unidos: $ 4,99
  - (Configure para outros países conforme necessário)
- **Avaliação gratuita:** 7 dias (opcional)
- **Período promocional:** (opcional) 3 meses por R$ 4,90

### 3. Configurar Assinatura Anual

**ID do Produto:** `looton_premium_yearly`

- **Nome:** Looton Premium Anual
- **Descrição:** Acesso premium ao Looton com renovação anual (economize 40%)
- **Período de renovação:** 1 ano
- **Preço:**
  - Brasil: R$ 69,90 (equivalente a R$ 5,82/mês - 40% de desconto)
  - Estados Unidos: $ 29,99
- **Avaliação gratuita:** 14 dias (opcional)
- **Período promocional:** (opcional) primeiro ano por R$ 49,90

### 4. Configurar Licença de Teste

Para testar as assinaturas sem ser cobrado:

1. Vá em **Configuração** → **Configuração da conta** → **Acesso de licença de teste**
2. Adicione os emails das contas Google que você usará para testar
3. Essas contas poderão fazer compras de teste sem cobranças reais

### 5. Habilitar Faturamento Real-Time Developer Notifications (RTDN)

Para receber notificações de mudanças nas assinaturas:

1. Vá em **Monetização** → **Configurações de monetização**
2. Em **Real-time developer notifications**, configure:
   - **Topic name:** `projects/SEU_PROJETO/topics/play-subscriptions`
   - Configure o Google Cloud Pub/Sub (ver próxima seção)

## 🌐 Configuração do Backend

### Validação de Compras

O backend precisa validar as compras usando a Google Play Developer API:

```typescript
// Exemplo de validação no backend
import { google } from 'googleapis';

async function verifySubscription(packageName: string, subscriptionId: string, purchaseToken: string) {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'path/to/service-account-key.json',
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  const androidPublisher = google.androidpublisher({ version: 'v3', auth });

  const response = await androidPublisher.purchases.subscriptions.get({
    packageName,
    subscriptionId,
    token: purchaseToken,
  });

  return response.data;
}
```

### Endpoints Necessários

1. **POST /api/subscriptions/verify**
   - Valida uma compra de assinatura
   - Retorna status da assinatura

2. **POST /api/subscriptions/webhook**
   - Recebe notificações do Google Play
   - Atualiza status das assinaturas no banco de dados

3. **GET /api/subscriptions/status**
   - Verifica status da assinatura do usuário
   - Retorna se está ativa, expirada, cancelada, etc.

## 🔐 Service Account (Conta de Serviço)

Para o backend se comunicar com a Google Play API:

1. Vá no [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto ou selecione o existente
3. Vá em **IAM & Admin** → **Service Accounts**
4. Crie uma conta de serviço
5. Gere uma chave JSON
6. No Play Console, vá em **Configuração** → **Acesso à API** → **Contas de serviço vinculadas**
7. Vincule a conta de serviço criada

## 📱 Implementação no App

### IDs dos Produtos

```typescript
const SUBSCRIPTION_SKUS = {
  MONTHLY: 'looton_premium_monthly',
  YEARLY: 'looton_premium_yearly',
};
```

### Uso no App

```typescript
import { SubscriptionService } from './src/services/SubscriptionService';
import { SubscriptionModal } from './src/components/SubscriptionModal';

// Verificar assinatura ativa
const { hasActiveSubscription, plan } = await SubscriptionService.checkActiveSubscriptions();

// Mostrar modal de assinatura
<SubscriptionModal visible={showModal} onClose={() => setShowModal(false)} />
```

## 🧪 Testes

### Teste com Licenças de Teste

1. Adicione sua conta Google nas licenças de teste (Play Console)
2. Instale o app no dispositivo com essa conta
3. Faça uma compra - será processada como teste
4. A compra será cancelada automaticamente após alguns minutos

### Teste em Produção (Track Fechado)

1. Publique o app em um track fechado/interno
2. Adicione testadores
3. Faça compras reais (serão cobradas normalmente)
4. Teste o fluxo completo de assinatura

## ⚠️ Importante

1. **Política de Cancelamento:** Os usuários podem cancelar a qualquer momento via Google Play
2. **Reembolsos:** Google Play gerencia reembolsos - você pode ver no console
3. **Renovação:** Assinaturas renovam automaticamente a menos que canceladas
4. **Grace Period:** Configure um período de tolerância para pagamentos falhos
5. **Hold Period:** Configure quanto tempo manter benefícios após falha de pagamento

## 🎯 Benefícios a Implementar

Recursos que o usuário premium deve ter acesso:

- ✅ Sem anúncios
- ✅ Alertas avançados de preços
- ✅ Listas de desejos ilimitadas
- ✅ Histórico completo de preços
- ✅ Acesso prioritário a ofertas exclusivas
- ✅ Novos recursos em primeira mão

## 📊 Métricas para Acompanhar

- Taxa de conversão (usuários que se inscrevem)
- Taxa de cancelamento (churn)
- Receita recorrente mensal (MRR)
- Valor do tempo de vida (LTV)
- Taxa de renovação

## 🔗 Links Úteis

- [Google Play Billing Documentation](https://developer.android.com/google/play/billing)
- [react-native-iap Documentation](https://github.com/dooboolab-community/react-native-iap)
- [Google Play Console](https://play.google.com/console)
- [Google Cloud Console](https://console.cloud.google.com/)
