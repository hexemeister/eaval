<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class PalavraChavePublicacao
 *
 * @property int $id
 * @property int $publicacao_id
 * @property int $palavra_chave_id
 * @property int $ordem
 * @property int $novo_id
 */
class PalavraChavePublicacao extends Model
{
    protected $table = 'palavra_chave_publicacao';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'publicacao_id',
        'palavra_chave_id',
        'ordem',
        'novo_id',
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'publicacao_id' => 'integer',
            'palavra_chave_id' => 'integer',
            'ordem' => 'integer',
            'novo_id' => 'integer',
        ];
    }
}
