<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIndexesToTables extends Migration
{
    public function up()
    {
        // Índices na tabela publicacao
        Schema::table('publicacao', function (Blueprint $table) {
            $table->index('titulo', 'idx_publicacao_titulo');
            if (config('database.default') !== 'sqlite') {
                $table->fullText('resumo')->index('idx_publicacao_resumo_fulltext');
            }
        });

        // Índice na tabela autor
        Schema::table('autor', function (Blueprint $table) {
            $table->index('nome', 'idx_autor_nome');
        });

        // Índice na tabela palavra_chave
        Schema::table('palavra_chave', function (Blueprint $table) {
            $table->index('texto', 'idx_palavra_chave_texto');
        });

        // Índices compostos na tabela autor_publicacao
        Schema::table('autor_publicacao', function (Blueprint $table) {
            $table->index(['publicacao_id', 'autor_id'], 'idx_autor_publicacao_composite');
        });

        // Índices compostos na tabela palavra_chave_publicacao
        Schema::table('palavra_chave_publicacao', function (Blueprint $table) {
            $table->index(['publicacao_id', 'palavra_chave_id'], 'idx_palavra_chave_publicacao_composite');
        });
    }

    public function down()
    {
        // Remover índices na tabela publicacao
        Schema::table('publicacao', function (Blueprint $table) {
            $table->dropIndex('idx_publicacao_titulo');
            $table->dropIndex('idx_publicacao_resumo');
        });

        // Remover índice na tabela autor
        Schema::table('autor', function (Blueprint $table) {
            $table->dropIndex('idx_autor_nome');
        });

        // Remover índice na tabela palavra_chave
        Schema::table('palavra_chave', function (Blueprint $table) {
            $table->dropIndex('idx_palavra_chave_texto');
        });

        // Remover índices compostos na tabela autor_publicacao
        Schema::table('autor_publicacao', function (Blueprint $table) {
            $table->dropIndex('idx_autor_publicacao_composite');
        });

        // Remover índices compostos na tabela palavra_chave_publicacao
        Schema::table('palavra_chave_publicacao', function (Blueprint $table) {
            $table->dropIndex('idx_palavra_chave_publicacao_composite');
        });
    }
}