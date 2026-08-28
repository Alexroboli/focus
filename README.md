# Foco - Controle de Tarefas

Aplicacao pessoal para controle de tarefas, com login no servidor e dados compartilhados entre dispositivos.

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

O arquivo `data.json` tambem fica protegido: ele e salvo criptografado com AES-256-GCM. A chave de criptografia e derivada da sua senha, entao abrir o arquivo direto no servidor mostra apenas dados cifrados.

Importante: isso protege contra leitura casual do arquivo `data.json`. Se outra pessoa tiver acesso administrativo total ao servidor, ela ainda pode alterar arquivos da aplicacao, capturar processos ou mudar configuracoes. Para isolamento forte entre socios no mesmo servidor, o ideal e rodar o Focus em um usuario do Windows separado, com permissao NTFS exclusiva na pasta `C:\focus`.

No Windows PowerShell, gere o hash da senha assim:

```powershell
$password = "sua-senha-aqui"
$sha = [System.Security.Cryptography.SHA256]::Create()
$bytes = [System.Text.Encoding]::UTF8.GetBytes($password)
(($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') }) -join '')
```

Crie tambem um salt de criptografia:

```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(16))
```

Copie os dois valores para `config.server.json`, usando o formato de `config.server.sample.json`.

## Publicar no Windows Server

1. Instale o Node.js LTS no servidor.
2. Copie a pasta do projeto para o servidor, por exemplo `C:\focus`.
3. Crie `C:\focus\config.server.json` com `passwordHash` e `encryptionSalt`.
4. Rode `node server.js` para testar.
5. Libere a porta `3000` no firewall ou configure IIS/Nginx como proxy reverso para `http://localhost:3000`.
6. Use HTTPS quando expor para internet.
7. Restrinja as permissoes NTFS da pasta `C:\focus` ao seu usuario e ao usuario que roda o servico.

## Dados

As tarefas ficam salvas em `data.json`, criado automaticamente no servidor. Esse arquivo esta no `.gitignore` para nao subir seus dados pessoais ao GitHub.

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
- `data.json` criptografado no disco

## Proximos passos naturais

- Instalar como servico do Windows
- Configurar proxy reverso no IIS
- HTTPS com certificado valido
- Backup automatico do `data.json`
- Tarefas recorrentes
- Lembretes por e-mail ou notificacao
