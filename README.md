Looton Mobile

Uma aplicação mobile (Expo + React Native + TypeScript) que lista ofertas de jogos, permite favoritar, criar listas e receber alertas de preços. Este repositório contém a versão mobile do projeto.

Resumo
- Plataforma: Expo (React Native)
- Linguagem: TypeScript
- Principais features: busca de jogos, lista de favoritos, listas personalizadas, notificações de ofertas, integração com APIs de lojas (Steam, Epic, GOG).

Como rodar (desenvolvimento)
1. Instale dependências:
   npm install
2. Inicie o Metro/Expo:
   npx expo start
3. Use o Expo Go no seu dispositivo ou um emulador para abrir o projeto.

Notas de deploy
- Este branch foi empurrado automaticamente como `publish-mobile-2025-10-01` para revisão.
- Recomendo revisar arquivos grandes como `node_modules` e `dist`  não devem ser enviados para o repositório. Se estiverem presentes, devemos limpar e adicionar entradas adequadas ao `.gitignore` antes de mesclar no `main`.

Contribuição
- Abra um Pull Request para mesclar este branch em `main`.
- Considere adicionar CI para builds e testes antes de mesclar.
