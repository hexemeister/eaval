# Distribuição do Dataset Acadêmico — Design Spec

**Data:** 2026-05-14  
**Status:** Aprovado (design), não iniciado (implementação)

---

## Visão Geral

O e-Aval provê dois produtos distintos: a plataforma web e o dataset acadêmico curado por especialistas. Hoje os dois vivem misturados no mesmo banco — dados de publicações junto com dados operacionais (usuários, logs, sessões). Esta spec define a arquitetura para separar, versionar e distribuir o dataset acadêmico de forma reproduzível, sem expor dados sensíveis, e produzindo automaticamente a documentação necessária para depósito em repositórios como Zenodo.

---

## Separação de responsabilidades

### Dados acadêmicos (distribuíveis)

Tabelas que compõem o dataset público:

| Tabela | Conteúdo |
|--------|----------|
| `publicacao` | Entidade central |
| `autor`, `autor_publicacao` | Autores e vínculo com publicações |
| `palavra_chave`, `palavra_chave_publicacao` | Palavras-chave e vínculo |
| `area`, `area_publicacao` | Áreas de conhecimento e vínculo |
| `local_publicacao` | Periódicos e eventos |
| `eixo_tematico` | Eixos temáticos |
| `segmento_educacional` | Segmentos educacionais |
| `qualis_capes` | Classificações Qualis |
| `estado`, `regiao`, `pais` | Geografias |
| `tipo_publicacao`, `forma_apresentacao` | Lookups de tipo e forma |
| `turma`, `tipo_instituicao` | Lookups legados com dado |

### Dados operacionais (nunca distribuídos)

`users`, `sessions`, `cache`, `cache_locks`, `search_logs`, `visitante`, `pesquisa`, `usuario`, `jobs`, `job_batches`, `failed_jobs`, `password_reset_tokens`

---

## Seeders como fonte de verdade para lookups

Tabelas de lookup estáveis (poucas linhas, mudam raramente) são representadas como seeders Laravel versionados no repositório. São a base para instalação do zero.

Seeders a criar:

| Seeder | Tabela | Aprox. linhas |
|--------|--------|---------------|
| `QualisCapesSeeder` | `qualis_capes` | ~8 |
| `EstadoSeeder` | `estado` | 27 |
| `RegiaoSeeder` | `regiao` | 5 |
| `PaisSeeder` | `pais` | ~1 (Brasil) + internacionais |
| `EixoTematicoSeeder` | `eixo_tematico` | ~10 |
| `SegmentoEducacionalSeeder` | `segmento_educacional` | ~10 |
| `TipoPublicacaoSeeder` | `tipo_publicacao` | 5 |
| `FormaApresentacaoSeeder` | `forma_apresentacao` | 1 |
| `TurmaSeeder` | `turma` | 11 |
| `TipoInstituicaoSeeder` | `tipo_instituicao` | 4 |

Um `DatabaseSeeder` orquestra todos em ordem correta respeitando dependências de FK.

---

## Versionamento semântico do dataset

O dataset tem versionamento próprio, independente da versão da plataforma.

### Arquivo `dataset.json` (raiz do projeto)

```json
{
    "version": "1.0.0",
    "released_at": null,
    "platform_version_min": "1.0.0",
    "description": "Dataset do estado da arte da produção científica em Avaliação no Brasil (2001–2025)"
}
```

### Convenção de versões

- **MAJOR** — revisão de qualidade significativa (dados corrigidos em massa, estrutura de tabelas alterada)
- **MINOR** — adição de novas publicações ou novos campos
- **PATCH** — correções pontuais (typos, links quebrados, metadados faltantes)

### Comando de bump

```bash
php artisan dataset:bump patch   # 1.0.0 → 1.0.1
php artisan dataset:bump minor   # 1.0.0 → 1.1.0
php artisan dataset:bump major   # 1.0.0 → 2.0.0
```

O comando atualiza `dataset.json`, registra a data e abre espaço para o changelog da versão.

---

## Comando de exportação

```bash
php artisan dataset:export [--output=./dist]
```

Produz o diretório `dist/eaval-academic-v{VERSION}/` com:

```
eaval-academic-v1.0.0/
├── eaval-academic-v1.0.0.sqlite     # banco com apenas tabelas acadêmicas
├── eaval-academic-v1.0.0.sql        # dump SQL (compatível MySQL/PostgreSQL)
├── README.md                        # gerado automaticamente (ver seção abaixo)
├── README.pdf                       # compilado do README.md via Pandoc
├── schema.json                      # estrutura de todas as tabelas exportadas
├── data-dictionary.md               # dicionário de dados gerado
├── data-dictionary.pdf              # compilado do dicionário
├── datacite.json                    # metadados DataCite para Zenodo
├── CITATION.cff                     # metadados de citação para GitHub/Zenodo
└── CHANGELOG.md                     # histórico de versões do dataset
```

O diretório `dist/` fica no `.gitignore` — nunca commitado.

### README.md gerado automaticamente

Conteúdo gerado a partir dos dados reais no momento da exportação:

```markdown
# e-Aval Academic Dataset v{VERSION}

Dataset do estado da arte da produção científica em Avaliação no Brasil,
organizado pelo projeto e-Aval (UFX / Programa de Pós-Graduação em ...).

## Estatísticas

- **Total de publicações:** {COUNT}
- **Período coberto:** {ANO_MIN} – {ANO_MAX}
- **Autores únicos:** {COUNT}
- **Periódicos/eventos:** {COUNT}
- **Palavras-chave únicas:** {COUNT}

### Distribuição por área de conhecimento
| Área | Publicações |
...gerado dinamicamente...

### Distribuição por ano
...gerado dinamicamente...

## Estrutura do banco de dados

{diagrama textual das tabelas e relacionamentos}

## Como usar

### SQLite
sqlite3 eaval-academic-v{VERSION}.sqlite

### MySQL / PostgreSQL
mysql -u user -p database < eaval-academic-v{VERSION}.sql

## Citação

{bloco BibTeX gerado do datacite.json}

## Licença

{LICENSE}
```

### `datacite.json` gerado automaticamente

Segue o schema DataCite 4.x para depósito no Zenodo:

```json
{
    "title": "e-Aval Academic Dataset v{VERSION}",
    "description": "...",
    "version": "{VERSION}",
    "publication_date": "{DATE}",
    "creators": [...],
    "keywords": ["avaliação educacional", "estado da arte", "SciELO", "Brasil"],
    "license": "CC-BY-4.0",
    "related_identifiers": [
        {
            "relation": "isNewVersionOf",
            "identifier": "10.5281/zenodo.{DOI_VERSAO_ANTERIOR}"
        }
    ]
}
```

O DOI da versão anterior é lido de `dataset.json` — atualizado manualmente após cada depósito no Zenodo.

### `schema.json` gerado automaticamente

Introspectado do banco via `PRAGMA table_info()` (SQLite) ou `information_schema` (MySQL). Descreve cada tabela, suas colunas, tipos, nullable e FKs.

### `data-dictionary.md` gerado automaticamente

Para cada tabela acadêmica, gera uma seção com:
- Descrição da tabela
- Tabela de colunas: nome, tipo, descrição, exemplo de valor real
- Relacionamentos

As descrições são lidas de um arquivo de metadados `docs/dataset/column-descriptions.yml` mantido manualmente — a geração automática busca lá, e usa o nome da coluna como fallback se não tiver descrição.

---

## Comando de importação (bootstrap)

```bash
php artisan dataset:import ./eaval-academic-v1.0.0.sqlite
```

O comando:
1. Valida que a versão do dataset é compatível com `platform_version_min` do `dataset.json`
2. Importa apenas as tabelas acadêmicas (lista explícita — nunca sobrescreve operacionais)
3. Exibe resumo: N publicações importadas, N autores, etc.

---

## Bootstrap de instalação do zero

Sequência completa para restaurar uma instância:

```bash
# 1. Schema
php artisan migrate

# 2. Lookups estáveis
php artisan db:seed

# 3. Dataset acadêmico (baixar a versão desejada do GitHub Releases)
php artisan dataset:import ./eaval-academic-v1.0.0.sqlite

# 4. Usuário admin
php artisan make:admin
```

O `make:admin` é um comando interativo que solicita nome, email e senha — nenhuma credencial vai para o repositório.

---

## CI/CD — GitHub Actions

### Workflow `dataset-export.yml`

Disparado manualmente (`workflow_dispatch`) com input de nível do bump (`patch`/`minor`/`major`):

```yaml
on:
  workflow_dispatch:
    inputs:
      bump:
        description: 'Versão a bumpar (patch/minor/major)'
        required: true
        default: 'patch'
```

Passos:
1. Checkout + setup PHP + `composer install`
2. Baixar o banco de produção (via SSH/rsync — credenciais como secrets)
3. `php artisan dataset:bump {bump}`
4. `php artisan dataset:export --output=./dist`
5. Compilar PDFs via Pandoc (`README.md` → `README.pdf`, `data-dictionary.md` → `data-dictionary.pdf`)
6. Criar GitHub Release com tag `dataset-v{VERSION}` e todos os artefatos do `dist/`
7. Commit do `dataset.json` atualizado de volta para `main`

O banco de produção nunca é commitado — é baixado no CI, usado para exportação e descartado.

### Dependência: Pandoc

O runner do GitHub Actions já tem Pandoc disponível (`apt-get install pandoc -y`) ou pode ser instalado via `docker://pandoc/latex` para PDFs com LaTeX.

---

## Arquivo de metadados de colunas

`docs/dataset/column-descriptions.yml` — mantido manualmente, versionado no repo:

```yaml
publicacao:
  titulo: "Título completo da publicação"
  ano: "Ano de publicação"
  isbn: "ISBN ou ISSN do veículo de publicação"
  resumo: "Resumo em português"
  link: "URL de acesso ao texto completo"
  tipo: "Tipo da publicação (ex: Artigo)"
  forma: "Forma de apresentação (ex: On-line)"

autor:
  nome: "Nome completo do autor conforme indexado"

palavra_chave:
  texto: "Palavra-chave normalizada em maiúsculas"
```

Colunas sem entrada aqui aparecem no dicionário com a descrição "—".

---

## Manutenção contínua

Qualquer alteração futura no banco ou nos models precisa ser avaliada quanto ao impacto na exportação e na importação. Checklist a seguir sempre que houver:

- **Nova tabela acadêmica** — adicionar à lista de tabelas exportadas no `dataset:export` e à lista de tabelas importadas no `dataset:import`; adicionar descrição em `column-descriptions.yml`; atualizar `schema.json` e `data-dictionary.md` (automático na próxima exportação)
- **Nova coluna em tabela acadêmica** — adicionar descrição em `column-descriptions.yml`; avaliar se requer bump de versão (MINOR se nova informação, PATCH se apenas metadado)
- **Coluna removida ou renomeada** — bump MAJOR obrigatório; atualizar `dataset:import` para lidar com datasets antigos (mapeamento de compatibilidade ou rejeição com mensagem clara)
- **Nova tabela operacional** — confirmar explicitamente que está fora da lista de exportação
- **Mudança de relacionamento entre tabelas acadêmicas** — avaliar impacto no `schema.json` e no dicionário; pode exigir bump MAJOR
- **Revisão de qualidade dos dados** — sempre acompanhada de bump de versão antes da exportação

---

## O que não está no escopo desta spec

- Depósito automatizado no Zenodo (manual, feito pelo mantenedor após baixar os artefatos do GitHub Release)
- Interface web para download do dataset (pode ser adicionada futuramente como página `/dados`)
- Versionamento diferencial (exportar apenas o delta entre versões)
- Múltiplos idiomas na documentação gerada
