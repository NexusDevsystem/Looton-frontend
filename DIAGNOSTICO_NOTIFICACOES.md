# 🔍 Diagnóstico: Notificações Diárias Não Funcionando

## ❌ Problema Encontrado

O app mobile estava tentando enviar o push token para `/users` mas **essa rota não existia** no backend!

## ✅ Solução Aplicada

1. **Criado arquivo:** `backend/src/routes/users.routes.ts`
   - Endpoint `POST /users` para registrar usuário e push token
   - Endpoint `GET /users/:userId` para consultar dados do usuário

2. **Registrado rota** em `backend/src/routes/index.ts`

3. **Criado endpoint de debug:** `GET /notifications/debug/notification-system`
   - Mostra todos os usuários registrados
   - Mostra quantos têm push token
   - Mostra histórico de notificações enviadas
   - Recomendações do que está faltando

## 🧪 Como Testar

### Passo 1: Reiniciar o Backend

```bash
cd C:\Looton\looton\backend
npm run dev
```

### Passo 2: Abrir o App no Emulador

Abra o app no emulador. Quando o app abrir, ele deve:
1. Obter o push token
2. Enviar para `POST /users` (agora existe!)
3. Registrar o usuário no sistema

### Passo 3: Verificar se o Usuário Foi Registrado

Acesse no navegador ou Postman:
```
GET http://localhost:3333/notifications/debug/notification-system
```

**Resultado esperado:**
```json
{
  "system": {
    "totalUsers": 1,
    "activeUsers": 1,
    "usersWithPushToken": 1
  },
  "users": {
    "activeWithTokens": [
      {
        "userId": "device-xxx",
        "pushToken": "ExponentPushToken[xxx]...",
        "lastActiveAt": "2025-11-05T...",
        "daysSinceActive": 0
      }
    ]
  },
  "recommendations": {
    "canSendNotifications": true,
    "issues": []
  }
}
```

### Passo 4: Testar Envio Manual de Notificação

```bash
curl -X POST http://localhost:3333/notifications/daily-offers/test
```

**OU** acesse no navegador:
```
POST http://localhost:3333/notifications/daily-offers/test
```

Você deve receber a notificação no emulador!

### Passo 5: Verificar Logs do Backend

No terminal do backend, você deve ver:
```
[DailyOfferJob] Iniciando envio de Oferta do Dia...
[DailyOfferJob] ✅ Oferta válida selecionada: [Nome do Jogo] - XX% OFF - R$ XX.XX
[DailyOfferJob] Enviando para 1 dispositivos...
[DailyOfferJob] ✅ Notificação enviada com sucesso!
```

## 🐛 Se Ainda Não Funcionar

### Debug 1: Verificar se o token está sendo enviado

Nos logs do backend, procure por:
```
[Users] Registrando usuário: device-xxxxx
[Users] Push token: ExponentPushToken[xxxxx]...
```

Se **NÃO** aparecer, o problema está no mobile (não está chamando a API).

### Debug 2: Verificar sistema completo

```bash
curl http://localhost:3333/notifications/debug/notification-system
```

Verifique:
- `system.totalUsers` deve ser > 0
- `system.usersWithPushToken` deve ser > 0
- `recommendations.canSendNotifications` deve ser `true`
- `recommendations.issues` deve estar vazio `[]`

### Debug 3: Testar com horário específico

Para testar em horários diferentes, edite temporariamente:

**Arquivo:** `backend/src/jobs/dailyOffer.job.ts`

```typescript
// TESTE: Trocar 12 e 18 para o horário atual + 1 minuto
cron.schedule('30 15 * * *', async () => {  // 15:30 por exemplo
  console.log('[DailyOfferJob] Trigger de TESTE - executando...');
  await runDailyOfferNotification();
}, {
  timezone: 'America/Sao_Paulo'
});
```

## 📱 Teste Completo de Ponta a Ponta

```bash
# Terminal 1: Backend
cd C:\Looton\looton\backend
npm run dev

# Terminal 2: Mobile
cd C:\Looton\looton\mobile
npx expo start --dev-client

# 1. Abrir app no emulador
# 2. Verificar logs do backend
# 3. Testar endpoint de debug
# 4. Enviar notificação manualmente
# 5. Verificar se chegou no emulador
```

## ✅ Checklist

- [ ] Backend rodando sem erros
- [ ] Mobile rodando no emulador
- [ ] App registrou usuário (ver logs do backend)
- [ ] Debug endpoint mostra usuário com token
- [ ] Teste manual de notificação funciona
- [ ] Notificação aparece no emulador

## 📝 Próximos Passos

Depois que confirmar que funciona:

1. **Deploy no Render** - As alterações precisam ir para produção
2. **Testar em produção** - Usar a URL do Render
3. **Ajustar horários** - Voltar para 12h e 18h se mudou
4. **Monitorar logs** - Verificar se notificações estão sendo enviadas

## 🔥 Comandos Úteis

```bash
# Ver usuários registrados
curl http://localhost:3333/notifications/debug/notification-system

# Ver estatísticas
curl http://localhost:3333/notifications/activity/stats

# Enviar notificação teste
curl -X POST http://localhost:3333/notifications/daily-offers/test

# Ver histórico
curl http://localhost:3333/notifications/daily-offers/history
```
