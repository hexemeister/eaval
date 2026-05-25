<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            // 1. Dropa FKs em local_publicacao_id antes de qualquer ALTER (necessário antes de modificar colunas)
            $fks = DB::select(
                "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'publicacao'
                 AND COLUMN_NAME = 'local_publicacao_id' AND REFERENCED_TABLE_NAME IS NOT NULL"
            );
            foreach ($fks as $fk) {
                DB::statement("ALTER TABLE `publicacao` DROP FOREIGN KEY `{$fk->CONSTRAINT_NAME}`");
            }

            // 2. Upgrade local_publicacao.id para BIGINT UNSIGNED se ainda for INT (banco legado)
            $col = DB::selectOne(
                "SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'local_publicacao' AND COLUMN_NAME = 'id'"
            );
            if ($col && strtolower($col->DATA_TYPE) !== 'bigint') {
                DB::statement("ALTER TABLE `local_publicacao` MODIFY `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT");
            }
        }

        Schema::table('publicacao', function (Blueprint $table) {
            $table->unsignedBigInteger('local_publicacao_id')->nullable()->change();
        });

        // Re-adiciona FK após a modificação
        if (DB::getDriverName() === 'mysql') {
            $exists = DB::select(
                "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'publicacao'
                 AND COLUMN_NAME = 'local_publicacao_id' AND REFERENCED_TABLE_NAME IS NOT NULL"
            );
            if (empty($exists)) {
                Schema::table('publicacao', function (Blueprint $table) {
                    $table->foreign('local_publicacao_id')
                        ->references('id')->on('local_publicacao')
                        ->nullOnDelete();
                });
            }
        }
    }

    public function down(): void
    {
        Schema::table('publicacao', function (Blueprint $table) {
            $table->unsignedBigInteger('local_publicacao_id')->nullable(false)->change();
        });
    }
};
