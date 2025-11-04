# ✅ CHECKLIST - DEPLOY COMPLETO RENDER + GOOGLE PLAY

## 🎯 Versão 1.7 - Sistema de Notificações Automáticas

---

## 📋 PARTE 1: BACKEND (RENDER)

### **1.1 - Variáveis de Ambiente no Render**

Acesse: https://dashboard.render.com → **looton-backend** → **Environment**

- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `API_BASE_URL=https://looton-backend.onrender.com` ⚠️ **CRÍTICO**
- [ ] `MONGODB_URI=mongodb+srv://Nexus:...` 
- [ ] `MONGODB_DBNAME=Looton`
- [ ] `USE_REDIS=true` ⚠️ **CRÍTICO**
- [ ] `REDIS_URL=redis://default:...` ⚠️ **CRÍTICO**
- [ ] `REDIS_REQUIRE_NOEVICTION=false`
- [ ] `USE_MOCK_ADAPTERS=false`
- [ ] `CURRENCY_BASE=BRL`
- [ ] `DEALS_REFRESH_CRON=*/20 * * * *`
- [ ] Todas as outras do arquivo `RENDER_CONFIG.md`

### **1.2 - Deploy Backend**

- [ ] Todas as variáveis configuradas
- [ ] Push código para GitHub
- [ ] Render faz deploy automaticamente
- [ ] Verificar logs: sem erros
- [ ] Testar: `https://looton-backend.onrender.com/deals`

### **1.3 - Verificar Jobs (Logs do Render)**

Deve aparecer no log:
```
[DailyOfferJob] Job iniciado - executará 3x por dia: 12h, 16:10h e 18h
[WatchedGamesJob] Job iniciado - executará A CADA 1 HORA
[Redis] ✅ Conectado ao Redis Cloud
[Favorites] ✅ Carregados favoritos de X usuários do Redis
```

- [ ] Jobs iniciaram corretamente
- [ ] Redis conectado
- [ ] Sem erros críticos

---

## 📱 PARTE 2: MOBILE (GOOGLE PLAY)

### **2.1 - Verificação Pré-Build**

- [ ] `app.json` → version: "1.7"
- [ ] `app.json` → versionCode: 7
- [ ] `package.json` → version: "1.7.0"
- [ ] `google-services.json` presente
- [ ] `eas.json` → production → buildType: "app-bundle"

### **2.2 - Gerar Build AAB**

```bash
cd C:\Looton\looton\mobile
eas build --platform android --profile production
```

- [ ] Build iniciou sem erros
- [ ] Aguardar conclusão (10-15min)
- [ ] Download do `.aab`

### **2.3 - Upload Google Play Store**

Acesse: https://play.google.com/console

- [ ] Produção → Criar nova versão
- [ ] Upload do arquivo `.aab`
- [ ] Notas de versão preenchidas
- [ ] Capturas de tela atualizadas (se necessário)
- [ ] Enviar para revisão

---

## 🔔 PARTE 3: NOTIFICAÇÕES (TESTE EM PRODUÇÃO)

### **3.1 - Configuração**

- [ ] Backend no Render rodando
- [ ] `API_BASE_URL` correto no Render
- [ ] Redis Cloud conectado
- [ ] App instalado em device físico

### **3.2 - Teste de Notificações**

#### **Opção 1: Aguardar horário automático**
- [ ] 12:00 - Oferta do Dia
- [ ] 16:10 - Oferta da Tarde
- [ ] 18:00 - Oferta da Noite
- [ ] A cada 1h - Jogos Favoritos (se houver)

#### **Opção 2: Teste imediato**
```bash
# Registrar push token
POST https://looton-backend.onrender.com/users
{
  "userId": "seu_device_id",
  "pushToken": "ExponentPushToken[xxx]"
}

# Enviar notificação de teste
POST https://looton-backend.onrender.com/test-notification-simple
{
  "token": "ExponentPushToken[xxx]"
}
```

- [ ] Notificação recebida no Android
- [ ] Apenas 1 notificação (sem duplicatas)
- [ ] Título e conteúdo corretos

---

## 📊 PARTE 4: FUNCIONALIDADES (QA)

### **4.1 - App Mobile**

- [ ] Login/Cadastro funciona
- [ ] Ofertas carregam
- [ ] Busca funciona
- [ ] Favoritos salvam/carregam
- [ ] AdMob exibe anúncios
- [ ] Notificações push funcionam
- [ ] Deep links funcionam

### **4.2 - Backend**

- [ ] API `/deals` retorna ofertas
- [ ] API `/users` registra tokens
- [ ] Redis persiste dados
- [ ] Jobs executam nos horários corretos
- [ ] Logs sem erros críticos

---

## 🎯 PARTE 5: MONITORAMENTO

### **5.1 - Render Dashboard**

- [ ] Verificar logs regularmente
- [ ] Verificar uso de CPU/Memória
- [ ] Verificar uptime

### **5.2 - Redis Cloud**

Acesse: https://app.redislabs.com

- [ ] Conexões ativas
- [ ] Uso de memória OK
- [ ] Sem erros de conexão

### **5.3 - Google Play Console**

- [ ] Crashes/ANRs baixos
- [ ] Avaliações/Reviews
- [ ] Downloads/Instalações

---

## 🚀 PARTE 6: PÓS-DEPLOY

### **6.1 - Comunicação**

- [ ] Avisar usuários sobre nova versão
- [ ] Destacar novidades (notificações)
- [ ] Solicitar feedback

### **6.2 - Monitoramento Inicial**

**Primeiras 24h:**
- [ ] Verificar logs de erro
- [ ] Verificar entrega de notificações
- [ ] Responder reviews negativos

**Primeira semana:**
- [ ] Analisar métricas de uso
- [ ] Verificar taxa de crash
- [ ] Ajustar horários se necessário

---

## 📝 NOTAS DE VERSÃO 1.7

### **✨ Novidades:**
- 🔔 **Notificações Automáticas de Ofertas**
  - Diariamente: 12h, 16:10h, 18h
  - Melhor oferta do dia com até 84% de desconto
  
- 🎮 **Sistema de Jogos Favoritos**
  - A cada 1 hora verifica promoções
  - Notifica quando detectar desconto
  - Lista de observação personalizada

- 💾 **Persistência de Dados**
  - Sistema com Redis Cloud
  - Favoritos salvos permanentemente
  - Histórico de notificações

- 🔥 **Melhorias de Performance**
  - Cache otimizado
  - Carregamento mais rápido
  - Menor consumo de dados

- 🐛 **Correções de Bugs**
  - Notificações duplicadas corrigidas
  - Melhor estabilidade geral

---

## ⚠️ TROUBLESHOOTING

### **Notificações não chegam:**
1. Verificar `API_BASE_URL` no Render
2. Verificar logs: jobs iniciaram?
3. Verificar Redis: conectado?
4. Testar endpoint `/test-notification`

### **Build AAB falha:**
1. Verificar `google-services.json`
2. Limpar cache: `eas build --clear-cache`
3. Verificar credenciais EAS

### **Backend com erros:**
1. Verificar todas variáveis de ambiente
2. Verificar MongoDB conectado
3. Verificar Redis Cloud ativo
4. Ver logs do Render

---

## ✅ DEPLOY COMPLETO!

Quando todos os checkboxes estiverem marcados:

🎉 **PARABÉNS!** Sistema completo em produção!

**Versão:** 1.7  
**Build:** 7  
**Status:** 🟢 Live

---

**Documentação criada em:** 04/11/2025  
**Próxima versão:** 1.8 (a definir)
