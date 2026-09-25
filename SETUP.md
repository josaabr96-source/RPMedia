# RPMedia V5

## Novidades
- 🗑️ Admin pode apagar uma foto/vídeo individual.
- 🗑️ Admin pode apagar um álbum e os ficheiros que estão dentro dele.
- 📁 Admin pode mover ficheiros existentes para outro álbum.
- 📤 O upload continua a ser feito para o álbum selecionado.
- 🔐 Apagar/mover fica protegido por RLS no Supabase e não apenas pelo botão da página.

## Atualização do Supabase
1. Abrir o projeto RPMedia no Supabase.
2. Ir a **SQL Editor**.
3. Executar o conteúdo de `supabase/migration_delete_organize.sql` uma vez.
4. Não é necessário apagar as tabelas nem os ficheiros existentes.

## Netlify / GitHub
Substituir os ficheiros `index.html`, `app.js` e `style.css` do repositório pelos desta versão. O Supabase continua com o mesmo URL e publishable key.
