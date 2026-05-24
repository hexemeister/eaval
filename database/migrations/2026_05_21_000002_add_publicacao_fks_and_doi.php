<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Em MySQL: garante que os ids das tabelas de lookup são BIGINT UNSIGNED
        // (bancos legados podem ter INT, mas migrações novas criam com $table->id() = BIGINT UNSIGNED)
        if (DB::getDriverName() === 'mysql') {
            foreach (['tipo_publicacao', 'forma_apresentacao'] as $lookup) {
                $col = DB::selectOne(
                    "SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'id'",
                    [$lookup]
                );
                if ($col && strtolower($col->DATA_TYPE) !== 'bigint') {
                    Schema::disableForeignKeyConstraints();
                    DB::statement("ALTER TABLE `{$lookup}` MODIFY `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT");
                    Schema::enableForeignKeyConstraints();
                }
            }
        }

        // Adiciona colunas somente se ainda não existem (idempotente para re-execução)
        if (!Schema::hasColumn('publicacao', 'tipo_publicacao_id')) {
            Schema::table('publicacao', function (Blueprint $table) {
                $table->unsignedBigInteger('tipo_publicacao_id')->nullable()->after('tipo');
            });
        }
        if (!Schema::hasColumn('publicacao', 'forma_apresentacao_id')) {
            Schema::table('publicacao', function (Blueprint $table) {
                $table->unsignedBigInteger('forma_apresentacao_id')->nullable()->after('forma');
            });
        }
        if (!Schema::hasColumn('publicacao', 'doi')) {
            Schema::table('publicacao', function (Blueprint $table) {
                $table->string('doi')->nullable()->after('isbn');
            });
        }

        // Migrar tipo (string) → tipo_publicacao_id, somente onde ainda nulo
        if (Schema::hasColumn('publicacao', 'tipo')) {
            DB::table('tipo_publicacao')->get()->each(function ($tp) {
                DB::table('publicacao')
                    ->whereNull('tipo_publicacao_id')
                    ->whereRaw('LOWER(TRIM(tipo)) = ?', [strtolower(trim($tp->nome))])
                    ->update(['tipo_publicacao_id' => $tp->id]);
            });
        }

        // Migrar forma (string) → forma_apresentacao_id, somente onde ainda nulo
        if (Schema::hasColumn('publicacao', 'forma')) {
            DB::table('forma_apresentacao')->get()->each(function ($fa) {
                DB::table('publicacao')
                    ->whereNull('forma_apresentacao_id')
                    ->whereRaw('LOWER(TRIM(forma)) = ?', [strtolower(trim($fa->nome))])
                    ->update(['forma_apresentacao_id' => $fa->id]);
            });
        }

        // Adiciona FKs somente se ainda não existem
        if (DB::getDriverName() === 'mysql') {
            $fkTipo = DB::select(
                "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'publicacao'
                 AND COLUMN_NAME = 'tipo_publicacao_id' AND REFERENCED_TABLE_NAME IS NOT NULL"
            );
            if (empty($fkTipo)) {
                Schema::table('publicacao', function (Blueprint $table) {
                    $table->foreign('tipo_publicacao_id')
                        ->references('id')->on('tipo_publicacao')
                        ->nullOnDelete();
                });
            }

            $fkForma = DB::select(
                "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'publicacao'
                 AND COLUMN_NAME = 'forma_apresentacao_id' AND REFERENCED_TABLE_NAME IS NOT NULL"
            );
            if (empty($fkForma)) {
                Schema::table('publicacao', function (Blueprint $table) {
                    $table->foreign('forma_apresentacao_id')
                        ->references('id')->on('forma_apresentacao')
                        ->nullOnDelete();
                });
            }
        } else {
            Schema::table('publicacao', function (Blueprint $table) {
                $table->foreign('tipo_publicacao_id')
                    ->references('id')->on('tipo_publicacao')
                    ->nullOnDelete();
                $table->foreign('forma_apresentacao_id')
                    ->references('id')->on('forma_apresentacao')
                    ->nullOnDelete();
            });
        }

        // Remove FKs legadas nas colunas 'tipo' e 'forma' antes de dropá-las
        if (DB::getDriverName() === 'mysql') {
            foreach (['tipo', 'forma'] as $col) {
                $fks = DB::select(
                    "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'publicacao'
                     AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL",
                    [$col]
                );
                foreach ($fks as $fk) {
                    DB::statement("ALTER TABLE `publicacao` DROP FOREIGN KEY `{$fk->CONSTRAINT_NAME}`");
                }
            }
        }

        // Remove colunas legadas somente se ainda existem
        if (Schema::hasColumn('publicacao', 'tipo')) {
            Schema::table('publicacao', function (Blueprint $table) {
                $table->dropColumn('tipo');
            });
        }
        if (Schema::hasColumn('publicacao', 'forma')) {
            Schema::table('publicacao', function (Blueprint $table) {
                $table->dropColumn('forma');
            });
        }
    }

    public function down(): void
    {
        // Irreversível
    }
};
