<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('publicacao', function (Blueprint $table) {
            foreach (['tipo_autoria_id', 'modalidade_id', 'vinculo_institucional_autor_id'] as $col) {
                if (!Schema::hasColumn('publicacao', $col)) {
                    continue;
                }
                try {
                    $table->dropForeign([$col]);
                } catch (\Exception $e) {
                    // FK constraint não existe — seguro ignorar
                }
                $table->dropColumn($col);
            }
        });

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
