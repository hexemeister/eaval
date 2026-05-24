<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['tipo_autoria_id', 'modalidade_id', 'vinculo_institucional_autor_id'] as $col) {
            if (!Schema::hasColumn('publicacao', $col)) {
                continue;
            }

            // Em MySQL: verifica se a FK existe antes de dropar (pode não existir no schema legado)
            if (DB::getDriverName() === 'mysql') {
                $fkName = 'publicacao_' . $col . '_foreign';
                $exists = DB::select(
                    "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'publicacao'
                     AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'",
                    [$fkName]
                );
                if ($exists) {
                    DB::statement("ALTER TABLE `publicacao` DROP FOREIGN KEY `{$fkName}`");
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
