# Sistema de Chamados - 2Clicks

Sistema completo de chamados para a 2Clicks, destinado a pais de alunos e funcionários para registro de reclamações, denúncias, sugestões e dúvidas.

## 🎯 Funcionalidades

- **Tipos de Chamados**:
  - 📣 Reclamações
  - 🚨 Denúncias (Bullying)
  - 💡 Sugestões
  - ❓ Dúvidas (dados pessoais, ensino pedagógico, financeiro ou outros)

- **Recursos Principais**:
  - Geração automática de número de protocolo no formato `#ANO-MES-DIA-XXX`
  - Prazos de resposta diferenciados (48 horas para denúncias, 15 dias para os demais)
  - Formulário intuitivo para registro de chamados
  - Painel administrativo para gerenciamento de chamados
  - Autenticação segura para a área administrativa
  - Exportação de relatórios em CSV/PDF

## 🛠️ Tecnologias Utilizadas

- **Frontend**:
  - Next.js 14 (App Router)
  - React 19
  - TypeScript
  - Tailwind CSS
  - Shadcn UI
  - Lucide Icons

- **Backend**:
  - Next.js API Routes
  - NextAuth.js (Autenticação)
  - MongoDB Atlas (Banco de Dados)
  - Mongoose (ODM)
  - Zod (Validação)

- **Infraestrutura**:
  - Pode ser hospedado em qualquer provedor que suporte Node.js (Vercel, Netlify, etc.)
  - MongoDB Atlas para banco de dados

## 📋 Pré-requisitos

- Node.js 18.x ou superior
- NPM ou Yarn
- Conta no MongoDB Atlas (para o banco de dados)

## 🚀 Instalação e Configuração

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/2clicks/sistema-chamados.git
   cd sistema-chamados
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configure as variáveis de ambiente**:
   - Copie o arquivo `.env.local.example` para `.env.local`
   - Preencha as variáveis com suas credenciais do MongoDB Atlas e outras configurações
   - Certifique-se de definir uma chave segura para `NEXTAUTH_SECRET`

4. **Configure o MongoDB Atlas**:
   - Crie uma conta gratuita no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Crie um novo cluster e obtenha a string de conexão
   - Adicione a string de conexão no arquivo `.env.local`

5. **Execute o servidor de desenvolvimento**:
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

6. **Criar o Primeiro Usuário Administrador**:
   - Após iniciar o servidor pela primeira vez, acesse o endpoint:
   ```
   http://localhost:3000/api/admin/setup
   ```
   Este endpoint irá criar um usuário administrador com as credenciais definidas em `.env.local`

7. **Acesse a aplicação**:
   - Frontend: `http://localhost:3000/chamados`
   - Painel Admin: `http://localhost:3000/admin`

## 💼 Casos de Uso

### Usuários (Pais e Alunos)
1. Acesso à página principal de chamados
2. Seleção do tipo de chamado
3. Preenchimento do formulário
4. Envio do chamado e recebimento do protocolo
5. Acompanhamento por e-mail

### Administradores (Advogada/Equipe)
1. Login na área administrativa
2. Visualização de chamados por tipo e status
3. Análise e resposta de chamados
4. Atualização de status (Em análise, Respondido, Encaminhado)
5. Geração de relatórios

## 🔒 Segurança

- Autenticação via NextAuth.js
- Senhas criptografadas com bcrypt
- Validação de formulários com Zod
- Ações do servidor seguras com next-safe-action

## 📝 Licença

Este projeto é propriedade da 2Clicks. Todos os direitos reservados.

## 👥 Contato

Para mais informações ou suporte, entre em contato com:
- Email: contato@2clicks.tech
- Telefone: (11) 99124-9874
