<?php

// Backup do SQLite de desenvolvimento antes dos testes (chamado pelo composer run test).
// Recusa-se a sobrescrever o .bak quando o banco atual é drasticamente menor que o
// backup existente — sinal de que o banco foi zerado (ex: migrate:fresh acidental).
// Nesse cenário, sobrescrever destruiria a única cópia dos dados.

$db = $argv[1] ?? 'database/database.sqlite';
$bak = $argv[2] ?? 'database/database.sqlite.bak';

if (! file_exists($db)) {
    exit(0);
}

if (file_exists($bak)) {
    $dbSize = filesize($db);
    $bakSize = filesize($bak);

    if ($bakSize > 0 && $dbSize < $bakSize * 0.5) {
        fwrite(STDERR, '⚠️  Backup NÃO atualizado: o banco atual ('.number_format($dbSize)." bytes) tem menos da metade\n");
        fwrite(STDERR, '   do tamanho do backup existente ('.number_format($bakSize)." bytes).\n");
        fwrite(STDERR, "   Isso sugere perda de dados (migrate:fresh?). O .bak anterior foi preservado.\n");
        fwrite(STDERR, "   Se a redução for intencional, atualize manualmente:\n");
        fwrite(STDERR, "   cp $db $bak\n");
        exit(0);
    }
}

copy($db, $bak);
