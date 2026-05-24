<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            $this->fixSqlite();
        } elseif ($driver === 'mysql') {
            $this->fixMysql();
        }
    }

    private function fixSqlite(): void
    {
        $ddl = DB::selectOne(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='publicacao'"
        )?->sql ?? '';

        if (str_contains(strtoupper($ddl), 'AUTOINCREMENT')) {
            return;
        }

        DB::statement('PRAGMA foreign_keys = OFF');

        DB::statement('
            CREATE TABLE "publicacao_new" (
                "id" INTEGER PRIMARY KEY AUTOINCREMENT,
                "titulo" varchar(512),
                "local_publicacao_id" int not null,
                "ano" int not null,
                "volume" varchar(255),
                "numero" varchar(255),
                "pagina" varchar(255),
                "isbn" varchar(255),
                "resumo" text,
                "link" varchar(512),
                "incluida_em" timestamp,
                "editada_em" timestamp,
                "turma_id" int,
                "eixo_tematico_id" int,
                "segmento_educacional_id" int,
                "tipo_instituicao_id" int,
                "qualis_capes_id" int,
                "tipo_publicacao_id" integer,
                "forma_apresentacao_id" integer,
                "doi" varchar,
                FOREIGN KEY("tipo_publicacao_id") REFERENCES "tipo_publicacao"("id") ON DELETE SET NULL,
                FOREIGN KEY("forma_apresentacao_id") REFERENCES "forma_apresentacao"("id") ON DELETE SET NULL
            )
        ');

        DB::statement('INSERT INTO "publicacao_new" SELECT * FROM "publicacao"');
        DB::statement('DROP TABLE "publicacao"');
        DB::statement('ALTER TABLE "publicacao_new" RENAME TO "publicacao"');

        $maxId = DB::selectOne('SELECT MAX(id) as max_id FROM "publicacao"')?->max_id ?? 0;
        DB::statement('UPDATE "sqlite_sequence" SET "seq" = ? WHERE "name" = "publicacao"', [$maxId]);

        DB::statement('CREATE INDEX "idx_publicacao_titulo" ON "publicacao" ("titulo")');

        DB::statement('PRAGMA foreign_keys = ON');
    }

    private function fixMysql(): void
    {
        $col = DB::selectOne("
            SELECT EXTRA, COLUMN_KEY
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'publicacao'
              AND COLUMN_NAME = 'id'
        ");

        if ($col && str_contains(strtolower($col->EXTRA ?? ''), 'auto_increment')) {
            return;
        }

        Schema::disableForeignKeyConstraints();
        DB::statement('ALTER TABLE publicacao MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY');
        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // Irreversível — não restaurar um id sem autoincrement
    }
};
