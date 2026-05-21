<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('publicacao', function (Blueprint $table) {
            $table->unsignedBigInteger('tipo_publicacao_id')->nullable()->after('tipo');
            $table->unsignedBigInteger('forma_apresentacao_id')->nullable()->after('forma');
            $table->string('doi')->nullable()->after('isbn');
        });

        // Migrar tipo (string) → tipo_publicacao_id
        DB::table('tipo_publicacao')->get()->each(function ($tp) {
            DB::table('publicacao')
                ->whereRaw('LOWER(TRIM(tipo)) = ?', [strtolower(trim($tp->nome))])
                ->update(['tipo_publicacao_id' => $tp->id]);
        });

        // Migrar forma (string) → forma_apresentacao_id
        DB::table('forma_apresentacao')->get()->each(function ($fa) {
            DB::table('publicacao')
                ->whereRaw('LOWER(TRIM(forma)) = ?', [strtolower(trim($fa->nome))])
                ->update(['forma_apresentacao_id' => $fa->id]);
        });

        Schema::table('publicacao', function (Blueprint $table) {
            $table->foreign('tipo_publicacao_id')
                ->references('id')->on('tipo_publicacao')
                ->nullOnDelete();
            $table->foreign('forma_apresentacao_id')
                ->references('id')->on('forma_apresentacao')
                ->nullOnDelete();

            $table->dropColumn(['tipo', 'forma']);
        });
    }

    public function down(): void
    {
        // Irreversível
    }
};
