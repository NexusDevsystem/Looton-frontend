Looton Mobile

Uma aplicação mobile (Expo + React Native + TypeScript) que lista ofertas de jogos, permite favoritar, criar listas e receber alertas de preços. Este repositório contém a versão mobile do projeto.

Resumo
- Plataforma: Expo (React Native)
- Linguagem: TypeScript
- Principais features: busca de jogos, lista de favoritos, listas personalizadas, notificações de ofertas, integração com APIs de lojas (Steam). Epic Games temporariamente desativada para melhorias.

Como rodar (desenvolvimento)
1. Instale dependências:
   npm install
2. Inicie o Metro/Expo:
   npx expo start
3. Use o Expo Go no seu dispositivo ou um emulador para abrir o projeto.

Notas de deploy
- Este branch foi empurrado automaticamente como `publish-mobile-2025-10-01` para revisão.
- Recomendo revisar arquivos grandes como `node_modules` e `dist`  não devem ser enviados para o repositório. Se estiverem presentes, devemos limpar e adicionar entradas adequadas ao `.gitignore` antes de mesclar no `main`.

Publicação na Play Store (Android)
1) Pré-requisitos
- Conta no Google Play Console e um App criado (package: `com.nexusdevsystem.looton`).
- Service Account JSON (salve como `mobile/play-console-service-account.json`) com acesso ao app no Play Console.
- API do backend acessível publicamente e EXPO_PUBLIC_API_URL definido (não usar localhost).

2) Configuração do app (app.json)
- `expo.android.package`: com.nexusdevsystem.looton
- `expo.version` e `expo.android.versionCode`: incremente a cada release.
- Ícones e splash em `assets/images/`.

3) Builds com EAS
- Login: `npx expo login` e `npx eas login` (opcional se já logado)
- Produção (AAB para Play Store): `npx eas build -p android --profile production`
- Preview (APK para testes rápidos): `npx eas build -p android --profile preview`

4) Submeter ao Play Console
- `npx eas submit -p android --profile production`
- Track configurada para `internal` em `eas.json`. Ajuste para `beta`/`production` quando quiser promover.

5) Notificações (opcional)
- Se for usar notificações, mantenha o plugin `expo-notifications` e o `POST_NOTIFICATIONS` no Android 13+.
- Configure o Firebase (`google-services.json`) se for necessário para outras features.

6) Dicas
- Defina `EXPO_PUBLIC_API_URL` no perfil de build do EAS (ou em `eas.json`) apontando para sua API.
- Teste em dispositivos reais via APK de preview antes de enviar o AAB.
- Ao atualizar, incremente `versionCode` e `version`.

Contribuição
- Abra um Pull Request para mesclar este branch em `main`.
- Considere adicionar CI para builds e testes antes de mesclar.
