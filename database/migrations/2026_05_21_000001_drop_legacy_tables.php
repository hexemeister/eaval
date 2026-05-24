<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['tipo_autoria_id', 'modalidade_id', 'vinculo_institucional_autor_id'] as $col) {
            if (!Schema::hasColumn('publicacao', $col)) {
                continue;
            }

            // Em MySQL: busca o nome real da FK pela coluna (pode ter nome gerado automaticamente)
            if (DB::getDriverName() === 'mysql') {
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

            Schema::table('publicacao', function (Blueprint $table) use ($col) {
                $table->dropColumn($col);
            });
        }

        Schema::dropIfExists('tipo_autoria');
        Schema::dropIfExists('modalidade');
        Schema::dropIfExists('vinculo_institucional_autor');
        Schema::dropIfExists('usuario');
    }

    public function down(): void
    {
        // Irreversível — restaurar do backup se necessário
    }
};
