# Focus

Focus e uma aplicacao pessoal para organizar rotina e financas em um unico lugar, com acesso familiar protegido.

Conceito do produto: **Focus em voce.**

## Ambientes

### Minha Rotina

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

- Visao geral financeira
- Saldo consolidado das contas
- Receitas, despesas e resultado do mes
- Proximos pagamentos
- Ultimos lancamentos
- Lancamentos de receita/despesa
- Contas
- Cartoes
- Categorias
- Familia: membros vinculados ao mesmo controle financeiro
- Convite por email com codigo para criar usuario familiar

Nao ha integracao bancaria, Open Finance, OFX ou APIs externas financeiras.

## Arquitetura

- Node.js puro
- HTML, CSS e JavaScript
- SQLite em `C:\focus\data\focus.db`
- Tenant/familia com usuarios vinculados
- Senhas com hash `scrypt` e salt individual
- Codigo de recuperacao de senha por usuario
- Sessao via cookie HttpOnly
- Sem React/Next.js/framework

## Como rodar localmente

```powershell
cd C:\focus
npm install
node server.js
```

Depois acesse:

```text
http://localhost:3000
```

No primeiro acesso, use **Criar familia**. Esse cadastro cria:

- o primeiro usuario dono;
- o tenant/familia;
- o arquivo SQLite em `C:\focus\data\focus.db`.

Guarde o codigo de recuperacao mostrado no cadastro. Ele e necessario para trocar a senha sem e-mail automatico.

## Usuarios e familia

O dono da familia pode gerar convites em **Minhas Financas > Visao geral > Familia**.

Fluxo:

1. Informe o email do familiar.
2. O Focus gera um codigo de convite.
3. A pessoa abre o Focus, entra na aba **Convite**, informa nome, email, senha e codigo.
4. Ela passa a enxergar os mesmos dados do tenant/familia.

Todos os usuarios vinculados ao mesmo tenant compartilham tarefas, contas, cartoes, categorias e lancamentos.

## Recuperacao de senha

Como o app nao envia email ainda, a recuperacao usa codigo de recuperacao.

1. No cadastro, guarde o codigo exibido.
2. Para trocar a senha, abra a aba **Recuperar**.
3. Informe email, codigo de recuperacao e nova senha.
4. O app gera um novo codigo; guarde o novo e descarte o antigo.

## Dados e backup

O banco fica em:

```text
C:\focus\data\focus.db
```

Essa pasta esta no `.gitignore` e nao vai para o GitHub.

Backup recomendado no Windows Server:

```powershell
Copy-Item C:\focus\data\focus.db C:\focus\data\backups\focus-$(Get-Date -Format yyyyMMdd-HHmmss).db
```

Para seguranca no servidor, mantenha o Focus em um usuario Windows separado e restrinja a pasta `C:\focus` via permissao NTFS.

## Publicar no Windows Server

1. Instale o Node.js LTS.
2. Copie ou atualize o projeto em `C:\focus`.
3. Rode:

```powershell
cd C:\focus
npm install
pm2 restart focus
```

4. Libere a porta ou configure IIS como proxy reverso.
5. Use HTTPS ao expor para internet.

## Compatibilidade

O `data.json` antigo nao e mais usado como banco principal. Ele pode ficar como arquivo legado/backup. Os novos dados ficam no SQLite.

## Proximos passos

- Backup automatico agendado do `focus.db`
- Envio real de email para convite e recuperacao
- Permissoes por papel alem de dono/membro
- Auditoria de quem criou ou alterou lancamentos
- IIS com HTTPS como proxy reverso
