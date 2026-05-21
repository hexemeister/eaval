<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Class Publicacao
 *
 * @property int $id
 * @property string|null $titulo
 * @property int $ano
 * @property string|null $volume
 * @property string|null $numero
 * @property string|null $pagina
 * @property string|null $isbn
 * @property string|null $doi
 * @property string|null $resumo
 * @property string|null $link
 * @property Carbon|null $incluida_em
 * @property Carbon|null $editada_em
 * @property int|null $local_publicacao_id
 * @property int|null $tipo_publicacao_id
 * @property int|null $forma_apresentacao_id
 * @property int|null $turma_id
 * @property int|null $eixo_tematico_id
 * @property int|null $segmento_educacional_id
 * @property int|null $tipo_instituicao_id
 * @property int|null $qualis_capes_id
 */
class Publicacao extends Model
{
    use HasFactory;

    protected $table = 'publicacao';

    public $timestamps = false;

    protected $fillable = [
        'titulo',
        'ano',
        'volume',
        'numero',
        'pagina',
        'isbn',
        'doi',
        'resumo',
        'link',
        'incluida_em',
        'editada_em',
        'local_publicacao_id',
        'tipo_publicacao_id',
        'forma_apresentacao_id',
        'turma_id',
        'eixo_tematico_id',
        'segmento_educacional_id',
        'tipo_instituicao_id',
        'qualis_capes_id',
    ];

    protected $attributes = [];

    protected function casts(): array
    {
        return [
            'id'                     => 'integer',
            'ano'                    => 'integer',
            'titulo'                 => 'string',
            'volume'                 => 'string',
            'numero'                 => 'string',
            'pagina'                 => 'string',
            'isbn'                   => 'string',
            'doi'                    => 'string',
            'resumo'                 => 'string',
            'link'                   => 'string',
            'incluida_em'            => 'datetime',
            'editada_em'             => 'datetime',
            'local_publicacao_id'    => 'integer',
            'tipo_publicacao_id'     => 'integer',
            'forma_apresentacao_id'  => 'integer',
            'turma_id'               => 'integer',
            'eixo_tematico_id'       => 'integer',
            'segmento_educacional_id' => 'integer',
            'tipo_instituicao_id'    => 'integer',
            'qualis_capes_id'        => 'integer',
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

    public function areas(): BelongsToMany
    {
        return $this->belongsToMany(Area::class, 'area_publicacao', 'publicacao_id', 'area_id');
    }

    public function localPublicacao(): BelongsTo
    {
        return $this->belongsTo(LocalPublicacao::class, 'local_publicacao_id');
    }

    public function tipoPublicacao(): BelongsTo
    {
        return $this->belongsTo(TipoPublicacao::class, 'tipo_publicacao_id');
    }

    public function formaApresentacao(): BelongsTo
    {
        return $this->belongsTo(FormaApresentacao::class, 'forma_apresentacao_id');
    }
}
