import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/layouts/Layout';
import { Link } from '@inertiajs/react';

export default function Sobre() {
  return (
    <Layout>
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-3xl font-bold">Sobre o Projeto (WIP)</h1>

        {/* Seção Principal - Descrição do Projeto */}
        <section className="mb-12">
          <Card>
            <CardContent className="mt-6 space-y-4 text-justify">
              <p>
                Este banco de dados é fruto de um projeto de pesquisa que vem sendo realizado por pesquisadores e alunos do Curso de Mestrado
                Profissional em Avaliação da Faculdade Cesgranrio. Tem por objetivo investigar, por meio de um processo estruturado de busca em bases
                eletrônicas de dados e análise quanti-qualitativa das informações, o “estado da arte” da área da Avaliação.
              </p>
              <p>
                A pesquisa teve início em 2014 como atividade pedagógica da disciplina Prática de Avaliação: Estado da Arte da Avaliação com a
                proposta de organizar e analisar a publicação acadêmico-científica na área da Avaliação, no território brasileiro, no período de 2001
                a 2014, identificados na plataforma SciELO, de modo a oferecer subsídios a pesquisadores interessados em desvelar/aprofundar questões
                geradas neste campo de conhecimento. Um dos resultados deste esforço foi a criação do banco eletrônico de dados disponibilizado neste
                <span className="italic"> site</span>.
              </p>
              <p>
                A seleção dos artigos para inclusão nesta base de dados teve como critérios: a delimitação do campo de pesquisa à área da Educação e a
                existência dos vocábulos Educação e Avaliação dentre as palavras-chave dos artigos.
              </p>
              <p>
                O projeto continua ativo, atualizando anualmente o registro de artigos. São elaborados relatórios técnicos anuais das atividades
                realizadas, que acessíveis por meio{' '}
                <Link href="#" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  deste link
                </Link>{' '}
                ou pelo item <span className='italic'>Relatórios Técnicos</span> do menu, localizado no cabeçalho desta plataforma. O grupo de pesquisa entende que este banco de dados é um recurso dinâmico por
                oferecer a possibilidade de ser alimentado continuamente, mesmo após a conclusão formal do projeto. Neste sentido, possui condições de
                continuar subsidiando com informações específicas a produção de artigos científicos na área da Avaliação.
              </p>
              <p>
                Em 2025, o contrato com a empresa responsável pelo desenvolvimento e manutenção da plataforma original e-Aval terminou. A estrutura e
                os dados do banco de dados foram recuperados. No entanto, a plataforma que serve para fazer as consultas não foi disponibilizada. Como
                resultado, uma nova plataforma está sendo elaborada em código aberto, de modo que o projeto consiga manter-se autônomo em relação a
                quaisquer vínculos comerciais.
              </p>
              <p>
                A base de dados é disponibilizada para consulta pública, sem custos, e pode ser utilizada por pesquisadores, professores, estudantes e
                profissionais interessados na área da Avaliação. Espera-se que este recurso contribua para o desenvolvimento do campo de conhecimento
                da Avaliação no Brasil.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
}
