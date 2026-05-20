# Repository Secret Scan Report

## Resumo

- Arquivos escaneados: 394
- Ocorrencias encontradas: 724
- Valores sensiveis nao foram impressos neste relatorio.

- Segredo real em arquivo que deve ir para Git: nao
- `.env` local encontrado: sim; esta ignorado pelo Git.

## Achados

| Caminho | Linha | Termo | Severidade | Classificacao | Acao |
| --- | ---: | --- | --- | --- | --- |
| `.env` | 5 | `password` | ALTA | arquivo local ignorado; nao deve entrar no Git | mantido ignorado por .gitignore |
| `.env` | 8 | `secret` | ALTA | arquivo local ignorado; nao deve entrar no Git | mantido ignorado por .gitignore |
| `.env` | 10 | `token` | ALTA | arquivo local ignorado; nao deve entrar no Git | mantido ignorado por .gitignore |
| `.env` | 11 | `token` | ALTA | arquivo local ignorado; nao deve entrar no Git | mantido ignorado por .gitignore |
| `.env` | 15 | `secret` | ALTA | arquivo local ignorado; nao deve entrar no Git | mantido ignorado por .gitignore |
| `.env` | 19 | `password` | ALTA | arquivo local ignorado; nao deve entrar no Git | mantido ignorado por .gitignore |
| `.env` | 21 | `password` | ALTA | arquivo local ignorado; nao deve entrar no Git | mantido ignorado por .gitignore |
| `.env` | 35 | `API_KEY` | ALTA | arquivo local ignorado; nao deve entrar no Git | mantido ignorado por .gitignore |
| `.env` | 36 | `secret` | ALTA | arquivo local ignorado; nao deve entrar no Git | mantido ignorado por .gitignore |
| `.env.example` | 6 | `password` | BAIXA | placeholder ou referencia por variavel | mantido |
| `.env.example` | 7 | `senha` | BAIXA | placeholder ou referencia por variavel | mantido |
| `.env.example` | 11 | `secret` | BAIXA | placeholder ou referencia por variavel | mantido |
| `.env.example` | 13 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.env.example` | 14 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.env.example` | 22 | `secret` | BAIXA | placeholder ou referencia por variavel | mantido |
| `.env.example` | 26 | `secret` | BAIXA | placeholder ou referencia por variavel | mantido |
| `.env.example` | 29 | `password` | BAIXA | placeholder ou referencia por variavel | mantido |
| `.env.example` | 41 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `.env.example` | 42 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 17 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 42 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 84 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 88 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 89 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 96 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 125 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 126 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 189 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 283 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 284 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 285 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 286 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 310 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 366 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 369 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 416 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 457 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 501 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 507 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 568 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 569 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 578 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 579 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 585 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 586 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 587 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 589 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 590 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 593 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 602 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 603 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 604 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 605 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 606 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 608 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 610 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 611 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 612 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 613 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 614 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 626 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 627 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 628 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 641 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 643 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 644 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 647 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 651 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 654 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 656 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 657 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 658 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 659 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 660 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 662 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 665 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 682 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 683 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 699 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 700 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 707 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 709 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 711 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 712 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 734 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 756 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 764 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 767 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 773 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 778 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 780 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 781 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 782 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1025 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1032 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1036 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1073 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1077 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1078 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1105 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1168 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1169 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1420 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1421 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1424 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1434 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1435 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1438 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1439 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1445 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1446 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1454 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1455 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1493 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1559 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1576 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1582 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1593 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1611 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1642 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1645 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1650 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1652 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1659 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1668 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1675 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1676 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1677 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1710 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1711 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1712 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/design.md` | 1718 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 19 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 33 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 34 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 97 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 107 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 111 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 112 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 113 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 114 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 115 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 116 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 117 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 118 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 119 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 134 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 209 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 224 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 241 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 245 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 246 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 268 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 272 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 274 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 275 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/requirements.md` | 318 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 21 | `secret` | BAIXA | placeholder ou referencia por variavel | mantido |
| `.kiro/specs/portal-vesper-base/tasks.md` | 22 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 49 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 62 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 63 | `secret` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 64 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 65 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 118 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 119 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 130 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 139 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 153 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 154 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 155 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 156 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 157 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 163 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 165 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 166 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 167 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 173 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 231 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 246 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 273 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 277 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 278 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 279 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 286 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 291 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 306 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 318 | `password` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 320 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 321 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `.kiro/specs/portal-vesper-base/tasks.md` | 414 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/README.md` | 67 | `API_KEY` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/README.md` | 68 | `API_KEY` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/README.md` | 69 | `API_KEY` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/README.md` | 77 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 53 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 131 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 132 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 327 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 328 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 394 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 395 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 528 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 529 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 659 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 1016 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 1094 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 1095 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 1290 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 1291 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 1357 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 1358 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 1491 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 1492 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente Empresarial Central__VWvbDbpaFBD7Mlb2.json` | 1622 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente HelpDesk e Controle TI__8eiZJutfJzGWBcLa.json` | 36 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente HelpDesk e Controle TI__8eiZJutfJzGWBcLa.json` | 213 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente HelpDesk e Controle TI__8eiZJutfJzGWBcLa.json` | 241 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente HelpDesk e Controle TI__8eiZJutfJzGWBcLa.json` | 562 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente HelpDesk e Controle TI__8eiZJutfJzGWBcLa.json` | 739 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente HelpDesk e Controle TI__8eiZJutfJzGWBcLa.json` | 767 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Arquivos NAS e Conhecimento__h8Iz1QFvOJJi9CEA.json` | 78 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Arquivos NAS e Conhecimento__h8Iz1QFvOJJi9CEA.json` | 840 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 143 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 144 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 171 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 172 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 199 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 200 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 227 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 228 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 499 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 500 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 962 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 963 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 990 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 991 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 1018 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 1019 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 1046 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 1047 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 1318 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de Propostas Comerciais__7IT99SCO1c1H388N.json` | 1319 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de RH Onboarding e Offboarding__IVSV8kGMLbI77P7v.json` | 285 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de RH Onboarding e Offboarding__IVSV8kGMLbI77P7v.json` | 308 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de RH Onboarding e Offboarding__IVSV8kGMLbI77P7v.json` | 830 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - Agente de RH Onboarding e Offboarding__IVSV8kGMLbI77P7v.json` | 853 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 25 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 59 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 79 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 99 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 119 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 139 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 159 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 179 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 199 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 219 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 468 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 822 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 856 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 876 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 896 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 916 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 936 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 956 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 976 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 996 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 1016 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/ai/AI - PORTAL VESPER - War Room Executivo__ZUw5rYMxgWI0eXn4.json` | 1265 | `Bearer` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/CORE - Approval Center__aY5nyRrZ3ugYT6ZH.json` | 260 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/CORE - Approval Center__aY5nyRrZ3ugYT6ZH.json` | 261 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/core/CORE - Approval Center__aY5nyRrZ3ugYT6ZH.json` | 442 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/CORE - Approval Center__aY5nyRrZ3ugYT6ZH.json` | 443 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/core/CORE - Approval Center__aY5nyRrZ3ugYT6ZH.json` | 1120 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/CORE - Approval Center__aY5nyRrZ3ugYT6ZH.json` | 1121 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/core/CORE - Approval Center__aY5nyRrZ3ugYT6ZH.json` | 1302 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/CORE - Approval Center__aY5nyRrZ3ugYT6ZH.json` | 1303 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/core/CORE - Error Audit Dead Letter__LpsYX0AkHTdZKw7P.json` | 67 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/core/CORE - Error Audit Dead Letter__LpsYX0AkHTdZKw7P.json` | 145 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/CORE - Error Audit Dead Letter__LpsYX0AkHTdZKw7P.json` | 146 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/core/CORE - Error Audit Dead Letter__LpsYX0AkHTdZKw7P.json` | 395 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/core/CORE - Error Audit Dead Letter__LpsYX0AkHTdZKw7P.json` | 473 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/CORE - Error Audit Dead Letter__LpsYX0AkHTdZKw7P.json` | 474 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/core/CORE - Gateway Supervisor__IkWAyy2BUsVgN4to.json` | 120 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/CORE - Gateway Supervisor__IkWAyy2BUsVgN4to.json` | 135 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/CORE - Gateway Supervisor__IkWAyy2BUsVgN4to.json` | 1089 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/CORE - Gateway Supervisor__IkWAyy2BUsVgN4to.json` | 1104 | `senha` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/WAR ROOM - Observability__THg5NXA3w6kKyFJT.json` | 119 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/WAR ROOM - Observability__THg5NXA3w6kKyFJT.json` | 210 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/WAR ROOM - Observability__THg5NXA3w6kKyFJT.json` | 230 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/WAR ROOM - Observability__THg5NXA3w6kKyFJT.json` | 231 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/core/WAR ROOM - Observability__THg5NXA3w6kKyFJT.json` | 261 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/WAR ROOM - Observability__THg5NXA3w6kKyFJT.json` | 262 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/core/WAR ROOM - Observability__THg5NXA3w6kKyFJT.json` | 292 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/WAR ROOM - Observability__THg5NXA3w6kKyFJT.json` | 293 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/core/WAR ROOM - Observability__THg5NXA3w6kKyFJT.json` | 323 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/WAR ROOM - Observability__THg5NXA3w6kKyFJT.json` | 324 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/core/WAR ROOM - Observability__THg5NXA3w6kKyFJT.json` | 354 | `Authorization` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| `N8N/workflows/core/WAR ROOM - Observability__THg5NXA3w6kKyFJT.json` | 355 | `API_KEY` | BAIXA | placeholder ou referencia por variavel | mantido |
| `N8N/workflows/core/WAR ROOM - Observability__THg5NXA3w6kKyFJT.json` | 378 | `token` | MEDIA | referencia sensivel a revisar | revisado; sem valor impresso no relatorio |
| ... | ... | ... | ... | Relatorio truncado | 424 ocorrencias adicionais omitidas |
