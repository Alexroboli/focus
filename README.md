# Foco - Controle de Tarefas

Aplicacao pessoal para controle de tarefas, com login simples no servidor e dados compartilhados entre dispositivos.

## Como rodar localmente

```powershell
cd C:\focus
node server.js
```

Depois acesse:

```text
http://localhost:3000
```

## Senha

A senha nao fica no frontend. O servidor le o hash SHA-256 em `config.server.json` ou na variavel de ambiente `FOCUS_PASSWORD_HASH`.

No Windows PowerShell, gere o hash assim:

```powershell
$password = "sua-senha-aqui"
$sha = [System.Security.Cryptography.SHA256]::Create()
$bytes = [System.Text.Encoding]::UTF8.GetBytes($password)
(($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') }) -join '')
```

Copie o resultado para `config.server.json` usando o formato de `config.server.sample.json`.

## Publicar no Windows Server

1. Instale o Node.js LTS no servidor.
2. Copie a pasta do projeto para o servidor, por exemplo `C:\focus`.
3. Crie `C:\focus\config.server.json` com o hash da senha.
4. Rode `node server.js` para testar.
5. Libere a porta `3000` no firewall ou configure IIS/Nginx como proxy reverso para `http://localhost:3000`.
6. Use HTTPS quando expor para internet.

## Dados

As tarefas ficam salvas no arquivo `data.json`, criado automaticamente no servidor. Esse arquivo esta no `.gitignore` para nao subir seus dados pessoais ao GitHub.

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
- Login com cookie de sessao HttpOnly
- Persistencia compartilhada no servidor

## Proximos passos naturais

- Instalar como servico do Windows
- Configurar proxy reverso no IIS
- HTTPS com certificado valido
- Backup automatico do `data.json`
- Tarefas recorrentes
- Lembretes por e-mail ou notificacao
