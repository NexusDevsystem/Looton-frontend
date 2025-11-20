# Configuração da URL do Backend no Render e Desenvolvimento Local

Este documento descreve como configurar a URL do backend hospedado no Render para funcionar corretamente com o APK de produção do aplicativo mobile Looton, e também como desenvolver localmente.

## Problema

Quando o APK de produção é gerado usando EAS Build, a variável de ambiente `EXPO_PUBLIC_API_URL` deve estar corretamente configurada para apontar para a URL do seu backend hospedado no Render. Caso contrário, o aplicativo mostrará erros de "Network error" ou "Erro ao carregar ofertas".

## Solução para Produção

1. **Obtenha a URL do seu backend no Render**
   - Acesse sua conta no Render
   - Localize o serviço do seu backend
   - Copie a URL pública do serviço (geralmente algo como `https://seu-projeto.onrender.com`)

2. **Atualize o arquivo `eas.json`**
   - Abra o arquivo `looton/mobile/eas.json`
   - A configuração de produção já está definida:
   
   ```json
   "production": {
     "channel": "production",
     "android": {
       "buildType": "apk"
     },
     "env": {
       "EXPO_PUBLIC_API_URL": "https://looton-backend.onrender.com"  // Esta é a URL real do seu backend
     }
   }
   ```

3. **Faça uma nova build de produção**
   - Execute o comando:
   ```bash
   cd looton/mobile
   eas build --profile production --platform android
   ```

## Solução para Desenvolvimento Local

Para desenvolver localmente com o backend rodando em sua máquina:

1. **Configure seu backend local**
   - Certifique-se de que seu backend está rodando localmente na porta 3000
   - A URL padrão será `http://localhost:3000`

2. **Execute o aplicativo em modo de desenvolvimento**
   - Execute o comando:
   ```bash
   cd looton/mobile
   npx expo start
   ```
   
   O aplicativo irá automaticamente detectar o host local e usar `http://localhost:3000` para o backend.

3. **Opcional: Configurar uma URL de desenvolvimento específica**
   - Se quiser usar uma URL específica para desenvolvimento, você pode definir uma variável de ambiente:
   ```bash
   EXPO_PUBLIC_API_URL_DEV=http://seu-ip-local:3000 npx expo start
   ```

## Importante

- A URL do backend para produção deve usar HTTPS (não HTTP) para funcionar corretamente em APKs de produção
- Para desenvolvimento local, o protocolo HTTP com localhost é aceitável
- Certifique-se de que o backend no Render está configurado corretamente para aceitar requisições CORS dos aplicativos mobile
- O backend deve estar acessível publicamente na internet para produção

## Teste

**Para Produção:**
Após instalar o APK de produção no dispositivo:
1. O aplicativo deve carregar as ofertas corretamente
2. Não deve exibir mensagens de "Network error" ou "Erro ao carregar ofertas"
3. Todas as funcionalidades que dependem da API devem funcionar corretamente

**Para Desenvolvimento Local:**
1. O aplicativo deve carregar as ofertas do seu backend local
2. As funcionalidades devem se comportar da mesma forma que em produção

## Solução de problemas

Se ainda ocorrerem problemas:

1. Verifique se a URL do backend está acessível via navegador
2. Confirme que o backend está respondendo corretamente (use ferramentas como Postman ou curl)
3. Verifique os logs do Render (para produção) ou do seu servidor local (para desenvolvimento)
4. Certifique-se de que as variáveis de ambiente obrigatórias estão configuradas no serviço do Render
5. Se estiver com problemas de conexão local, verifique se o firewall do seu sistema permite conexões de entrada na porta 3000