<?php

namespace App\Http\Controllers;

use App\Models\PalavraChave;
use Illuminate\Http\Request;
use App\Models\Publicacao;
use Illuminate\Support\Facades\DB;


class EstatisticaController extends Controller
{
    public function quantitativo($tipo)
    {
        switch ($tipo) {
            case 'total':
                $totalPublicacoes = Publicacao::count();
                return response()->json(['totalPublicacoes' => $totalPublicacoes]);
                // Outros casos podem ser adicionados aqui
            case 'ano':
                $publicacoesPorAno = Publicacao::select('ano', DB::raw('count(*) as total'))
                    ->groupBy('ano')
                    ->orderBy('ano', 'desc')
                    ->get();
                return response()->json(['publicacoesPorAno' => $publicacoesPorAno]);
            case 'autor':
                // Lógica para estatísticas por autor
                break;
            case 'palavra-chave':
                $quantidadePalavrasChave = PalavraChave::select('texto', 'frequencia')
                    ->groupBy('texto')
                    ->orderBy('frequencia', 'desc')
                    ->get();
                return response()->json(['quantidadePalavrasChave' => $quantidadePalavrasChave]);
            case 'producao-cientifica':
                // Lógica para estatísticas por produção científica
                break;
            case 'area-conhecimento':
                // Lógica para estatísticas por instituição
                break;
            case 'tipo-publicacao':
                // Lógica para estatísticas por Qualis CAPES
                break;
            case 'eixo-tematico':
                // Lógica para estatísticas por instituição
                break;
            case 'segmento-educacional':
                // Lógica para estatísticas por Qualis CAPES
                break;
            case 'forma-apresentacao':
                // Lógica para estatísticas por instituição
                break;
            case 'estado':
                // Lógica para estatísticas por instituição
                break;
            case 'regiao':
                // Lógica para estatísticas por instituição
                break;
            case 'pais':
                // Lógica para estatísticas por instituição
                break;
            default:
                return response()->json(['error' => 'Tipo de estatística inválido'], 400);
        }
    }
}
