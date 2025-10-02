<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Http;

class ReCaptcha implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // dd($value);
        $key = env('RECAPTCHA_SECRET_KEY', '');
        $response = Http::get('https://www.google.com/recaptcha/api/siteverify', [
            'secret' => $key,
            'response' => $value,
            'remoteip' => request()->ip(),
        ])->json();
        
        if (!$response['success']) {
        $fail('A validação do reCAPTCHA falhou! Por favor, tente novamente.');
    }
    }
}
