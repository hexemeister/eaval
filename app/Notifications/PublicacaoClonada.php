<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Publicacao;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PublicacaoClonada extends Notification
{
    use Queueable;

    public function __construct(private readonly Publicacao $clone) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, string> */
    public function toDatabase(object $notifiable): array
    {
        return [
            'mensagem' => "Publicação clonada: \"{$this->clone->titulo}\". Revise os dados antes de finalizar.",
            'url'      => "/admin/publicacoes/{$this->clone->id}/edit",
        ];
    }
}
