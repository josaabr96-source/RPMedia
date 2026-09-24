# RPMedia V2 — instalação

Esta versão usa Supabase para Auth + Postgres + Storage privado.

## 1. Criar o projeto
1. Cria um projeto em https://supabase.com/
2. Abre SQL Editor.
3. Cola e executa `supabase/schema.sql`.
4. Em Authentication > URL Configuration, adiciona o endereço onde vais publicar o site.

## 2. Criar a conta de administrador
1. Abre o RPMedia.
2. Cria a tua conta.
3. No SQL Editor executa:
   update public.profiles set role='admin' where id=(select id from auth.users where email='O_TEU_EMAIL');

## 3. Ligar o frontend
Em `app.js`, substitui:
COLOCA_AQUI_A_SUPABASE_URL
COLOCA_AQUI_A_SUPABASE_PUBLISHABLE_KEY

Podes encontrar os dados em Project Settings > API.

NUNCA coloques a service_role/secret key no `app.js`. Apenas a publishable key é apropriada para o frontend, protegida pelas políticas RLS.

## 4. Publicar
O projeto é HTML/CSS/JS e pode ser publicado num serviço de hosting estático. Depois basta abrir o endereço no telemóvel.

## O que a V2 tem
- Login por email/password
- Criação de contas
- Sessão persistente
- Perfis member/admin
- Álbuns
- Upload real para Storage privado
- Metadados em Postgres
- Galeria de fotos
- Reprodução de vídeos
- Links de download temporários
- RLS para limitar o acesso

## Próxima melhoria recomendada
Adicionar permissões por álbum, thumbnails, upload resumível para vídeos grandes, seleção múltipla para download e uma área de administração completa.
