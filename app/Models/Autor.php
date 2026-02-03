<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class Autor
 *
 * @property int $id
 * @property string|null $nome
 */
class Autor extends Model
{
    protected $table = 'autor';

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
    
    public function publicacoes()
    {
        return $this->belongsToMany(Publicacao::class, 'autor_publicacao')
                    ->withPivot('ordem')
                    ->orderByPivot('ordem', 'asc'); // Ordena pela ordem na relação
    }

    public static function publicacoesPorAutor() {
        return self::withCount('publicacoes')
            ->whereHas('publicacoes')
            ->orderByDesc('publicacoes_count')
            ->get()
            ->map(fn ($autor) => [
                    'Autor' => $autor->nome,
                    'Frequência' => $autor->publicacoes_count,
                ]);
    }
}
