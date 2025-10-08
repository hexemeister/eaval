<?php

namespace App\Services\ArticleSearch;

use Illuminate\Support\Facades\Log;

/**
 * Simplifica a AST removendo parênteses redundantes e otimizando a estrutura.
 */
class ASTSimplifier
{
    /**
     * Simplifica um nó da AST.
     */
    public function simplify(QueryNode $node): QueryNode
    {
        $simplified = $this->simplifyNode($node);
        
        Log::debug('ASTSimplifier: Simplified AST', [
            'original' => $node->toString(),
            'simplified' => $simplified->toString(),
            'changed' => $node->toString() !== $simplified->toString()
        ]);
        
        return $simplified;
    }
    
    private function simplifyNode(QueryNode $node): QueryNode
    {
        // Simplificar recursivamente os filhos primeiro
        if ($node instanceof AndNode) {
            return $this->simplifyAnd($node);
        }
        
        if ($node instanceof OrNode) {
            return $this->simplifyOr($node);
        }
        
        if ($node instanceof NotNode) {
            return $this->simplifyNot($node);
        }
        
        // TermNode não precisa de simplificação
        return $node;
    }
    
    private function simplifyAnd(AndNode $node): QueryNode
    {
        $left = $this->simplifyNode($this->getNodeChild($node, 'left'));
        $right = $this->simplifyNode($this->getNodeChild($node, 'right'));
        
        // Regra: (A AND A) = A
        if ($this->nodesEqual($left, $right)) {
            Log::debug('ASTSimplifier: Removed duplicate AND operand');
            return $left;
        }
        
        return new AndNode($left, $right);
    }
    
    private function simplifyOr(OrNode $node): QueryNode
    {
        $left = $this->simplifyNode($this->getNodeChild($node, 'left'));
        $right = $this->simplifyNode($this->getNodeChild($node, 'right'));
        
        // Regra: (A OR A) = A
        if ($this->nodesEqual($left, $right)) {
            Log::debug('ASTSimplifier: Removed duplicate OR operand');
            return $left;
        }
        
        return new OrNode($left, $right);
    }
    
    private function simplifyNot(NotNode $node): QueryNode
    {
        $child = $this->simplifyNode($this->getNodeChild($node, 'child'));
        
        // Regra: NOT (NOT A) = A (dupla negação)
        if ($child instanceof NotNode) {
            Log::debug('ASTSimplifier: Removed double negation');
            return $this->getNodeChild($child, 'child');
        }
        
        return new NotNode($child);
    }
    
    /**
     * Verifica se dois nós são iguais (mesma estrutura e valor).
     */
    private function nodesEqual(QueryNode $a, QueryNode $b): bool
    {
        return $a->toString() === $b->toString();
    }
    
    /**
     * Acessa propriedade privada de um nó usando Reflection.
     */
    private function getNodeChild(QueryNode $node, string $property): QueryNode
    {
        $reflection = new \ReflectionClass($node);
        $prop = $reflection->getProperty($property);
        $prop->setAccessible(true);
        return $prop->getValue($node);
    }
}