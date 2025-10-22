<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PublicationController extends Controller
{
    public function index()
    {
        // Aqui você buscaria os dados do banco de dados.
        // Para fins de exemplo, vamos simular alguns dados.
        $publications = [
            ['id' => 1489, 'title' => 'A avaliação dos projetos para a obtenção de Bolsa de Produtividade em Pesquisa...', 'authors' => 'Caidenton, Adolfo Ignacio', 'year' => '2024'],
            ['id' => 1488, 'title' => 'Desenvolvimento e avaliação do REMIC: site autoinstrucional sobre sistemas de microfone remoto', 'authors' => 'Carneiro, Larissa de Almeida et al', 'year' => '2024'],
            // ... adicione mais dados conforme necessário
        ];

        return inertia('Publications/Index', [
            'publications' => $publications,
        ]);
    }
}