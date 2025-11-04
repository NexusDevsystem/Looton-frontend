# 📦 Guia de Build - Looton App v1.7

## 🎯 Gerar Build AAB para Google Play Store

### **Pré-requisitos:**

1. ✅ Conta EAS configurada (`eas login`)
2. ✅ Projeto configurado (`eas build:configure`)
3. ✅ Google Services configurado (`google-services.json`)

---

## 🚀 COMANDOS PARA GERAR BUILD

### **1️⃣ Build AAB (Para Google Play Store)**

```bash
cd C:\Looton\looton\mobile
eas build --platform android --profile production
```

**O que gera:**
- ✅ Arquivo `.aab` (Android App Bundle)
- ✅ Otimizado para Google Play Store
- ✅ Tamanho menor (Google gera APKs otimizados)
- ✅ Versão: **1.7** / **versionCode: 7**

---

### **2️⃣ Build APK (Para testes/distribuição direta)**

```bash
cd C:\Looton\looton\mobile
eas build --platform android --profile production-apk
```

**O que gera:**
- ✅ Arquivo `.apk` (instalável diretamente)
- ✅ Para testes ou distribuição fora da Play Store
- ✅ Versão: **1.7** / **versionCode: 7**

---

### **3️⃣ Build Preview (Para testes internos)**

```bash
cd C:\Looton\looton\mobile
eas build --platform android --profile preview
```

**O que gera:**
- ✅ APK de preview/teste
- ✅ Mesmo código de produção
- ✅ Para QA/testes antes do lançamento

---

## 📋 Checklist Antes de Buildar:

- [x] **Versão atualizada** (app.json: version 1.7, versionCode 7)
- [x] **google-services.json** presente
- [x] **API_URL configurada** (https://looton-backend.onrender.com)
- [x] **Notificações testadas** ✅
- [x] **Redis Cloud conectado** ✅
- [ ] **Testar app em device físico**
- [ ] **Verificar permissões no AndroidManifest**

---

## 🎯 Fluxo Completo de Deploy:

### **Passo 1: Build AAB**
```bash
cd C:\Looton\looton\mobile
eas build --platform android --profile production
```

### **Passo 2: Aguardar Build**
- EAS vai buildar na nuvem
- Tempo médio: 10-15 minutos
- Você receberá um link quando terminar

### **Passo 3: Download**
- Acesse o link fornecido
- Baixe o arquivo `.aab`

### **Passo 4: Upload na Play Store**
1. Acesse: https://play.google.com/console
2. Vá em: **Produção** → **Criar nova versão**
3. Faça upload do `.aab`
4. Preencha as notas de versão
5. Enviar para revisão

---

## 🔧 Configuração Atual (eas.json):

### **production** (AAB - Google Play)
```json
{
  "buildType": "app-bundle",
  "autoIncrement": false,
  "channel": "production"
}
```

### **production-apk** (APK - Distribuição Direta)
```json
{
  "buildType": "apk",
  "autoIncrement": false,
  "channel": "production"
}
```

---

## 📊 Informações da Build:

| Campo | Valor |
|-------|-------|
| **App Name** | Looton |
| **Package** | com.nexusdevsystem.looton |
| **Version** | 1.7 |
| **Version Code** | 7 |
| **Target SDK** | 35 |
| **Backend URL** | https://looton-backend.onrender.com |

---

## 🐛 Troubleshooting:

### **Erro: "Build failed"**
```bash
# Limpar cache e tentar novamente
eas build:cancel
eas build --platform android --profile production --clear-cache
```

### **Erro: "Invalid google-services.json"**
- Verificar se o arquivo está na raiz do mobile
- Baixar novamente do Firebase Console

### **Erro: "Version code already exists"**
- Incrementar versionCode no `app.json`
- Ou ativar `autoIncrement: true` no eas.json

---

## ✅ Após a Build:

1. **Testar o AAB:**
   - Fazer upload interno na Play Store
   - Testar via Internal Testing

2. **Verificar funcionalidades:**
   - ✅ Notificações push
   - ✅ AdMob
   - ✅ Conexão com backend
   - ✅ Favoritos/Jogos vigiados

3. **Deploy:**
   - Promover para produção
   - Aguardar revisão do Google (2-7 dias)

---

## 📝 Notas de Versão 1.7:

**Novidades:**
- 🔔 Sistema de notificações automáticas (12h, 16:10h, 18h)
- 🎮 Notificações de jogos favoritos (a cada 1 hora)
- 💾 Persistência com Redis Cloud
- 🔥 Melhorias de performance
- 🐛 Correções de bugs

---

## 🚀 Quick Start:

```bash
# 1. Login no EAS
eas login

# 2. Gerar build AAB
cd C:\Looton\looton\mobile
eas build --platform android --profile production

# 3. Aguardar e baixar
# Link será fornecido quando terminar

# 4. Upload na Google Play Store
# play.google.com/console
```

---

**Pronto para buildar!** 🎉
