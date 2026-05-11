<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class Estado
 *
 * @property int $id
 * @property string|null $sigla
 * @property string|null $sigla_regiao
 * @property string|null $nome
 */
class Estado extends Model
{
    protected $table = 'estado';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'sigla',
        'sigla_regiao',
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
            'sigla' => 'string',
            'sigla_regiao' => 'string',
            'nome' => 'string',
        ];
    }

    public function regiao(): BelongsTo
    {
        return $this->belongsTo(Regiao::class, 'sigla_regiao', 'sigla');
    }

    public function locaisPublicacao(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(LocalPublicacao::class, 'estado', 'sigla');
    }

    public function publicacoes(): \Illuminate\Database\Eloquent\Relations\HasManyThrough
    {
        return $this->hasManyThrough(
            Publicacao::class,
            LocalPublicacao::class,
            'estado', // Foreign key on LocalPublicacao table...
            'local_publicacao_id', // Foreign key on Publicacao table...
            'sigla', // Local key on Estado table...
            'id' // Local key on LocalPublicacao table...
        );
    }
}
