# Teste Manual Portal Vesper Atual

Use este checklist para validar manualmente o estado atual do Portal Vesper.

## Ambiente

- [ ] Docker Desktop esta aberto.
- [ ] Node.js/npm instalados.
- [ ] Python/venv do backend configurado.
- [ ] `.env` local existe e nao sera versionado.
- [ ] Rust/Cargo instalado se for validar Tauri.

## Setup

1. [ ] Rodar `npm run infra:up`.
2. [ ] Confirmar PostgreSQL ativo.
3. [ ] Confirmar Redis ativo.
4. [ ] Confirmar MinIO ativo.
5. [ ] Confirmar pgAdmin ativo, se usado.
6. [ ] Rodar `npm run backend:migrate`.
7. [ ] Rodar `npm run backend:seed`.
8. [ ] Rodar `npm run backend:seed` novamente.
9. [ ] Confirmar que o seed nao duplica dados nem falha.

## Backend

10. [ ] Rodar `npm run backend:dev`.
11. [ ] Abrir `http://localhost:8000/api/health`.
12. [ ] Confirmar `database=true`.
13. [ ] Confirmar `redis=true`.
14. [ ] Confirmar `storage=true`.
15. [ ] Abrir `http://localhost:8000/api/docs`.
16. [ ] Confirmar que endpoints `/api/kanban/*` aparecem na OpenAPI.
17. [ ] Confirmar que `/ws` nao aparece na OpenAPI e esta documentado separadamente.

## Frontend

18. [ ] Rodar `npm run dev:web`.
19. [ ] Abrir `http://127.0.0.1:5174`.
20. [ ] Confirmar tela de login.
21. [ ] Entrar com username `Admin`.
22. [ ] Entrar com senha dev `Vesper@890`.
23. [ ] Confirmar que nao aparece `Failed to fetch`.
24. [ ] Confirmar redirecionamento para Dashboard.
25. [ ] Confirmar badge de ambiente `development`.
26. [ ] Confirmar `WS online`.

## Sidebar E Admin

27. [ ] Confirmar sidebar com 10 modulos.
28. [ ] Abrir Administracao.
29. [ ] Confirmar usuarios visiveis.
30. [ ] Confirmar permissoes visiveis.
31. [ ] Confirmar modulos visiveis.
32. [ ] Confirmar botao `Visualizar como usuario`.
33. [ ] Fazer logout.
34. [ ] Fazer login novamente.
35. [ ] Recarregar a pagina e confirmar sessao/refresh.

## Kanban Visual

36. [ ] Abrir Kanban.
37. [ ] Confirmar que um board e selecionado.
38. [ ] Confirmar colunas carregadas.
39. [ ] Confirmar cards carregados.
40. [ ] Clicar em `Novo card`.
41. [ ] Confirmar modal/form de card.
42. [ ] Criar card simples.
43. [ ] Confirmar card aparece na coluna.
44. [ ] Abrir card.
45. [ ] Confirmar drawer abre.
46. [ ] Confirmar abas Checklist, Comentarios, Anexos e Atividade.
47. [ ] Clicar em Editar.
48. [ ] Alterar titulo e salvar.
49. [ ] Confirmar titulo atualizado.
50. [ ] Mover card para outra coluna por drag-and-drop.
51. [ ] Confirmar card mudou de coluna.
52. [ ] Reordenar card na mesma coluna.
53. [ ] Confirmar ordem persistiu apos atualizar pagina.
54. [ ] Trocar coluna pela edicao do card, se permitido na UI.
55. [ ] Confirmar card mudou de coluna.

## Checklist

56. [ ] Abrir drawer do card.
57. [ ] Abrir aba Checklist.
58. [ ] Criar item de checklist.
59. [ ] Marcar item como concluido.
60. [ ] Confirmar contador de checklist.
61. [ ] Recarregar pagina e confirmar persistencia.

## Comentarios

62. [ ] Abrir aba Comentarios.
63. [ ] Criar comentario.
64. [ ] Confirmar comentario visivel.
65. [ ] Editar comentario, se a UI permitir.
66. [ ] Excluir comentario, se a UI permitir.

## Anexos E Upload

67. [ ] Abrir aba Anexos.
68. [ ] Anexar arquivo `.txt` pequeno.
69. [ ] Confirmar upload sem erro.
70. [ ] Confirmar anexo listado.
71. [ ] Abrir/baixar anexo.
72. [ ] Remover anexo.
73. [ ] Tentar anexar arquivo invalido.
74. [ ] Confirmar erro real da API, nao toast falso.

## Activity E Realtime

75. [ ] Abrir aba Atividade.
76. [ ] Confirmar eventos de criacao/edicao/movimento/checklist/comentario/anexo.
77. [ ] Manter uma aba aberta e fazer uma mudanca em outra aba.
78. [ ] Confirmar atualizacao via WebSocket ou refresh controlado.
79. [ ] Confirmar que nao ha loop de refetch.
80. [ ] Confirmar que nao ha multiplas conexoes WebSocket por aba.
81. [ ] Confirmar que o token nao aparece na URL do WebSocket.

## Permissoes

82. [ ] Criar usuario comum com perfil `usuario`.
83. [ ] Logar com usuario comum.
84. [ ] Confirmar Administracao nao aparece ou retorna 403.
85. [ ] Confirmar acao Kanban sem permissao especifica e bloqueada.
86. [ ] Confirmar backend retorna 403 mesmo chamando endpoint direto.

## Testes Automatizados

87. [ ] Rodar `npm run backend:test`.
88. [ ] Confirmar todos os testes passando.
89. [ ] Rodar `npm run build --workspace=apps/web`.
90. [ ] Confirmar build passando.
91. [ ] Rodar `npm run lint`.
92. [ ] Confirmar lint passando.
93. [ ] Rodar `npm run typecheck`.
94. [ ] Confirmar typecheck passando.

## Tauri

95. [ ] Confirmar Rust/Cargo instalado com `cargo --version`.
96. [ ] Rodar `npm run dev:desktop`.
97. [ ] Confirmar janela `Portal Vesper`.
98. [ ] Confirmar Tauri aponta para `http://127.0.0.1:5174`.
99. [ ] Confirmar que Tauri nao contem regra de negocio.

## Resultado

- [ ] Aprovado para iniciar Kanban Producao.
- [ ] Reprovado: preencher motivo abaixo.

Motivo/restricoes:

```text

```
