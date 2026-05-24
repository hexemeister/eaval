<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TextoNormalizado extends Notification
{
    use Queueable;

    public function __construct(private readonly string $mensagem) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, string> */
    public function toDatabase(object $notifiable): array
    {
        return [
            'mensagem' => $this->mensagem,
            'url'      => '/admin/publicacoes',
        ];
    }
}
