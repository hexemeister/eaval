import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { equipeDoAno } from '@/data/equipeData'; // temporário
import { Layout } from '@/layouts/Layout';


interface HistoricoEquipeProps {
  ano: number;
  title: string;
}

export default function HistoricoEquipe({ ano }: HistoricoEquipeProps) {
  const assistentesPesquisa =
    equipeDoAno.membros?.filter((membro) => {
      return membro.cargo === 'Assistente' && membro.anoAtuacao === ano;
    }) || [];
  const equipePesquisa =
    equipeDoAno.membros?.filter((membro) => {
      return membro.cargo === 'Aluno' && membro.anoAtuacao === ano;
    }) || [];
  {
    console.log(equipePesquisa);
  }
  return (
    <Layout>
      <div className="container mx-auto space-y-4 px-4">
        <h1 className="mb-8 text-3xl font-bold">Equipe do ano {ano}</h1>

        {/* Assistentes de pesquisa */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Assistentes de pesquisa</CardTitle>
            </CardHeader>
            <CardContent>
              {assistentesPesquisa && assistentesPesquisa.length > 0 ? (
                <ul className="list-disc space-y-1 space-y-4 pl-5">
                  {assistentesPesquisa.map((membro, idx) => (
                    <li key={idx} className="space-y-1">
                      <p className="font-bold">{membro.nome}</p>
                      <p className="text-sm">{membro.descricao}</p>
                      <p className="text-sm">
                        {' '}
                        <span className="italic">Currículo Lattes: </span>
                        <a
                          href={membro.lattes}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline hover:underline-offset-4"
                        >
                          {membro.lattes}
                        </a>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhuma informação disponível para o ano {ano}.</p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Equipe de pesquisa */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Equipe de pesquisa - alunos do Mestrado Profissional em Avaliação da Faculdade Cesgranrio (turma {ano - 1})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {equipePesquisa && equipePesquisa.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5">
                  {equipePesquisa.map((membro, idx) => (
                    <li key={idx} className="space-y-1">
                      <p className="font-bold">{membro.nome}</p>
                      <p className="text-sm">{membro.descricao}</p>
                      <p className="text-sm">
                        {' '}
                        <span className="italic">Currículo Lattes: </span>
                        <a
                          href={membro.lattes}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline hover:underline-offset-4"
                        >
                          {membro.lattes}
                        </a>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhuma informação disponível para o ano {ano}.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
}
