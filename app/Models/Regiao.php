<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class Regiao
 *
 * @property int $id
 * @property string|null $sigla_pais
 * @property string|null $sigla
 * @property string|null $nome
 */
class Regiao extends Model
{
    protected $table = 'regiao';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'sigla_pais',
        'sigla',
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
            'sigla_pais' => 'string',
            'sigla' => 'string',
            'nome' => 'string',
        ];
    }

    public function pais(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'sigla_pais', 'sigla');
    }

    public function estados(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Estado::class, 'sigla_regiao', 'sigla');
    }

}
