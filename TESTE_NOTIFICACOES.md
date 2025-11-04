# 📱 Guia: Como Testar Notificações Push no Celular

## 🎯 Objetivo
Enviar notificações push do backend para seu celular e vê-las chegando em tempo real.

---

## 📋 Pré-requisitos

1. ✅ Celular Android com o app Looton instalado
2. ✅ App compilado com suporte a notificações push
3. ✅ Backend rodando localmente (ou em servidor acessível)
4. ✅ Celular e computador na mesma rede (se backend for local)

---

## 🚀 Passo a Passo

### Método 1: Usando a Tela de Debug (Recomendado)

#### 1. No App Mobile

1. Abra o app Looton no seu celular
2. Navegue para: **Debug → Push Token**
   - Se não houver essa tela, adicione ao menu de navegação
3. Você verá uma tela com:
   - ✅ Status da permissão
   - 📱 Seu Push Token
   - 🆔 Seu Device ID
4. **Toque no Push Token** para copiá-lo

#### 2. No Computador

1. Abra o terminal PowerShell
2. Execute:

```powershell
cd c:\Looton\looton\backend
npx tsx test-push.js ExponentPushToken[COLE_SEU_TOKEN_AQUI]
```

3. Você verá:

```
📱 Teste de Notificação Push

✅ Token válido: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]...

📤 Enviando 4 notificações de teste...

1. Enviando: 🎯 Teste: Preço Desejado Alcançado!
   ✅ Enviada com sucesso!
   ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

2. Enviando: 💰 Teste: Preço Caiu!
   ✅ Enviada com sucesso!
   ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

3. Enviando: 🔥 Teste: Novo Desconto!
   ✅ Enviada com sucesso!
   ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

4. Enviando: 🎮 Teste: Oferta do Dia!
   ✅ Enviada com sucesso!
   ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

✅ Teste concluído!

📱 Verifique seu celular agora!
```

#### 3. No Celular

**As notificações devem aparecer:**
- ✅ Mesmo com o app **fechado**
- ✅ Com som e vibração
- ✅ Na barra de notificações
- ✅ Com os ícones corretos (🎯💰🔥🎮)

---

### Método 2: Obtendo o Token Manualmente

Se não conseguir acessar a tela de debug:

#### 1. Via Logs do Metro

1. Abra o app no celular
2. No terminal do Metro (onde você rodou `npm start`), procure por:

```
[notifications.ts] Push Token: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```

#### 2. Via Console

1. Adicione este código temporariamente em `App.tsx`:

```typescript
import * as Notifications from 'expo-notifications';

// Dentro do useEffect inicial
const token = await Notifications.getExpoPushTokenAsync();
console.log('🔔 PUSH TOKEN:', token.data);
```

2. Abra o app e copie o token dos logs

---

## 🧪 Testando Diferentes Tipos de Notificação

O script `test-push.js` envia 4 tipos de notificação:

### 1. 🎯 Preço Desejado Alcançado
```
Título: "🎯 Teste: Preço Desejado Alcançado!"
Corpo: "God of War agora está por R$ 89.99!"
```

### 2. 💰 Queda de Preço
```
Título: "💰 Teste: Preço Caiu!"
Corpo: "Elden Ring de R$ 199.99 → R$ 139.99 (-30%)"
```

### 3. 🔥 Novo Desconto
```
Título: "🔥 Teste: Novo Desconto!"
Corpo: "Cyberpunk 2077 agora com 60% OFF - R$ 79.99"
```

### 4. 🎮 Oferta do Dia
```
Título: "🎮 Teste: Oferta do Dia!"
Corpo: "Red Dead Redemption 2 - 70% OFF por R$ 59.99"
```

---

## ❓ Troubleshooting

### ❌ "Token inválido"

**Problema**: O token não começa com `ExponentPushToken[`

**Solução**:
- Verifique se copiou o token completo
- Token deve ter formato: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`
- Não adicione espaços ou quebras de linha

---

### ❌ Notificações não chegam

**Possíveis causas**:

1. **Permissões não concedidas**
   - Vá em: Configurações do Android → Apps → Looton → Notificações
   - Habilite todas as permissões

2. **App não está registrado**
   - O app precisa ter sido aberto pelo menos uma vez
   - O código de registro de push token precisa ter executado

3. **Token expirado**
   - Tokens do Expo podem expirar
   - Feche e abra o app novamente para gerar novo token

4. **Expo Push Notification Service fora do ar**
   - Verifique: https://status.expo.dev/

5. **Firewall/Rede**
   - Celular precisa estar conectado à internet
   - Tente com WiFi e dados móveis

---

### ❌ "DeviceNotRegistered"

**Problema**: Token foi invalidado pelo Google/Apple

**Solução**:
1. Desinstale o app completamente
2. Reinstale
3. Abra e conceda permissões
4. Obtenha novo token
5. Teste novamente

---

### ✅ Notificação enviada mas não aparece

**Possíveis causas**:

1. **"Não perturbe" ativado**
   - Desative modo "Não perturbe" no Android

2. **App em primeiro plano**
   - Algumas notificações só aparecem com app em background
   - Feche ou minimize o app e teste novamente

3. **Canal de notificação desabilitado**
   - Android Settings → Apps → Looton → Notifications
   - Verifique se os canais estão ativos:
     - `watched-games`
     - `daily-offers`

---

## 🎨 Personalizando o Teste

Você pode editar `test-push.js` para customizar as notificações:

```javascript
const messages = [
  {
    to: pushToken,
    sound: 'default',
    title: 'SEU TÍTULO AQUI',
    body: 'SUA MENSAGEM AQUI',
    data: {
      type: 'watched_game',
      gameId: '12345',
      // ... outros dados
    },
    priority: 'high',
    channelId: 'watched-games',
  }
];
```

---

## 📊 Verificando Receipts (Confirmações)

Após enviar, o Expo retorna um **ticket ID**. Para verificar se foi entregue:

```javascript
// Adicione isto ao script test-push.js após enviar
const receiptIds = tickets.map(ticket => ticket.id);

// Aguarde alguns segundos
await new Promise(resolve => setTimeout(resolve, 5000));

// Busque os receipts
const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
for (const chunk of receiptIdChunks) {
  const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
  console.log('Receipts:', receipts);
}
```

---

## 🔄 Testando o Sistema Completo (Watched Games)

Para testar o fluxo completo do sistema de jogos vigiados:

### 1. Registrar Usuário e Favorito

```bash
# No PowerShell
cd c:\Looton\looton\backend
npx tsx test-watched-games.js
```

### 2. Verificar Logs

```
1️⃣ Registrando usuário de teste...
✅ Usuário registrado
2️⃣ Adicionando jogo aos favoritos...
✅ Favorito adicionado
...
```

### 3. Aguardar Job Automático

O job roda automaticamente a cada 6 horas.

**OU** execute manualmente:

```bash
curl -X POST http://localhost:3000/debug/test-watched-games
```

### 4. Verificar Notificação

Deve chegar no celular com informações reais do jogo!

---

## 📝 Logs Úteis

### No Backend

```
[WatchedGamesJob] 🎮 Iniciando verificação de jogos vigiados...
[WatchedGamesJob] Verificando 1 usuários ativos...
[WatchedGamesJob] ✅ Notificação enviada: God of War
[WatchedGamesJob] ✅ Concluído! Notificações enviadas: 1
```

### No Mobile

```
[notifications.ts] Notification received: {
  type: 'watched_game',
  gameId: '12345',
  notificationType: 'price_drop'
}
```

---

## ✅ Checklist de Teste

- [ ] App instalado no celular
- [ ] Permissões de notificação concedidas
- [ ] Push token obtido
- [ ] Script test-push.js executado com sucesso
- [ ] 4 notificações recebidas no celular
- [ ] Notificações aparecem com app fechado
- [ ] Som e vibração funcionando
- [ ] Ao tocar na notificação, app abre
- [ ] Dados corretos na notificação

---

## 🎉 Sucesso!

Se você:
- ✅ Recebeu as 4 notificações de teste
- ✅ Elas aparecem com app fechado
- ✅ Som e layout estão corretos

**Parabéns! Seu sistema de notificações está 100% funcional!** 🚀

Agora o backend pode enviar notificações reais para todos os usuários automaticamente!

---

## 📚 Próximos Passos

1. ✅ Configurar notificações em produção (EAS)
2. ✅ Adicionar analytics (taxa de abertura)
3. ✅ Implementar preferências de usuário (horários, tipos)
4. ✅ Dashboard de monitoramento
5. ✅ A/B testing de mensagens

---

**Data**: Novembro 2025
**Versão**: 1.0
**Status**: Testado e Funcional ✅
