# Premium Features - Roadmap

## Status Atual (v1.7)

### ✅ Implementado
- `react-native-iap` v12.15.4 instalado e configurado
- Google Play Billing integrado (flavor: 'play')
- Código de assinatura completo em `SubscriptionService.ts`
- SKUs definidos:
  - `looton_premium_monthly` - Assinatura mensal
  - `looton_premium_yearly` - Assinatura anual

### 🔄 Temporariamente Desabilitado
- **Modal Premium** (`ProModal`) - Comentado em `app/index.tsx` linha ~2359
- **Limite de jogos vigiados** - Alterado de 5 para 999 em `WishlistService.ts`
- **Renderização do modal** - Comentado em `app/index.tsx` linha ~3258

## Próximos Passos

### 1. Configurar Produtos no Google Play Console
1. Acesse: **Google Play Console** > **Monetizar com o Google Play** > **Produtos** > **Assinaturas**
2. Clique em "**Criar assinatura**"
3. Configure os produtos:

#### Produto 1: Mensal
- **ID do produto**: `looton_premium_monthly`
- **Nome**: Looton Premium - Mensal
- **Descrição**: Acesso ilimitado a todos os recursos premium
- **Preço**: R$ 9,90/mês (ou valor desejado)
- **Período de assinatura**: 1 mês
- **Renovação automática**: Sim

#### Produto 2: Anual
- **ID do produto**: `looton_premium_yearly`
- **Nome**: Looton Premium - Anual
- **Descrição**: Acesso ilimitado a todos os recursos premium (economize 40%)
- **Preço**: R$ 69,90/ano (ou valor desejado)
- **Período de assinatura**: 1 ano
- **Renovação automática**: Sim

### 2. Ativar Features Premium

#### 2.1 Descomentar Modal Pro
Em `app/index.tsx` linha ~2359:
```tsx
// Remover o /* */ que está comentando o componente ProModal
const ProModal = () => (
  <Modal visible={showProModal} ...>
    ...
  </Modal>
)
```

#### 2.2 Descomentar Renderização
Em `app/index.tsx` linha ~3258:
```tsx
{/* Descomentar esta linha: */}
<ProModal />
```

#### 2.3 Restaurar Limite de Jogos (Opcional)
Em `src/services/WishlistService.ts` linha ~17:
```tsx
// Alterar de 999 para 5 (ou outro valor desejado)
const FREE_TIER_LIMIT = 5; // Limite de jogos vigiados para usuários gratuitos
```

### 3. Testar Assinaturas

1. Criar conta de teste no Google Play Console
2. Adicionar testadores em **Testes internos**
3. Fazer upload de nova versão (1.8+) com modal descomentado
4. Testar fluxo completo de assinatura
5. Verificar `SubscriptionService.isPremium()` funciona corretamente

## Recursos Premium Planejados

### Funcionalidades que serão desbloqueadas:
- ✅ **Jogos vigiados ilimitados** (vs 5 gratuitos)
- ✅ **Sem anúncios** (InterstitialAds desabilitado)
- 🔜 **Notificações prioritárias** (mais frequentes)
- 🔜 **Histórico de preços** (gráficos)
- 🔜 **Comparador de lojas** (multi-store)
- 🔜 **Alertas personalizados** (desconto mínimo customizado)

## Arquivos Relacionados

### Código de Assinatura
- `src/services/SubscriptionService.ts` - Serviço principal de IAP
- `android/app/build.gradle` - Configuração gradle (linha 100)

### UI/UX
- `app/index.tsx` - Modal Premium (comentado)
- `src/services/WishlistService.ts` - Limite de jogos

### Configuração
- `package.json` - react-native-iap@^12.15.4

## Notas Importantes

⚠️ **NÃO remover** `react-native-iap` antes de configurar assinaturas no Play Console
⚠️ **Manter** código comentado (não deletar) para facilitar ativação futura
✅ **App funcionando normalmente** sem features premium por enquanto
✅ **Build AAB** compilando corretamente com Google Play Billing integrado

---

**Última atualização**: 2025-11-04  
**Versão**: 1.7  
**Status**: Pronto para configurar assinaturas no Google Play Console
