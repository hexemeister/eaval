import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface PalavraChaveSugestao {
  id: number;
  texto: string;
}

interface PalavraChaveInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

export function PalavraChaveInput({ value, onChange }: PalavraChaveInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [sugestoes, setSugestoes] = useState<PalavraChaveSugestao[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function buscar(q: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setSugestoes([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/admin/palavras-chave/busca?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const found: PalavraChaveSugestao[] = await res.json();
        setSugestoes(found);
        setOpen(true);
      }
    }, 300);
  }

  function handleInputChange(v: string) {
    setInputValue(v);
    buscar(v);
    if (v.trim().length < 2) setOpen(false);
  }

  function adicionar(texto?: string) {
    const kw = (texto ?? inputValue).trim();
    if (!kw) return;
    if (value.some((v) => normalize(v) === normalize(kw))) {
      setInputValue('');
      setSugestoes([]);
      setOpen(false);
      return;
    }
    onChange([...value, kw]);
    setInputValue('');
    setSugestoes([]);
    setOpen(false);
  }

  function remover(kw: string) {
    onChange(value.filter((v) => v !== kw));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="flex-1">
              <Input
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Adicionar palavra-chave..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    adicionar();
                  }
                  if (e.key === 'Escape') setOpen(false);
                }}
              />
            </div>
          </PopoverTrigger>
          {sugestoes.length > 0 && (
            <PopoverContent className="w-[300px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
              <Command>
                <CommandList>
                  <CommandGroup heading="Palavras-chave existentes">
                    {sugestoes.map((pk) => (
                      <CommandItem key={pk.id} value={pk.texto} onSelect={() => adicionar(pk.texto)}>
                        <Check className={cn('mr-2 size-4', value.some((v) => normalize(v) === normalize(pk.texto)) ? 'opacity-100' : 'opacity-0')} />
                        {pk.texto}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandEmpty>Nenhuma encontrada.</CommandEmpty>
                </CommandList>
              </Command>
            </PopoverContent>
          )}
        </Popover>
        <Button type="button" variant="outline" onClick={() => adicionar()}>
          Adicionar
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((kw) => (
            <Badge key={kw} variant="secondary" className="gap-1">
              {kw}
              <button type="button" onClick={() => remover(kw)} aria-label={`Remover ${kw}`}>
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
