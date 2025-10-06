<?php

namespace App\Services\ArticleSearch;

use Exception;

/**
 * Exception lançada quando há erro de sintaxe na query de busca.
 */
class ParseException extends Exception
{
    public function __construct(string $message = "", int $code = 0, ?Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}