<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Remove a UNIQUE KEY (publicacao_id, ordem) legada, se existir — precisa sair
        // antes da coluna, senão o MySQL recusa o DROP COLUMN.
        $index = DB::selectOne("
            SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME   = 'palavra_chave_publicacao'
              AND INDEX_NAME   = 'publicacao_id'
        ");
        if ($index) {
            DB::statement('ALTER TABLE `palavra_chave_publicacao` DROP INDEX `publicacao_id`');
        }

        // Remove a coluna legada ordem — não é usada por nenhuma relação/query da
        // aplicação (só autor_publicacao.ordem é, para manter a ordem dos autores).
        // Sem isso, todo insert cai no DEFAULT '1' e o segundo palavra-chave de uma
        // publicação colide com o primeiro, causando erro 500 (SQLSTATE 23000/1062).
        $col = DB::selectOne("
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME   = 'palavra_chave_publicacao'
              AND COLUMN_NAME  = 'ordem'
        ");
        if ($col) {
            DB::statement('ALTER TABLE `palavra_chave_publicacao` DROP COLUMN `ordem`');
        }
    }

    public function down(): void
    {
        // Irreversível — não restaurar coluna legada sem dados
    }
};
