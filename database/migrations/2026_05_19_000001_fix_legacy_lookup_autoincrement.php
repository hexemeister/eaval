<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Recria as tabelas de lookup do schema legado para usar INTEGER PRIMARY KEY AUTOINCREMENT.
 *
 * O banco original foi criado com "id int NOT NULL" sem autoincrement, o que impede
 * o Eloquent de inserir registros via create(). Esta migration preserva todos os dados
 * e reaplica os índices UNIQUE que já haviam sido adicionados.
 */
return new class extends Migration
{
    /** @var array<string, string> DDL das tabelas _new com schema correto */
    private array $tables = [
        'area' => "CREATE TABLE area_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome varchar(255),
            UNIQUE (nome)
        )",
        'eixo_tematico' => "CREATE TABLE eixo_tematico_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome varchar(120),
            UNIQUE (nome)
        )",
        'estado' => "CREATE TABLE estado_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sigla varchar(6),
            sigla_regiao varchar(6),
            nome varchar(30)
        )",
        'forma_apresentacao' => "CREATE TABLE forma_apresentacao_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome varchar(50)
        )",
        'local_publicacao' => "CREATE TABLE local_publicacao_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome varchar(255),
            nome_abreviado varchar(255),
            issn varchar(255),
            estado varchar(6)
        )",
        'modalidade' => "CREATE TABLE modalidade_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome varchar(50)
        )",
        'pais' => "CREATE TABLE pais_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sigla varchar(2),
            nome varchar(255)
        )",
        'palavra_chave' => "CREATE TABLE palavra_chave_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            texto varchar(255),
            frequencia int NOT NULL DEFAULT 0
        )",
        'qualis_capes' => "CREATE TABLE qualis_capes_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            classificacao varchar(50)
        )",
        'regiao' => "CREATE TABLE regiao_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sigla_pais varchar(2),
            sigla varchar(6),
            nome varchar(40)
        )",
        'segmento_educacional' => "CREATE TABLE segmento_educacional_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome varchar(50),
            UNIQUE (nome)
        )",
        'tipo_autoria' => "CREATE TABLE tipo_autoria_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome varchar(50)
        )",
        'tipo_instituicao' => "CREATE TABLE tipo_instituicao_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome varchar(50)
        )",
        'tipo_publicacao' => "CREATE TABLE tipo_publicacao_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome varchar(255)
        )",
        'turma' => "CREATE TABLE turma_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome varchar(60)
        )",
    ];

    /** @var array<string, string> Colunas a copiar na ordem correta (SELECT ... INSERT ...) */
    private array $columns = [
        'area'                 => 'id, nome',
        'eixo_tematico'        => 'id, nome',
        'estado'               => 'id, sigla, sigla_regiao, nome',
        'forma_apresentacao'   => 'id, nome',
        'local_publicacao'     => 'id, nome, nome_abreviado, issn, estado',
        'modalidade'           => 'id, nome',
        'pais'                 => 'id, sigla, nome',
        'palavra_chave'        => 'id, texto, frequencia',
        'qualis_capes'         => 'id, classificacao',
        'regiao'               => 'id, sigla_pais, sigla, nome',
        'segmento_educacional' => 'id, nome',
        'tipo_autoria'         => 'id, nome',
        'tipo_instituicao'     => 'id, nome',
        'tipo_publicacao'      => 'id, nome',
        'turma'                => 'id, nome',
    ];

    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            return;
        }

        DB::statement('PRAGMA foreign_keys = OFF');

        $recreated = [];

        foreach ($this->tables as $table => $ddl) {
            // Pula se a tabela não existe (ex: banco de testes em memória)
            $existing = DB::select("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", [$table]);
            if (empty($existing)) {
                continue;
            }

            // Pula se já tem INTEGER PRIMARY KEY (já foi corrigida ou criada corretamente)
            if (stripos($existing[0]->sql, 'integer primary key') !== false) {
                continue;
            }

            DB::statement($ddl);
            $cols = $this->columns[$table];
            DB::statement("INSERT INTO {$table}_new ({$cols}) SELECT {$cols} FROM {$table}");
            DB::statement("DROP TABLE {$table}");
            DB::statement("ALTER TABLE {$table}_new RENAME TO {$table}");
            $recreated[] = $table;
        }

        // Atualiza sqlite_sequence apenas para as tabelas efetivamente recriadas
        $seqExists = !empty(DB::select("SELECT 1 FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'"));
        if ($seqExists) {
            foreach ($recreated as $table) {
                $max = DB::table($table)->max('id') ?? 0;
                DB::table('sqlite_sequence')->updateOrInsert(['name' => $table], ['seq' => $max]);
            }
        }

        DB::statement('PRAGMA foreign_keys = ON');
    }


    public function down(): void
    {
        // Irreversível: os dados estão preservados, mas o schema original não é restaurado.
    }
};
