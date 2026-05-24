<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\TermoExcecaoCaso;

class NormalizacaoTextoService
{
    public static function sentenceCase(string $texto): string
    {
        $excecoes = cache()->remember('termos_excecao_caso', 3600, fn () =>
            TermoExcecaoCaso::pluck('termo')->toArray()
        );

        $resultado = mb_strtolower(trim($texto));
        $resultado = mb_strtoupper(mb_substr($resultado, 0, 1)) . mb_substr($resultado, 1);

        foreach ($excecoes as $termo) {
            $resultado = preg_replace(
                '/\b' . preg_quote(mb_strtolower($termo), '/') . '\b/ui',
                $termo,
                $resultado
            );
        }

        return $resultado;
    }

    /**
     * Normaliza palavra-chave no estilo ABNT 6028:
     * - Converte para minúsculas, exceto siglas
     * - Remove espaços extras
     */
    public static function palavraChaveAbnt(string $text): string
    {
        $text  = trim($text);
        $words = preg_split('/(\s+)/', $text, -1, PREG_SPLIT_DELIM_CAPTURE) ?: [];
        $result = '';

        foreach ($words as $token) {
            if (trim($token) === '') {
                $result .= $token;
                continue;
            }

            $isSigla = mb_strlen($token) > 1 && $token === mb_strtoupper($token) && !ctype_digit($token);
            $result .= $isSigla ? $token : mb_strtolower($token);
        }

        return $result;
    }

    /**
     * Remove acentos e normaliza para comparação insensível a acentos.
     */
    public static function removerAcentos(string $text): string
    {
        $normalized = \Normalizer::normalize($text, \Normalizer::FORM_D);
        if ($normalized === false) {
            return $text;
        }

        return preg_replace('/[\x{0300}-\x{036f}]/u', '', $normalized) ?? $text;
    }
}
