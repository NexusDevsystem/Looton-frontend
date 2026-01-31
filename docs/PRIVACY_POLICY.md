# Política de Privacidade - Looton

**Última atualização:** 29 de outubro de 2025

## 1. Introdução

A presente Política de Privacidade estabelece os termos e condições de tratamento de dados pessoais pelo aplicativo Looton ("Aplicativo"), desenvolvido e operado pela NexusDevSystem ("Desenvolvedor", "nós" ou "nosso"). Este documento é elaborado em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD) e demais legislações brasileiras aplicáveis.

Ao utilizar o Looton, você ("Usuário" ou "você") concorda com os termos descritos nesta Política de Privacidade. Caso não concorde com qualquer disposição aqui contida, recomendamos que interrompa imediatamente o uso do Aplicativo.

## 2. Dados Coletados e Finalidades

### 2.1 Token de Notificação Push

**Dados coletados:** Token único gerado pelo Firebase Cloud Messaging (FCM) e Expo Push Notification Service.

**Finalidade:** Envio de notificações push sobre:
- Ofertas diárias selecionadas (enviadas às 12h)
- Alterações de preço em jogos adicionados à lista de observação
- Lembretes de reengajamento após 2 dias de inatividade

**Base legal:** Consentimento do usuário ao aceitar o recebimento de notificações durante a configuração inicial do Aplicativo.

**Armazenamento:** Os tokens são armazenados temporariamente em memória no servidor backend por até 24 horas. Localmente no dispositivo, são mantidos indefinidamente no AsyncStorage para fins de gerenciamento de notificações.

**Compartilhamento:** Os tokens são compartilhados exclusivamente com Firebase Cloud Messaging (Google) e Expo Push Notification Service para viabilizar o envio de notificações.

### 2.2 Registro de Atividade do Usuário

**Dados coletados:** Timestamps (carimbos de data/hora) das interações do usuário com o Aplicativo.

**Finalidade:** Identificar períodos de inatividade superiores a 2 dias para envio de notificações de reengajamento personalizadas.

**Base legal:** Legítimo interesse do Desenvolvedor em melhorar a experiência do usuário e manter o engajamento com o Aplicativo.

**Armazenamento:** Os dados de atividade são armazenados em cache de memória no servidor backend com tempo de vida (TTL) de 24 horas. Não há persistência em banco de dados permanente.

### 2.3 Listas e Preferências Locais

**Dados coletados:** 
- Jogos adicionados às listas de favoritos
- Jogos marcados para observação de preço
- Listas personalizadas criadas pelo usuário
- Preferências de interface (tema escuro/claro)

**Finalidade:** Personalizar a experiência do usuário e permitir acesso rápido aos conteúdos de interesse.

**Base legal:** Consentimento implícito ao utilizar as funcionalidades de personalização do Aplicativo.

**Armazenamento:** Todos esses dados são armazenados exclusivamente no dispositivo do usuário através do AsyncStorage. Não são transmitidos, sincronizados ou armazenados em servidores externos.

**Compartilhamento:** Nenhum. Os dados permanecem exclusivamente no dispositivo do usuário.

### 2.4 Dados de Navegação e Uso

**Dados coletados:** O Aplicativo não coleta logs de navegação, histórico de buscas ou métricas analíticas de comportamento do usuário.

**Observação:** Futuramente, poderemos implementar análise de uso através de serviços terceiros (como Google Analytics ou Firebase Analytics). Em caso de implementação, esta Política de Privacidade será atualizada previamente.

## 3. Cookies e Tecnologias Similares

O Looton não utiliza cookies, web beacons ou tecnologias de rastreamento em navegadores. O armazenamento local de dados é realizado exclusivamente através do AsyncStorage (React Native), que mantém dados estruturados no dispositivo do usuário sem transmissão automática para servidores.

## 4. Publicidade e Serviços de Terceiros

### 4.1 Google AdMob

O Aplicativo exibe anúncios publicitários através do Google AdMob. Este serviço pode coletar informações do dispositivo para personalização de anúncios, incluindo:

- Identificador de publicidade (Advertising ID)
- Endereço IP
- Tipo e modelo do dispositivo
- Sistema operacional
- Dados de localização aproximada (quando autorizados)

**Finalidade:** Monetização do Aplicativo através de publicidade direcionada.

**Base legal:** Legítimo interesse do Desenvolvedor na sustentabilidade do Aplicativo.

**Política de Privacidade do Google AdMob:** https://policies.google.com/privacy

**Controle do usuário:** Você pode desativar a personalização de anúncios através das configurações de privacidade do seu dispositivo Android (Configurações > Google > Anúncios > Desativar personalização de anúncios).

### 4.2 Firebase Cloud Messaging (FCM)

O Firebase Cloud Messaging é utilizado para envio de notificações push. Este serviço coleta:

- Token de registro FCM
- Dados de entrega de notificações (sucesso/falha)
- Metadados técnicos do dispositivo

**Política de Privacidade do Firebase:** https://firebase.google.com/support/privacy

### 4.3 Expo Push Notification Service

Serviço complementar de notificações que processa tokens e gerencia o envio de mensagens push.

**Política de Privacidade do Expo:** https://expo.dev/privacy

## 5. Armazenamento e Retenção de Dados

### 5.1 Dados no Servidor Backend

**Local de hospedagem:** Railway Cloud (https://looton-backend-production.up.railway.app)

**Dados armazenados:**
- Tokens de notificação push (em memória, TTL de 24 horas)
- Registros de atividade de usuários (em memória, TTL de 24 horas)

**Período de retenção:** Máximo de 24 horas. Após esse período, os dados são automaticamente removidos da memória do servidor.

**Segurança:** A comunicação entre o Aplicativo e o backend é realizada através de protocolo HTTPS, garantindo criptografia dos dados em trânsito.

### 5.2 Dados no Dispositivo do Usuário

**Dados armazenados:**
- Listas de jogos (favoritos, observados, listas personalizadas)
- Token de notificação push
- Preferências de interface

**Período de retenção:** Indefinido, até que o usuário desinstale o Aplicativo ou limpe manualmente os dados através das configurações do sistema operacional.

## 6. Compartilhamento de Dados

O Looton não vende, aluga ou comercializa dados pessoais de usuários. Os dados são compartilhados exclusivamente nas seguintes circunstâncias:

### 6.1 Serviços Essenciais

- **Google Firebase:** Para envio de notificações push
- **Expo Push Notification Service:** Para gerenciamento de notificações
- **Google AdMob:** Para exibição de publicidade

### 6.2 Obrigações Legais

Podemos divulgar dados pessoais quando exigido por lei, ordem judicial, processo administrativo ou requisição de autoridade competente.

### 6.3 Proteção de Direitos

Reservamo-nos o direito de divulgar dados pessoais para proteger nossos direitos legais, prevenir fraudes ou proteger a segurança dos usuários.

## 7. Direitos dos Titulares de Dados (LGPD)

Em conformidade com a LGPD, você possui os seguintes direitos em relação aos seus dados pessoais:

### 7.1 Confirmação e Acesso

Você pode solicitar confirmação da existência de tratamento de dados e obter acesso aos dados pessoais armazenados.

### 7.2 Correção

Você pode solicitar a correção de dados incompletos, inexatos ou desatualizados.

### 7.3 Anonimização, Bloqueio ou Eliminação

Você pode solicitar a anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD.

### 7.4 Revogação do Consentimento

Você pode revogar o consentimento para tratamento de dados pessoais a qualquer momento. A revogação pode ser realizada:

**Para notificações push:**
1. Acesse as configurações do seu dispositivo Android
2. Navegue até Configurações > Aplicativos > Looton > Notificações
3. Desative as notificações

**Para remoção completa de dados:**
- Desinstale o Aplicativo através das configurações do Android

### 7.5 Informação sobre Compartilhamento

Você pode solicitar informações sobre as entidades públicas e privadas com as quais compartilhamos seus dados.

### 7.6 Oposição ao Tratamento

Você pode se opor ao tratamento de dados realizado com base em legítimo interesse.

## 8. Segurança da Informação

Implementamos medidas técnicas e organizacionais apropriadas para proteger os dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição:

- **Criptografia:** Comunicação HTTPS entre o Aplicativo e o servidor backend
- **Armazenamento limitado:** Dados temporários em memória com TTL de 24 horas
- **Controle de acesso:** Acesso restrito aos sistemas backend
- **Atualizações regulares:** Manutenção e atualização de dependências de segurança

Apesar de nossos esforços, nenhum sistema é completamente seguro. Não podemos garantir a segurança absoluta dos dados transmitidos através da Internet.

## 9. Dados de Menores de Idade

O Looton não é direcionado a menores de 13 anos. Não coletamos intencionalmente dados pessoais de crianças. Caso tomemos conhecimento de que coletamos dados de menores sem o consentimento dos responsáveis legais, tomaremos medidas para deletar essas informações.

Pais e responsáveis legais são encorajados a monitorar o uso de aplicativos por menores sob sua responsabilidade.

## 10. Transferência Internacional de Dados

Alguns dos serviços terceiros utilizados (Google Firebase, Expo, Render) podem armazenar ou processar dados em servidores localizados fora do Brasil. Esses serviços adotam medidas de proteção de dados em conformidade com padrões internacionais e com a LGPD.

## 11. Alterações na Política de Privacidade

Reservamo-nos o direito de modificar esta Política de Privacidade a qualquer momento. Alterações significativas serão comunicadas através de:

- Notificação push no Aplicativo
- Atualização da data de "Última atualização" no topo deste documento
- Publicação da versão revisada no Aplicativo

Recomendamos a revisão periódica desta Política de Privacidade para se manter informado sobre como protegemos seus dados.

## 12. Legislação Aplicável

Esta Política de Privacidade é regida pelas leis da República Federativa do Brasil, especialmente pela Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018) e pelo Marco Civil da Internet (Lei nº 12.965/2014).

## 13. Contato e Encarregado de Dados (DPO)

Para exercer seus direitos, esclarecer dúvidas ou apresentar reclamações relacionadas ao tratamento de dados pessoais, entre em contato conosco:

**Encarregado de Proteção de Dados (DPO):**  
João Marcos Da Silva Magno

**E-mail:**  
nexusdevsystem@gmail.com

**Prazo de resposta:** Até 15 dias úteis após o recebimento da solicitação.

## 14. Autoridade Nacional de Proteção de Dados (ANPD)

Caso não esteja satisfeito com a resposta às suas solicitações, você pode contatar a Autoridade Nacional de Proteção de Dados (ANPD):

**Site:** https://www.gov.br/anpd/pt-br  
**E-mail:** atendimento@anpd.gov.br

## 15. Aceitação da Política de Privacidade

Ao utilizar o Looton, você declara ter lido, compreendido e concordado com os termos desta Política de Privacidade.

---

**NexusDevSystem**  
**E-mail:** nexusdevsystem@gmail.com  
**Data:** 29 de outubro de 2025
