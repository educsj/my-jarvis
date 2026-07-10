# Base de Conhecimento do Jarvis / Jarvis Knowledge Base

**PT-BR:** Coloque nesta pasta os documentos que você quer que o Jarvis consulte
para responder (`.txt`, `.md`, `.pdf`, `.docx`, `.csv`, `.xlsx`). Você pode
organizar em subpastas por assunto (ex.: `trabalho/`, `projetos/`, `pessoal/`).
Depois, reindexe pelo painel (botão **Reindexar**) ou via `POST /knowledge/reindex`.

Como esta pasta fica dentro do seu diretório sincronizado (OneDrive/Drive), os
arquivos ficam disponíveis remotamente sem precisar copiá-los para o celular — o
app mobile acessa o backend pelo túnel.

> Os documentos pessoais são ignorados pelo Git (veja `.gitignore`); apenas este
> arquivo de exemplo é versionado.

---

**EN:** Drop the documents you want Jarvis to use as context here (`.txt`, `.md`,
`.pdf`, `.docx`, `.csv`, `.xlsx`). You can organize them into subfolders by topic
(e.g., `work/`, `projects/`, `personal/`). Then reindex from the dashboard
(**Reindex** button) or via `POST /knowledge/reindex`.

Personal documents are ignored by Git (see `.gitignore`); only this example file
is versioned.
