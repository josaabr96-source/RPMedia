# RPMedia V6 — instalação e atualização

Esta V6 parte da V5 e acrescenta:
- visualizador de fotos/vídeos em ecrã grande;
- anterior/seguinte, ESC e clique fora para fechar;
- identificação numérica dos álbuns;
- numeração dos ficheiros dentro de cada álbum;
- upload, download, criação/eliminação/movimentação de conteúdos apenas para admins na interface e nas policies novas;
- bucket privado separado `media_previews` como base para as versões protegidas.

## Passo 1 — Backup
Não apagar a V5. Guardar o ZIP atual como cópia de segurança.

## Passo 2 — Supabase
Abrir Supabase → SQL Editor → executar `supabase/migration_v6.sql` uma vez.

## Passo 3 — Confirmar admins
As contas existentes mantêm o papel que já tinham. Novas contas entram como `member`.

Para promover uma conta a admin, usar no SQL Editor:
```sql
update public.profiles
set role='admin'
where id=(select id from auth.users where email='EMAIL_AQUI');
```

## Passo 4 — GitHub
Substituir os ficheiros do repositório pelos ficheiros desta V6 e fazer commit/push.

## Passo 5 — Netlify
O Netlify deve detetar o push e fazer o deploy. Abrir o endereço do RPMedia e testar login.

## Passo 6 — Teste funcional
1. Entrar como admin.
2. Criar um álbum.
3. Confirmar que aparece `#1`, `#2`, etc.
4. Fazer upload de uma foto e de um vídeo.
5. Confirmar a numeração `#1`, `#2` dentro do álbum.
6. Clicar numa foto: deve abrir o visualizador grande.
7. Testar anterior/seguinte, ESC e fechar.
8. Testar o vídeo no visualizador.
9. Entrar com uma conta membro: não deve aparecer Upload nem Download.

## Importante — proteção de matrículas
A V6 prepara a segurança e o bucket `media_previews`, mas **não finge que o blur por IA de fotos e vídeos já está implementado**. A deteção automática de matrículas, sobretudo em vídeo, exige processamento server-side/worker e criação da versão protegida antes de a entregar aos membros.

A arquitetura prevista é:
- original → armazenamento privado, admin-only;
- processamento → deteção de matrícula + blur;
- preview protegido → `media_previews`, acessível aos membros;
- membro → nunca recebe URL do original;
- admin → poderá alternar para o original através de URL assinada.

Não colocar nenhuma `service_role`/secret key no frontend.
