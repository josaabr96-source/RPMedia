# RPMedia V6 — instalação

## 1. Não apagues a V5
A V5 continua a ser o backup funcional.

## 2. Supabase
No SQL Editor, executa `supabase/migration_v6.sql` UMA vez.

A migração acrescenta:
- numeração única de álbuns e ficheiros;
- perfil com nome/bio;
- carros, feed, gostos, eventos, produtos e encomendas;
- proteção de Storage para que membros não tenham acesso a originais;
- campos para original, preview protegido e estado de processamento.

## 3. Netlify/GitHub
Substitui os ficheiros da V5 pelos ficheiros desta pasta e faz commit/push. O Netlify deverá publicar automaticamente.

## 4. Regra de segurança
O site usa a publishable key do Supabase. Nunca coloques uma `service_role`/secret key no `app.js`.

## 5. Sistema de matrículas
A V6 está preparada para o pipeline:
`original privado -> processamento -> preview desfocada -> privacy_status=ready`.

A deteção/blur automático de matrículas em fotos e, sobretudo, em vídeo NÃO é implementada com segurança apenas em HTML/JS. Para a ativar de verdade é necessário um worker/server-side com um modelo/API de deteção de matrículas e processamento de vídeo. Não coloques uma chave privada de um serviço de IA no frontend.

Até existir o worker, os ficheiros ficam como `pending` e membros não recebem o original. Administradores conseguem ver o original.

## 6. Teste depois do deploy
1. Login admin.
2. Criar álbum e confirmar número `#1`.
3. Criar segundo álbum e confirmar `#2`.
4. Upload de foto/vídeo.
5. Abrir visualizador grande, anterior/seguinte e ESC.
6. Confirmar que o admin vê o original.
7. Entrar com um membro: o membro não deve receber URL do original; verá “A aguardar pré-visualização protegida” enquanto o worker não gerar a preview.
8. Testar Feed, Carros, Eventos, Loja e Perfil.

## 7. Ativar IA de matrículas
Quando escolhermos o fornecedor de deteção, o worker deve ficar no servidor (por exemplo, Supabase Edge Function + serviço de processamento). As credenciais ficam em secrets do servidor, nunca no `app.js`.


## V6.1
Depois de `migration_v6.sql`, executar uma vez `supabase/migration_v6_1.sql`. Esta versão adiciona ordenação da galeria, navegação do visualizador respeitando filtros/pesquisa e garante nova numeração quando um ficheiro é movido para outro álbum.


### V6.1.1 fixes
If you are upgrading from V6.1, execute `supabase/migration_v6_1.sql` again. This version also fixes album numbering after all albums are deleted and ensures uploads populate the legacy required `storage_path` column.
