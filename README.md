# Focus

Focus e uma aplicacao pessoal para organizar rotina e financas em um unico lugar, sem virar um ERP pessoal.

Conceito do produto: **Focus em voce.**

## Ambientes

### Minha Rotina

Mantem o controle de tarefas existente:

- Entrada, Hoje, Proximas e Concluidas
- Projetos
- Criacao, edicao e exclusao de tarefas
- Prioridades, status, datas e etiquetas
- Subtarefas
- Links por tarefa
- Filtro por periodo de datas
- Visualizacao em lista, painel/Kanban e agrupamento por data expansivel
- Nicho Dev com status: Analise, Em progresso, Dev teste, SDX teste, Producao e Finalizado

### Minhas Financas

Controle financeiro pessoal simples:

- Visao geral financeira
- Saldo consolidado das contas
- Receitas, despesas e resultado do mes
- Proximos pagamentos
- Ultimos lancamentos
- Lancamentos de receita/despesa
- Contas
- Cartoes
- Categorias

Nao ha integracao bancaria, Open Finance, OFX ou APIs externas financeiras.

## Arquitetura

A arquitetura continua simples:

- Node.js puro
- HTML
- CSS
- JavaScript
- `data.json`
- AES-256-GCM
- Sessao via cookie HttpOnly
- Sem banco de dados externo
- Sem React/Next.js/framework

## Como rodar localmente

```powershell
cd C:\focus
node server.js
```

Depois acesse:

```text
http://localhost:3000
```

## Senha e privacidade dos dados

A senha nao fica no frontend. O servidor le o hash SHA-256 em `config.server.json` ou na variavel de ambiente `FOCUS_PASSWORD_HASH`.

O arquivo `data.json` fica criptografado com AES-256-GCM. A chave de criptografia e derivada da senha, entao abrir o arquivo direto no servidor mostra apenas dados cifrados.

Para isolamento melhor no Windows Server, rode o Focus em um usuario do Windows separado e restrinja a pasta `C:\focus` via permissao NTFS.

## Estrutura do state

A estrutura atual suporta dados antigos e novos:

```json
{
  "tasks": [],
  "projects": [],
  "activity": [],
  "preferences": {
    "activeModule": "routine"
  },
  "finance": {
    "activeView": "overview",
    "accounts": [],
    "cards": [],
    "categories": [],
    "transactions": []
  }
}
```

## Compatibilidade

Arquivos `data.json` antigos continuam compativeis. Ao carregar dados antigos, o frontend normaliza o state adicionando `preferences` e `finance`, sem apagar tarefas, projetos, subtarefas, links, status Dev ou historico existente.

## Publicar no Windows Server

1. Instale o Node.js LTS.
2. Copie a pasta do projeto para `C:\focus`.
3. Crie `C:\focus\config.server.json` com `passwordHash` e `encryptionSalt`.
4. Rode `node server.js` para testar.
5. Use PM2 para manter em execucao.
6. Libere a porta ou configure IIS como proxy reverso.
7. Use HTTPS ao expor para internet.

## Proximos passos

- Instalar proxy reverso no IIS com HTTPS
- Backup automatico do `data.json`
- Assistente pessoal
- Comandos em linguagem natural
- Entrada por voz
- Notificacoes
- Tarefas recorrentes
