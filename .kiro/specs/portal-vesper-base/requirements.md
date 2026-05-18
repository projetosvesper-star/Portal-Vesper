# Requirements Document

## Introduction

O Portal Vesper é um aplicativo desktop empresarial instalado nos PCs da empresa, conectado a um servidor central. Ele unifica em um único portal todos os sistemas legados da empresa: Kanban Produção, Kanban Operacional/Projetos, Compras, HelpDesk TI, Chat Interno, Controle TI, Propostas, Atalhos, IA Interna e Automações n8n.

Esta especificação cobre exclusivamente a **base arquitetural** do portal: infraestrutura, autenticação, autorização, módulos dinâmicos, auditoria, notificações, WebSocket e layout visual base. Os módulos de negócio são registrados como placeholders para implementação futura.

A stack é: Tauri 2.0 (desktop), React + TypeScript + Vite + TailwindCSS + shadcn/ui (frontend), FastAPI + Python 3.12+ + SQLAlchemy 2.x + Alembic + Pydantic (backend), PostgreSQL (banco), Redis (cache/filas/pub-sub), MinIO (storage S3-compatível), WebSocket nativo FastAPI.

---

## Glossary

- **Portal**: O aplicativo desktop Portal Vesper como um todo.
- **Backend**: O servidor FastAPI que centraliza toda a lógica de negócio e validação.
- **Frontend**: A aplicação React + Vite executada dentro do shell Tauri.
- **Desktop_Shell**: O processo Tauri 2.0 que empacota o Frontend como aplicativo nativo.
- **Auth_Service**: Módulo do Backend responsável por autenticação (login, JWT, refresh token).
- **User_Service**: Módulo do Backend responsável por gerenciamento de usuários.
- **Role_Service**: Módulo do Backend responsável por perfis (roles) de acesso.
- **Permission_Service**: Módulo do Backend responsável por permissões granulares.
- **Module_Registry**: Módulo do Backend responsável pelo registro e consulta de módulos do portal.
- **Audit_Service**: Módulo do Backend responsável por registrar eventos de auditoria.
- **Notification_Service**: Módulo do Backend responsável por notificações internas.
- **WebSocket_Manager**: Componente do Backend que gerencia conexões WebSocket em tempo real.
- **Storage_Service**: Módulo do Backend que abstrai operações de arquivo via MinIO.
- **RBAC**: Role-Based Access Control — controle de acesso baseado em perfis e permissões granulares.
- **Permission**: String no formato `modulo.acao` (ex: `admin.users.view`) que representa uma ação autorizada.
- **Role**: Conjunto nomeado de permissões atribuído a um usuário (ex: Administrador, Gestor).
- **Module**: Unidade funcional do portal com chave única, rota, ícone e índice de ordenação.
- **Superuser**: Usuário com flag `is_superuser=true` que possui acesso irrestrito a todas as operações.
- **JWT**: JSON Web Token usado como access token de curta duração.
- **Refresh_Token**: Token de longa duração armazenado no banco, usado para renovar o JWT.
- **Audit_Log**: Registro imutável de uma ação realizada por um usuário no sistema.
- **Seed**: Script de população inicial do banco de dados para ambiente de desenvolvimento.
- **Monorepo**: Repositório único contendo todos os pacotes do projeto (backend, frontend, desktop, infra).
- **Docker_Compose**: Orquestrador de containers usado no ambiente de desenvolvimento local.

---

## Requirements

### Requirement 1: Estrutura do Monorepo

**User Story:** Como desenvolvedor, quero um monorepo organizado com separação clara entre backend, frontend, desktop e infraestrutura, para que eu possa navegar, manter e escalar cada parte de forma independente.

#### Acceptance Criteria

1. THE Monorepo SHALL conter os diretórios `apps/desktop`, `apps/web`, `backend`, `packages/ui`, `packages/types`, `packages/config`, `infra` e `docs` na raiz do projeto.
2. THE Monorepo SHALL conter um arquivo `package.json` na raiz com scripts de inicialização do ambiente de desenvolvimento.
3. THE Monorepo SHALL conter um arquivo `.env.example` na raiz com todas as variáveis de ambiente necessárias documentadas, sem valores reais.
4. THE Monorepo SHALL conter um arquivo `.gitignore` que exclua `.env`, `node_modules/`, `dist/`, `build/`, `__pycache__/`, `*.pyc`, arquivos de banco SQLite e diretórios de cobertura de testes.
5. THE Monorepo SHALL conter um arquivo `README.md` com instruções de pré-requisitos, instalação, configuração e execução do ambiente de desenvolvimento.

---

### Requirement 2: Infraestrutura de Desenvolvimento com Docker Compose

**User Story:** Como desenvolvedor, quero subir toda a infraestrutura de desenvolvimento com um único comando, para que eu possa iniciar o trabalho rapidamente sem configurar serviços manualmente.

#### Acceptance Criteria

1. THE Docker_Compose SHALL definir serviços para PostgreSQL 16, Redis 7, MinIO e pgAdmin no arquivo `infra/docker-compose.yml`.
2. WHEN o comando `docker compose up -d` é executado no diretório `infra`, THE Docker_Compose SHALL iniciar todos os serviços com healthchecks configurados.
3. THE Docker_Compose SHALL persistir dados do PostgreSQL, Redis e MinIO em volumes nomeados para que os dados sobrevivam a reinicializações dos containers.
4. THE Docker_Compose SHALL expor o PostgreSQL na porta 5432, Redis na porta 6379, MinIO na porta 9000 (API) e 9001 (console), e pgAdmin na porta 5050.
5. IF um serviço do Docker_Compose falhar no healthcheck, THEN THE Docker_Compose SHALL reiniciar o container automaticamente com política `unless-stopped`.
6. THE Docker_Compose SHALL ler credenciais exclusivamente de variáveis de ambiente definidas no arquivo `.env`, sem valores hardcoded no arquivo YAML.

---

### Requirement 3: Backend FastAPI Base

**User Story:** Como desenvolvedor, quero um servidor FastAPI estruturado com configuração centralizada, para que eu possa adicionar novos módulos de forma consistente e segura.

#### Acceptance Criteria

1. THE Backend SHALL expor um endpoint `GET /health` que retorne status HTTP 200 com payload `{"status": "ok", "version": "<versão>"}`.
2. THE Backend SHALL carregar todas as configurações de variáveis de ambiente via Pydantic Settings, sem valores hardcoded no código-fonte.
3. THE Backend SHALL registrar todas as rotas sob o prefixo `/api/v1`.
4. THE Backend SHALL retornar erros no formato padronizado `{"error": {"code": "<código>", "message": "<mensagem>"}}` para todos os endpoints.
5. THE Backend SHALL incluir middleware de CORS configurável via variável de ambiente `ALLOWED_ORIGINS`.
6. THE Backend SHALL incluir middleware de logging estruturado que registre método HTTP, path, status code, duração e `request_id` para cada requisição.
7. THE Backend SHALL expor documentação OpenAPI em `/docs` (Swagger UI) e `/redoc` apenas quando a variável `ENVIRONMENT` for diferente de `production`.
8. WHEN o Backend é iniciado, THE Backend SHALL verificar a conectividade com PostgreSQL e Redis e registrar o resultado no log de inicialização.

---

### Requirement 4: Banco de Dados PostgreSQL e Migrations

**User Story:** Como desenvolvedor, quero um esquema de banco de dados versionado com Alembic, para que eu possa evoluir o schema de forma controlada e rastreável.

#### Acceptance Criteria

1. THE Backend SHALL gerenciar todas as migrations de banco de dados via Alembic com histórico versionado no diretório `backend/alembic/versions/`.
2. THE Backend SHALL criar as tabelas `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `portal_modules`, `module_permissions`, `audit_logs`, `notifications`, `refresh_tokens` e `files` na migration inicial.
3. WHEN a migration inicial é aplicada, THE Backend SHALL criar todos os índices necessários em foreign keys e colunas usadas em filtros frequentes.
4. THE Backend SHALL usar UUIDs como chave primária em todas as tabelas.
5. THE Backend SHALL incluir os campos `created_at` e `updated_at` em todas as tabelas, com `updated_at` atualizado automaticamente.
6. THE Backend SHALL incluir o campo `deleted_at` nas tabelas `users`, `roles` e `portal_modules` para suporte a soft delete.

---

### Requirement 5: Sistema de Autenticação

**User Story:** Como usuário da empresa, quero fazer login com username e senha, para que eu possa acessar o portal de forma segura sem precisar de e-mail.

#### Acceptance Criteria

1. WHEN um usuário envia `username` e `password` válidos para `POST /api/v1/auth/login`, THE Auth_Service SHALL retornar um JWT de acesso com expiração configurável e um refresh token.
2. WHEN um usuário envia `username` ou `password` inválidos para `POST /api/v1/auth/login`, THE Auth_Service SHALL retornar HTTP 401 com mensagem de erro genérica sem revelar qual campo está incorreto.
3. THE Auth_Service SHALL gerar JWTs assinados com algoritmo HS256 usando chave secreta definida em variável de ambiente `SECRET_KEY`.
4. THE Auth_Service SHALL armazenar refresh tokens no banco de dados com hash bcrypt, associados ao usuário e com data de expiração.
5. WHEN um usuário envia um refresh token válido para `POST /api/v1/auth/refresh`, THE Auth_Service SHALL retornar um novo JWT de acesso e um novo refresh token, invalidando o anterior.
6. IF um refresh token expirado ou inválido é enviado para `POST /api/v1/auth/refresh`, THEN THE Auth_Service SHALL retornar HTTP 401.
7. WHEN um usuário envia requisição para `POST /api/v1/auth/logout`, THE Auth_Service SHALL invalidar o refresh token atual no banco de dados.
8. THE Auth_Service SHALL armazenar senhas exclusivamente como hash bcrypt com fator de custo mínimo 12, nunca em texto puro.
9. WHILE um usuário está autenticado, THE Auth_Service SHALL validar o JWT em cada requisição protegida e rejeitar tokens expirados ou com assinatura inválida com HTTP 401.

---

### Requirement 6: Sistema de Usuários

**User Story:** Como administrador, quero gerenciar usuários do portal, para que eu possa controlar quem tem acesso ao sistema.

#### Acceptance Criteria

1. THE User_Service SHALL expor endpoints CRUD em `/api/v1/users` para criação, leitura, atualização e desativação de usuários.
2. WHEN um usuário é criado via `POST /api/v1/users`, THE User_Service SHALL validar que o `username` é único no sistema e retornar HTTP 409 em caso de conflito.
3. THE User_Service SHALL incluir os campos `id`, `username`, `name`, `is_active`, `is_superuser`, `created_at` e `updated_at` no modelo de usuário.
4. WHEN um usuário é desativado via `PATCH /api/v1/users/{id}` com `is_active: false`, THE User_Service SHALL impedir novos logins desse usuário sem remover seus dados.
5. IF uma requisição para endpoints de usuários é feita sem a permissão `admin.users.view`, THEN THE User_Service SHALL retornar HTTP 403.
6. THE User_Service SHALL executar o Seed inicial criando o usuário `Admin` com `username: "Admin"`, `name: "Administrador"`, `is_superuser: true` e senha `Vesper@890` hasheada com bcrypt.
7. WHEN o Seed é executado em um banco já populado, THE User_Service SHALL verificar a existência do usuário admin antes de tentar criá-lo, evitando duplicatas.

---

### Requirement 7: Sistema de Permissões RBAC

**User Story:** Como administrador, quero um sistema de controle de acesso baseado em perfis com permissões granulares no formato `modulo.acao`, para que eu possa definir exatamente o que cada usuário pode fazer.

#### Acceptance Criteria

1. THE Permission_Service SHALL representar cada permissão como uma string no formato `modulo.acao` ou `modulo.submodulo.acao`.
2. THE Role_Service SHALL expor endpoints CRUD em `/api/v1/roles` para gerenciamento de perfis de acesso.
3. WHEN um perfil é criado, THE Role_Service SHALL permitir associar um conjunto de permissões ao perfil.
4. THE Permission_Service SHALL expor endpoint `GET /api/v1/permissions` que retorne todas as permissões disponíveis no sistema.
5. WHEN uma requisição autenticada chega a um endpoint protegido, THE Permission_Service SHALL verificar se o usuário possui a permissão requerida via seu perfil ou via `is_superuser`.
6. WHILE `is_superuser` é `true` para um usuário, THE Permission_Service SHALL conceder acesso a todas as operações sem verificar permissões individuais.
7. IF um usuário autenticado não possui a permissão requerida, THEN THE Permission_Service SHALL retornar HTTP 403 com código de erro `FORBIDDEN`.
8. THE Seed SHALL criar os 7 perfis iniciais: Administrador (todas as permissões), Gestor, Usuário, TI, Comercial, Compras e Produção, com as permissões definidas na especificação.
9. THE Seed SHALL criar todas as 35 permissões iniciais listadas na especificação do projeto.

---

### Requirement 8: Sistema de Módulos Dinâmicos

**User Story:** Como administrador, quero registrar módulos no portal e controlar quais usuários têm acesso a cada um, para que a sidebar seja renderizada dinamicamente conforme as permissões do usuário logado.

#### Acceptance Criteria

1. THE Module_Registry SHALL armazenar cada módulo com os campos `key`, `name`, `route`, `icon`, `order_index`, `is_active` e `required_permission`.
2. WHEN um usuário autenticado acessa `GET /api/v1/modules/my-modules`, THE Module_Registry SHALL retornar apenas os módulos ativos para os quais o usuário possui a permissão requerida, ordenados por `order_index`.
3. THE Module_Registry SHALL expor endpoints CRUD em `/api/v1/modules` para gerenciamento de módulos, protegidos pela permissão `admin.modules.manage`.
4. THE Seed SHALL registrar os 10 módulos iniciais: chat, kanban, propostas, compras, helpdesk, controle_ti, atalhos, ia, automacoes_n8n e admin, com os valores de `key`, `route`, `icon` e `order_index` definidos na especificação.
5. WHEN o Frontend carrega após login, THE Frontend SHALL consultar `GET /api/v1/modules/my-modules` e renderizar a sidebar com os módulos retornados.
6. IF um módulo está com `is_active: false`, THEN THE Module_Registry SHALL excluí-lo da resposta de `GET /api/v1/modules/my-modules` independentemente das permissões do usuário.

---

### Requirement 9: Sistema de Auditoria

**User Story:** Como administrador, quero que todas as ações relevantes sejam registradas com usuário, timestamp e detalhes, para que eu possa rastrear o que aconteceu no sistema.

#### Acceptance Criteria

1. THE Audit_Service SHALL registrar um audit log para cada operação de criação, atualização e exclusão em usuários, perfis, permissões e módulos.
2. THE Audit_Service SHALL armazenar em cada audit log os campos `id`, `user_id`, `action`, `resource_type`, `resource_id`, `details`, `ip_address` e `created_at`.
3. THE Audit_Service SHALL expor endpoint `GET /api/v1/audit-logs` protegido pela permissão `admin.audit.view`, com suporte a paginação via parâmetros `page` e `limit`.
4. THE Audit_Service SHALL registrar logs de auditoria de forma assíncrona para não impactar a latência das operações principais.
5. THE Audit_Service SHALL registrar o evento de login bem-sucedido e de tentativa de login com falha para cada usuário.
6. IF um audit log falha ao ser gravado, THEN THE Audit_Service SHALL registrar o erro no log do sistema sem interromper a operação principal que o originou.

---

### Requirement 10: Sistema de Notificações

**User Story:** Como usuário, quero receber notificações internas do sistema em tempo real, para que eu seja informado de eventos relevantes sem precisar recarregar a página.

#### Acceptance Criteria

1. THE Notification_Service SHALL armazenar notificações com os campos `id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at` e `read_at`.
2. THE Notification_Service SHALL expor endpoint `GET /api/v1/notifications` que retorne as notificações do usuário autenticado, ordenadas por `created_at` decrescente.
3. WHEN uma notificação é criada para um usuário conectado via WebSocket, THE Notification_Service SHALL enviar a notificação em tempo real via WebSocket_Manager.
4. WHEN um usuário acessa `PATCH /api/v1/notifications/{id}/read`, THE Notification_Service SHALL marcar a notificação como lida e registrar o `read_at`.
5. THE Notification_Service SHALL expor endpoint `GET /api/v1/notifications/unread-count` que retorne o número de notificações não lidas do usuário autenticado.
6. THE Notification_Service SHALL suportar os tipos de notificação: `info`, `success`, `warning` e `error`.

---

### Requirement 11: WebSocket Base

**User Story:** Como desenvolvedor, quero uma infraestrutura WebSocket base no backend, para que os módulos futuros possam enviar eventos em tempo real para os clientes conectados.

#### Acceptance Criteria

1. THE WebSocket_Manager SHALL aceitar conexões WebSocket autenticadas no endpoint `ws://host/api/v1/ws`.
2. WHEN um cliente tenta conectar ao WebSocket sem JWT válido no parâmetro de query `token`, THE WebSocket_Manager SHALL rejeitar a conexão com código 4001.
3. THE WebSocket_Manager SHALL manter um registro de conexões ativas associadas ao `user_id` para permitir envio de mensagens direcionadas.
4. WHEN um usuário se conecta ao WebSocket, THE WebSocket_Manager SHALL enviar um evento `connected` com o payload `{"type": "connected", "user_id": "<id>"}`.
5. THE WebSocket_Manager SHALL suportar broadcast de mensagens para todos os usuários conectados e envio direcionado para um `user_id` específico.
6. WHEN uma conexão WebSocket é encerrada, THE WebSocket_Manager SHALL remover o cliente do registro de conexões ativas.
7. THE WebSocket_Manager SHALL usar Redis Pub/Sub para coordenar mensagens entre múltiplas instâncias do Backend.

---

### Requirement 12: Storage com MinIO

**User Story:** Como desenvolvedor, quero uma abstração de storage compatível com S3 via MinIO, para que os módulos futuros possam armazenar e recuperar arquivos de forma padronizada.

#### Acceptance Criteria

1. THE Storage_Service SHALL conectar ao MinIO usando as credenciais definidas em variáveis de ambiente `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY` e `MINIO_SECRET_KEY`.
2. WHEN o Backend é iniciado, THE Storage_Service SHALL verificar a existência do bucket padrão e criá-lo caso não exista.
3. THE Storage_Service SHALL expor endpoint `POST /api/v1/files/upload` que aceite upload de arquivos e retorne a URL de acesso ao arquivo armazenado.
4. THE Storage_Service SHALL expor endpoint `GET /api/v1/files/{file_id}` que retorne metadados do arquivo armazenado.
5. THE Storage_Service SHALL armazenar metadados de cada arquivo (nome original, tamanho, tipo MIME, bucket, path, uploader) na tabela `files` do PostgreSQL.
6. IF o MinIO estiver indisponível durante um upload, THEN THE Storage_Service SHALL retornar HTTP 503 com mensagem de erro apropriada.

---

### Requirement 13: Frontend React Base

**User Story:** Como desenvolvedor, quero um frontend React estruturado com roteamento, gerenciamento de estado e design system configurados, para que eu possa implementar telas de forma consistente.

#### Acceptance Criteria

1. THE Frontend SHALL usar React Router para roteamento com rotas protegidas que redirecionam para `/login` quando o usuário não está autenticado.
2. THE Frontend SHALL usar TanStack Query para todas as chamadas à API, com configuração de cache, retry e invalidação.
3. THE Frontend SHALL usar Zustand para estado global de autenticação (usuário logado, tokens, permissões).
4. THE Frontend SHALL usar shadcn/ui como biblioteca de componentes base com tema dark configurado como padrão.
5. THE Frontend SHALL implementar um hook `usePermission(permission: string): boolean` que verifique se o usuário logado possui uma permissão específica.
6. THE Frontend SHALL implementar um componente `ProtectedRoute` que verifique autenticação e permissão antes de renderizar a rota.
7. THE Frontend SHALL renovar automaticamente o JWT usando o refresh token antes da expiração, sem interromper a sessão do usuário.
8. WHEN o refresh token expira ou é inválido, THE Frontend SHALL redirecionar o usuário para a tela de login e limpar o estado de autenticação.

---

### Requirement 14: Layout Visual Base

**User Story:** Como usuário, quero um layout visual dark premium com sidebar dinâmica, para que eu tenha uma experiência consistente e profissional ao navegar entre os módulos.

#### Acceptance Criteria

1. THE Frontend SHALL implementar um layout base com sidebar lateral esquerda, área de conteúdo principal e barra de topo.
2. THE Frontend SHALL aplicar tema dark premium com paleta de cores navy/charcoal como fundo e acentos cyan/blue/teal para elementos interativos.
3. THE Frontend SHALL renderizar na sidebar apenas os módulos retornados por `GET /api/v1/modules/my-modules`, com ícone Lucide, nome e rota correspondentes.
4. THE Frontend SHALL exibir na barra de topo o nome do usuário logado, um indicador de notificações não lidas e um menu de logout.
5. WHEN o usuário clica em logout na barra de topo, THE Frontend SHALL chamar `POST /api/v1/auth/logout`, limpar o estado de autenticação e redirecionar para `/login`.
6. THE Frontend SHALL exibir um badge com a contagem de notificações não lidas no ícone de notificações da barra de topo, atualizado em tempo real via WebSocket.
7. THE Frontend SHALL ser responsivo, adaptando o layout para telas a partir de 1024px de largura (aplicativo desktop).

---

### Requirement 15: Tela de Login

**User Story:** Como usuário, quero uma tela de login com campos de username e senha, para que eu possa me autenticar no portal de forma simples e segura.

#### Acceptance Criteria

1. THE Frontend SHALL exibir a tela de login na rota `/login` com campos `username` e `password`, botão de submit e logo do Portal Vesper.
2. WHEN o usuário submete o formulário de login com campos vazios, THE Frontend SHALL exibir mensagens de validação inline sem chamar a API.
3. WHEN o login é bem-sucedido, THE Frontend SHALL armazenar o JWT e refresh token no estado Zustand e redirecionar para `/` (rota principal).
4. WHEN o login falha com HTTP 401, THE Frontend SHALL exibir mensagem de erro "Usuário ou senha inválidos" sem revelar qual campo está incorreto.
5. WHILE a requisição de login está em andamento, THE Frontend SHALL desabilitar o botão de submit e exibir indicador de carregamento.
6. THE Frontend SHALL aplicar o tema dark premium na tela de login, consistente com o restante do portal.

---

### Requirement 16: Tela de Administração Inicial

**User Story:** Como administrador, quero uma tela de administração com gerenciamento de usuários, perfis e módulos, para que eu possa configurar o portal sem precisar acessar o banco diretamente.

#### Acceptance Criteria

1. THE Frontend SHALL exibir a tela de administração na rota `/admin`, acessível apenas para usuários com permissão `admin.view`.
2. THE Frontend SHALL exibir na tela de administração seções para: Usuários, Perfis, Permissões, Módulos e Logs de Auditoria.
3. THE Frontend SHALL exibir na seção Usuários uma tabela paginada com os campos `username`, `name`, `is_active`, `roles` e ações de editar e desativar.
4. THE Frontend SHALL exibir na seção Módulos uma tabela com os módulos registrados e controles para ativar/desativar cada módulo.
5. IF o usuário não possui a permissão `admin.view`, THEN THE Frontend SHALL redirecionar para a rota principal sem exibir a tela de administração.
6. THE Frontend SHALL exibir na seção Logs de Auditoria uma tabela paginada com os campos `user`, `action`, `resource_type`, `resource_id` e `created_at`.

---

### Requirement 17: Desktop Shell Tauri 2.0

**User Story:** Como usuário da empresa, quero instalar o portal como um aplicativo desktop nativo, para que eu possa acessá-lo diretamente do meu PC sem precisar de um navegador.

#### Acceptance Criteria

1. THE Desktop_Shell SHALL empacotar o Frontend como aplicativo nativo usando Tauri 2.0 com Rust como runtime.
2. THE Desktop_Shell SHALL configurar a janela principal com título "Portal Vesper", dimensões mínimas de 1280x720 pixels e decorações nativas do sistema operacional.
3. THE Desktop_Shell SHALL apontar para o servidor Backend via variável de ambiente `VITE_API_URL` configurada no build do Frontend.
4. THE Desktop_Shell SHALL desabilitar o menu de contexto padrão do navegador e o atalho de abertura de DevTools em builds de produção.
5. THE Desktop_Shell SHALL incluir configuração de build para Windows (`.exe` com instalador NSIS) no arquivo `tauri.conf.json`.
6. WHEN o Desktop_Shell é iniciado, THE Desktop_Shell SHALL exibir a tela de login do Frontend imediatamente, sem splash screen adicional.

---

### Requirement 18: Testes Mínimos do Backend

**User Story:** Como desenvolvedor, quero testes automatizados cobrindo os fluxos críticos do backend, para que eu possa detectar regressões ao evoluir o código.

#### Acceptance Criteria

1. THE Backend SHALL incluir teste que verifique que `GET /health` retorna HTTP 200 com payload `{"status": "ok"}`.
2. THE Backend SHALL incluir teste que verifique que `POST /api/v1/auth/login` com credenciais válidas retorna HTTP 200 com JWT e refresh token.
3. THE Backend SHALL incluir teste que verifique que `POST /api/v1/auth/login` com credenciais inválidas retorna HTTP 401.
4. THE Backend SHALL incluir teste que verifique que `GET /api/v1/modules/my-modules` retorna apenas os módulos para os quais o usuário possui permissão.
5. THE Backend SHALL incluir teste que verifique que um endpoint protegido retorna HTTP 403 quando acessado por usuário sem a permissão requerida.
6. THE Backend SHALL incluir teste que verifique que um endpoint protegido retorna HTTP 401 quando acessado sem JWT.
7. THE Backend SHALL executar todos os testes com o comando `pytest` no diretório `backend/tests/`.

---

### Requirement 19: Documentação Técnica

**User Story:** Como desenvolvedor, quero documentação técnica completa sobre arquitetura, permissões, módulos, WebSocket, storage, setup e deploy, para que eu possa entender e operar o sistema sem depender de conhecimento tácito.

#### Acceptance Criteria

1. THE Monorepo SHALL conter o arquivo `docs/arquitetura.md` descrevendo a visão geral da arquitetura, stack, fluxo de dados e decisões técnicas.
2. THE Monorepo SHALL conter o arquivo `docs/permissoes.md` listando todas as permissões disponíveis, seus escopos e os perfis que as possuem.
3. THE Monorepo SHALL conter o arquivo `docs/modulos.md` descrevendo o sistema de módulos dinâmicos, como registrar novos módulos e a tabela de módulos iniciais.
4. THE Monorepo SHALL conter o arquivo `docs/websocket-events.md` documentando todos os eventos WebSocket suportados, seus payloads e como consumir no Frontend.
5. THE Monorepo SHALL conter o arquivo `docs/storage.md` documentando como usar o Storage_Service para upload e download de arquivos.
6. THE Monorepo SHALL conter o arquivo `docs/setup-dev.md` com instruções passo a passo para configurar o ambiente de desenvolvimento local.
7. THE Monorepo SHALL conter o arquivo `docs/deploy-servidor.md` com instruções para deploy do Backend e infraestrutura em servidor de produção.
