<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Class TipoPublicacao
 *
 * @property int $id
 * @property string|null $nome
 */
class TipoPublicacao extends Model
{
    protected $table = 'tipo_publicacao';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'nome',
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
            'nome' => 'string',
        ];
    }

    public function publicacoes(): HasMany
    {
        return $this->hasMany(Publicacao::class, 'tipo_publicacao_id');
    }
}
