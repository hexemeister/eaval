<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('publicacao', function (Blueprint $table) {
            if (Schema::hasColumn('publicacao', 'tipo_autoria_id')) {
                $table->dropForeign(['tipo_autoria_id']);
                $table->dropColumn('tipo_autoria_id');
            }
            if (Schema::hasColumn('publicacao', 'modalidade_id')) {
                $table->dropForeign(['modalidade_id']);
                $table->dropColumn('modalidade_id');
            }
            if (Schema::hasColumn('publicacao', 'vinculo_institucional_autor_id')) {
                $table->dropForeign(['vinculo_institucional_autor_id']);
                $table->dropColumn('vinculo_institucional_autor_id');
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
