# Foco - MVP de Controle de Tarefas

MVP inspirado no fluxo de organizacao do Todoist, feito como projeto novo e independente do Liboro.

## Como abrir

Abra `index.html` no navegador.

Para usar a validacao de senha, crie um arquivo `config.js` baseado em `config.sample.js` e informe o hash SHA-256 da senha. O arquivo `config.js` fica fora do Git por seguranca.`n`nObservacao: essa senha e uma barreira simples no frontend para MVP estatico. Para servidor em producao, prefira autenticacao no backend ou protecao HTTP Basic no servidor.

## O que ja tem

- Projetos com cor
- Criacao, edicao e remocao de tarefas
- Prioridade: alta, media e baixa
- Status: pendente, em andamento e concluida
- Data e hora de vencimento
- Etiquetas
- Subtarefas
- Busca
- Filtros por entrada, hoje, proximas e concluidas
- Visualizacao em lista e painel
- Persistencia local com `localStorage`
- Validacao de senha com sessao local

## Proximos passos naturais

- Login e usuarios
- Backend/API
- Banco de dados
- Tarefas recorrentes
- Lembretes reais por notificacao
- Compartilhamento por equipe
- Permissoes por projeto



