<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Class Area
 *
 * @property int $id
 * @property string|null $nome
 */
class Area extends Model
{
    protected $table = 'area';

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

    public function publicacoes(): BelongsToMany
    {
        return $this->belongsToMany(Publicacao::class, 'area_publicacao', 'area_id', 'publicacao_id');
    }
}
