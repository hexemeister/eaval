<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Class PalavraChave
 *
 * @property int $id
 * @property string|null $texto
 * @property int $frequencia
 */
class PalavraChave extends Model
{
    use HasFactory;

    protected $table = 'palavra_chave';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'texto',
        'frequencia',
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'texto' => 'string',
            'frequencia' => 'integer',
        ];
    }

    public function publicacoes()
    {
        return $this->belongsToMany(Publicacao::class, 'palavra_chave_publicacao', 'palavra_chave_id', 'publicacao_id');
    }
}
