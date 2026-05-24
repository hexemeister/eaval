<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

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
        DB::statement('PRAGMA foreign_keys = OFF');

        // ── autor_publicacao ───────────────────────────────────────────────────
        $ddl = DB::selectOne(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='autor_publicacao'"
        )?->sql ?? '';

        if (str_contains(strtolower($ddl), '"id"') || str_contains(strtolower($ddl), '`id`') || preg_match('/\bid\b/i', $ddl)) {
            DB::statement('
                CREATE TABLE "autor_publicacao_new" (
                    "autor_id"      int NOT NULL,
                    "publicacao_id" int NOT NULL,
                    "ordem"         smallint NOT NULL
                )
            ');
            DB::statement('INSERT INTO "autor_publicacao_new" SELECT "autor_id", "publicacao_id", "ordem" FROM "autor_publicacao"');
            DB::statement('DROP TABLE "autor_publicacao"');
            DB::statement('ALTER TABLE "autor_publicacao_new" RENAME TO "autor_publicacao"');
        }

        // ── palavra_chave_publicacao ───────────────────────────────────────────
        $ddl2 = DB::selectOne(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='palavra_chave_publicacao'"
        )?->sql ?? '';

        if (str_contains(strtolower($ddl2), '"id"') || str_contains(strtolower($ddl2), '`id`') || preg_match('/\bid\b/i', $ddl2)) {
            DB::statement('
                CREATE TABLE "palavra_chave_publicacao_new" (
                    "publicacao_id"    int NOT NULL,
                    "palavra_chave_id" int NOT NULL
                )
            ');
            DB::statement('INSERT INTO "palavra_chave_publicacao_new" SELECT "publicacao_id", "palavra_chave_id" FROM "palavra_chave_publicacao"');
            DB::statement('DROP TABLE "palavra_chave_publicacao"');
            DB::statement('ALTER TABLE "palavra_chave_publicacao_new" RENAME TO "palavra_chave_publicacao"');
        }

        DB::statement('PRAGMA foreign_keys = ON');
    }

    private function fixMysql(): void
    {
        foreach (['autor_publicacao', 'palavra_chave_publicacao'] as $table) {
            $col = DB::selectOne("
                SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME   = ?
                  AND COLUMN_NAME  = 'id'
            ", [$table]);

            if ($col) {
                DB::statement("ALTER TABLE `{$table}` DROP COLUMN `id`");
            }
        }

        // Remove coluna legada novo_id de palavra_chave_publicacao se existir
        $col = DB::selectOne("
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME   = 'palavra_chave_publicacao'
              AND COLUMN_NAME  = 'novo_id'
        ");
        if ($col) {
            DB::statement('ALTER TABLE `palavra_chave_publicacao` DROP COLUMN `novo_id`');
        }
    }

    public function down(): void
    {
        // Irreversível — não restaurar colunas legadas sem dados
    }
};
