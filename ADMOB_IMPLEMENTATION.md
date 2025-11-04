# Implementação do Google AdMob

## 📋 Visão Geral

Sistema de monetização através de banners do Google AdMob integrado ao app Looton.

## 🔑 Credenciais

### App ID
- **Android/iOS**: `ca-app-pub-2976862302591431~7964761364`

### Banner Ad Unit ID
- **Android/iOS**: `ca-app-pub-2976862302591431/5778912653`

## 📱 Localização do Banner

### Posicionamento
- **Localização**: Topo da tela, acima do logo "Looton"
- **Abas com banner**: 
  - ✅ Home (Ofertas)
  - ✅ Search (Busca)
  - ✅ Favorites (Favoritos)
  - ✅ Wishlist (Lista de Desejos)
  - ✅ Hardware
- **Abas sem banner**:
  - ❌ Profile (Configurações)

### Layout
```
┌────────────────────────────────┐
│     [BANNER ADMOB 320x50]      │  ← Banner AdMob
├────────────────────────────────┤
│ [Logo] Looton            [🔔]  │  ← Header do app
│        Ofertas do Dia          │
└────────────────────────────────┘
```

## 🏗️ Estrutura de Arquivos

### 1. Componente do Banner
**Arquivo**: `src/components/AdBanner.tsx`

```typescript
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

export const AdBanner: React.FC = () => {
  return (
    <View style={{ 
      width: '100%', 
      alignItems: 'center',
      backgroundColor: '#111827',
      paddingVertical: 4,
    }}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
      />
    </View>
  );
};
```

### 2. Configuração no app.json

```json
{
  "expo": {
    "android": {
      "googleMobileAdsAppId": "ca-app-pub-2976862302591431~7964761364"
    },
    "ios": {
      "googleMobileAdsAppId": "ca-app-pub-2976862302591431~7964761364"
    },
    "plugins": [
      "react-native-google-mobile-ads"
    ]
  }
}
```

### 3. Integração no App Principal
**Arquivo**: `app/index.tsx`

```typescript
import { AdBanner } from '../src/components/AdBanner';

// Renderizar banner em todas as abas exceto 'profile'
{activeTab !== 'profile' && (
  <View style={{ paddingTop: 40 }}>
    <AdBanner />
  </View>
)}
```

## 📦 Dependências Instaladas

```json
{
  "dependencies": {
    "expo-ads-admob": "latest",
    "react-native-google-mobile-ads": "latest"
  }
}
```

## 🎨 Especificações de Design

### Tamanho do Banner
- **Tipo**: BANNER (320x50)
- **Responsivo**: Sim
- **Cor de fundo**: `#111827` (dark gray)
- **Padding vertical**: 4px

### Espaçamento
- **Padding superior**: 40px (abaixo da status bar)
- **Separação do header**: 10px

## 🔧 Configurações

### Modo de Desenvolvimento
Para testar durante desenvolvimento, use:

```typescript
const BANNER_AD_UNIT_ID = TestIds.BANNER;
```

### Modo de Produção
Para produção, use os IDs reais:

```typescript
const BANNER_AD_UNIT_ID = 'ca-app-pub-2976862302591431/5778912653';
```

## 📊 Eventos de Anúncio

### Eventos Monitorados
1. **onAdLoaded**: Banner carregado com sucesso
2. **onAdFailedToLoad**: Falha ao carregar banner (com log de erro)

### Logs
```typescript
onAdLoaded={() => {
  console.log('Banner ad loaded successfully');
}}

onAdFailedToLoad={(error) => {
  console.log('Banner ad failed to load:', error);
}}
```

## 🚀 Build e Deploy

### Rebuild Necessário
Após adicionar o AdMob, é necessário rebuild do app:

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios

# EAS Build
eas build --platform android
eas build --platform ios
```

### Configuração de Permissões
As permissões necessárias já estão configuradas no `app.json`:
- ✅ INTERNET
- ✅ ACCESS_NETWORK_STATE

## ⚙️ Opções de Anúncio

### Request Options
```typescript
requestOptions={{
  requestNonPersonalizedAdsOnly: false,  // Permite anúncios personalizados
}}
```

### Anúncios Não Personalizados
Para conformidade com GDPR/LGPD, pode-se definir:
```typescript
requestNonPersonalizedAdsOnly: true
```

## 📈 Métricas e Analytics

### Acompanhamento
- **Console do AdMob**: https://apps.admob.com/
- **Métricas**: Impressões, CTR, RPM, Receita
- **Filtros**: Por país, dispositivo, versão do app

## 🐛 Troubleshooting

### Banner não aparece
1. Verificar se o App ID está correto no `app.json`
2. Confirmar rebuild após adicionar plugin
3. Aguardar aprovação do AdMob (novos apps podem levar até 24h)
4. Verificar logs de erro no console

### Banner mostra "Test Ad"
- Normal durante desenvolvimento
- Use o Test ID durante testes
- Em produção, use o ID real do AdMob

### Banner aparece cortado
- Verificar `width: '100%'` no container
- Confirmar `alignItems: 'center'`
- Validar espaçamento do SafeAreaView

## ✅ Checklist de Implementação

- [x] Instalar dependências (expo-ads-admob, react-native-google-mobile-ads)
- [x] Adicionar App ID no app.json (Android e iOS)
- [x] Adicionar plugin no app.json
- [x] Criar componente AdBanner
- [x] Integrar banner no app principal
- [x] Configurar visibilidade por aba (excluir Profile)
- [x] Adicionar logs de debug
- [x] Testar layout e responsividade
- [ ] Rebuild do app nativo
- [ ] Testar em dispositivo físico
- [ ] Validar no console do AdMob

## 📝 Notas Importantes

1. **Primeira Execução**: Banners de teste aparecem imediatamente, mas banners reais podem levar alguns minutos
2. **Aprovação**: Novos apps precisam ser aprovados pelo AdMob (pode levar 24-48h)
3. **Políticas**: Seguir as políticas do AdMob para evitar suspensão
4. **Taxa de Impressão**: Não forçar cliques ou impressões artificiais
5. **UX**: Banner não deve interferir na usabilidade do app

## 🔗 Links Úteis

- **AdMob Console**: https://apps.admob.com/
- **Documentação React Native Google Mobile Ads**: https://docs.page/invertase/react-native-google-mobile-ads
- **Expo AdMob Docs**: https://docs.expo.dev/versions/latest/sdk/admob/
- **Políticas do AdMob**: https://support.google.com/admob/answer/6128543

## 🎯 Próximos Passos

### Melhorias Futuras
1. **Anúncios Intersticiais**: Entre navegações
2. **Anúncios Rewarded**: Para desbloquear features premium
3. **Native Ads**: Integrados ao feed de ofertas
4. **A/B Testing**: Testar diferentes posições do banner
5. **Mediation**: Adicionar outras redes de anúncios (Facebook, Unity)

### Otimizações
- Implementar lazy loading do banner
- Adicionar refresh automático (conforme políticas)
- Criar variantes de tamanho (LARGE_BANNER, MEDIUM_RECTANGLE)
- Implementar fallback para quando não há anúncios disponíveis
