<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Class QualisCape
 *
 * @property int $id
 * @property string|null $classificacao
 */
class QualisCape extends Model
{
    protected $table = 'qualis_capes';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'classificacao',
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
            'classificacao' => 'string',
        ];
    }

    public function publicacoes(): HasMany
    {
        return $this->hasMany(Publicacao::class, 'qualis_capes_id');
    }
}
