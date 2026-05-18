<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Notificação disparada após a exclusão de um item de lookup.
 *
 * Criada apenas quando há publicações afetadas (ficaram sem o valor).
 * Usa o canal 'database' para aparecer no badge da sidebar.
 */
class LookupItemDeleted extends Notification
{
    use Queueable;

    /**
     * @param string $label        Label legível da entidade (ex: "Segmento Educacional")
     * @param string $nome         Nome do registro excluído (ex: "Educação Básica")
     * @param int    $affectedCount Quantidade de publicações que ficaram sem o valor
     */
    public function __construct(
        private readonly string $label,
        private readonly string $nome,
        private readonly int $affectedCount,
    ) {}

    /**
     * Canais pelos quais a notificação é enviada.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Representação em array para o canal database.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'label'          => $this->label,
            'nome'           => $this->nome,
            'affected_count' => $this->affectedCount,
            'message'        => "'{$this->nome}' foi excluído. {$this->affectedCount} publicações ficaram sem {$this->label}.",
        ];
    }
}
