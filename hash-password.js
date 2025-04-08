   // hash-password.js
   const bcrypt = require('bcrypt');
   const readline = require('readline').createInterface({
     input: process.stdin,
     output: process.stdout,
   });

   // Número de "salt rounds" - 10 a 12 é geralmente recomendado.
   const saltRounds = 10;

   readline.question('Digite a nova senha que deseja hashear: ', (password) => {
     if (!password) {
       console.error('Erro: Nenhuma senha foi fornecida.');
       readline.close();
       process.exit(1);
     }

     try {
       // Gera o hash de forma síncrona (mais simples para scripts)
       const hashedPassword = bcrypt.hashSync(password, saltRounds);

       console.log('\nSenha Hasheada (copie este valor):');
       console.log(hashedPassword);

     } catch (error) {
       console.error('Erro ao gerar o hash:', error);
     } finally {
       readline.close();
     }
   });