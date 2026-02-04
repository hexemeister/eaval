<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Class Publicacao
 *
 * @property int $id
 * @property string|null $tipo
 * @property string|null $titulo
 * @property int $local_publicacao_id
 * @property string|null $forma
 * @property int $ano
 * @property string|null $volume
 * @property string|null $numero
 * @property string|null $pagina
 * @property string|null $isbn
 * @property string|null $resumo
 * @property string|null $link
 * @property Carbon|null $incluida_em
 * @property Carbon|null $editada_em
 * @property int|null $turma_id
 * @property int|null $eixo_tematico_id
 * @property int|null $segmento_educacional_id
 * @property int|null $tipo_instituicao_id
 * @property int|null $qualis_capes_id
 * @property int|null $tipo_autoria_id
 * @property int|null $modalidade_id
 * @property int|null $vinculo_institucional_autor_id
 */
class Publicacao extends Model
{
    protected $table = 'publicacao';

    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'tipo',
        'titulo',
        'local_publicacao_id',
        'forma',
        'ano',
        'volume',
        'numero',
        'pagina',
        'isbn',
        'resumo',
        'link',
        'incluida_em',
        'editada_em',
        'turma_id',
        'eixo_tematico_id',
        'segmento_educacional_id',
        'tipo_instituicao_id',
        'qualis_capes_id',
        'tipo_autoria_id',
        'modalidade_id',
        'vinculo_institucional_autor_id',
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
            'tipo' => 'string',
            'titulo' => 'string',
            'local_publicacao_id' => 'integer',
            'forma' => 'string',
            'ano' => 'integer',
            'volume' => 'string',
            'numero' => 'string',
            'pagina' => 'string',
            'isbn' => 'string',
            'resumo' => 'string',
            'link' => 'string',
            'incluida_em' => 'datetime',
            'editada_em' => 'datetime',
            'turma_id' => 'integer',
            'eixo_tematico_id' => 'integer',
            'segmento_educacional_id' => 'integer',
            'tipo_instituicao_id' => 'integer',
            'qualis_capes_id' => 'integer',
            'tipo_autoria_id' => 'integer',
            'modalidade_id' => 'integer',
            'vinculo_institucional_autor_id' => 'integer',
        ];
    }

    public function autores(): BelongsToMany
    {
        return $this->belongsToMany(Autor::class, 'autor_publicacao')
            ->withPivot('ordem')
            ->orderByPivot('ordem', 'asc');
    }

    public function palavrasChave(): BelongsToMany
    {
        return $this->belongsToMany(PalavraChave::class, 'palavra_chave_publicacao', 'publicacao_id', 'palavra_chave_id');
    }

    public function localPublicacao(): BelongsTo
    {
        return $this->belongsTo(LocalPublicacao::class, 'local_publicacao_id');
    }
}
