<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\SendEmail;
use App\Rules\ReCaptcha;

class ContatoController extends Controller
{
    public function store(Request $request)
    {
       $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'subject' => 'required|string|max:255',
            'msg' => 'required|string',
            'captcha' => ['required', new ReCaptcha],
        ], [
            'name.required' => 'O campo nome é obrigatório.',
            'email.required' => 'O campo email é obrigatório.',
            'email.email' => 'Por favor, insira um email válido.',
            'subject.required' => 'O campo assunto é obrigatório.',
            'msg.required' => 'O campo mensagem é obrigatório.',
            'captcha.required' => 'A validação do reCAPTCHA é necessária.',
            'captcha.*' => 'Falha na validação do reCAPTCHA. Tente novamente.',
        ]);

        // Enviar e-mail
        Mail::to(env('MAIL_FROM_ADDRESS','eaval.bd@gmail.com'), $data['name'])
        ->send(new SendEmail(
            $data['name'],
            $data['email'],
            $data['subject'],
            $data['msg']
        ));

        return redirect()->back()->with('success', 'Mensagem enviada com sucesso!');
    }
}
