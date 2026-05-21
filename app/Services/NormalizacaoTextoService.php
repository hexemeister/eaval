<?php

declare(strict_types=1);

namespace App\Services;

class NormalizacaoTextoService
{
    /**
     * Converte o texto para sentence case (apenas a primeira letra em maiúsculo).
     * Preserva siglas e acrônimos (sequências em maiúsculas mantidas).
     *
     * Ex: "AVALIAÇÃO FORMATIVA" → "Avaliação formativa"
     *     "Avaliação PISA" → "Avaliação PISA"  (sigla mantida)
     */
    public static function sentenceCase(string $text): string
    {
        $text = trim($text);
        if ($text === '') {
            return '';
        }

        $words = preg_split('/(\s+)/', $text, -1, PREG_SPLIT_DELIM_CAPTURE) ?: [];
        $result = '';
        $first  = true;

        foreach ($words as $token) {
            if (trim($token) === '') {
                $result .= $token;
                continue;
            }

            if ($first) {
                $result .= mb_strtoupper(mb_substr($token, 0, 1)) . mb_strtolower(mb_substr($token, 1));
                $first = false;
            } else {
                // mantém token se parecer sigla (>1 char, tudo maiúsculas)
                $isSigla = mb_strlen($token) > 1 && $token === mb_strtoupper($token) && !ctype_digit($token);
                $result .= $isSigla ? $token : mb_strtolower($token);
            }
        }

        return $result;
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
