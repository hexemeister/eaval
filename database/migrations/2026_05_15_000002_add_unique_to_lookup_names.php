<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Adiciona UNIQUE em tabelas que já existiam sem a constraint.
        // Verificamos se o índice já existe para que a migration seja
        // segura de rodar em ambientes que possam tê-lo adicionado manualmente.
        foreach (['area', 'eixo_tematico', 'segmento_educacional'] as $table) {
            $alreadyUnique = collect(Schema::getIndexes($table))
                ->contains(fn ($idx) => $idx['unique'] && in_array('nome', $idx['columns']));

            if (!$alreadyUnique) {
                Schema::table($table, function (Blueprint $t) {
                    $t->unique('nome');
                });
            }
        }
    }

    public function down(): void
    {
        foreach (['area', 'eixo_tematico', 'segmento_educacional'] as $table) {
            Schema::table($table, function (Blueprint $t) use ($table) {
                $t->dropUnique("{$table}_nome_unique");
            });
        }
    }
};
