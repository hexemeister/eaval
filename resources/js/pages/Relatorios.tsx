import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/layouts/Layout';

export default function Relatorios() {
  return (
    <Layout>
      <div className="container mx-auto px-4">
        <section className="mb-4">
          <Accordion type="single" data-state="open" defaultValue="item-1" collapsible>
            <AccordionItem value="item-1" className='border-b-0'>
              <AccordionTrigger className='hover:no-underline pt-0'>
                <h1 className="mb-4 text-3xl font-bold">Relatórios técnicos (WIP)</h1>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="mt-6 space-y-4 text-justify text-base">
                    <p>
                      Nesta seção, apresentamos o registro cronológico e detalhado das atividades de pesquisa e desenvolvimento do projeto e-Aval. Os
                      relatórios técnicos anuais são documentos fundamentais que formalizam o progresso da nossa investigação sobre o “estado da arte”
                      da Avaliação no Brasil.
                    </p>
                    <p>
                      Cada relatório descreve as etapas metodológicas, os processos de coleta e análise de dados, os desafios encontrados e os
                      resultados alcançados no período correspondente. Eles oferecem uma visão transparente do trabalho realizado pela nossa equipe de
                      pesquisadores e alunos para manter e expandir o banco de dados de artigos acadêmico-científicos da área.
                    </p>
                    <p>
                      Convidamos pesquisadores, estudantes e profissionais interessados a consultar os documentos abaixo para acompanhar a evolução do
                      projeto e aprofundar-se nos bastidores da construção desta importante ferramenta para o campo da Avaliação.
                    </p>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Seção Principal - Descrição do Projeto */}
        <section className="mb-12">
          <Card>
            <CardContent className="mt-6">
              <ul className="ml-4 list-disc space-y-4">
                <li>
                  <a
                    className="text-blue-500 hover:underline hover:underline-offset-4"
                    href="/storage/relatorios/Estado_da_arte_de_avaliacao_2023-2024.pdf"
                    target="_blank"
                  >
                    Relatório Técnico 2023-2024
                  </a>
                </li>
                <li>
                  <a
                    className="text-blue-500 hover:underline hover:underline-offset-4"
                    href="/storage/relatorios/Estado_da_arte_de_avaliacao_2022.pdf"
                    target="_blank"
                  >
                    Relatório Técnico 2022
                  </a>
                </li>
                <li>
                  <a
                    className="text-blue-500 hover:underline hover:underline-offset-4"
                    href="/storage/relatorios/Estado_da_arte_de_avaliacao_2021.pdf"
                    target="_blank"
                  >
                    Relatório Técnico 2021
                  </a>
                </li>
                <li>
                  <a
                    className="text-blue-500 hover:underline hover:underline-offset-4"
                    href="/storage/relatorios/Estado_da_arte_de_avaliacao_2020.pdf"
                    target="_blank"
                  >
                    Relatório Técnico 2020
                  </a>
                </li>
                <li>
                  <a
                    className="text-blue-500 hover:underline hover:underline-offset-4"
                    href="/storage/relatorios/Estado_da_arte_de_avaliacao_2019.pdf"
                    target="_blank"
                  >
                    Relatório Técnico 2019
                  </a>
                </li>
                <li>
                  <a
                    className="text-blue-500 hover:underline hover:underline-offset-4"
                    href="/storage/relatorios/Estado_da_arte_de_avaliacao_2018.pdf"
                    target="_blank"
                  >
                    Relatório Técnico 2018
                  </a>
                </li>
                <li>
                  <a
                    className="text-blue-500 hover:underline hover:underline-offset-4"
                    href="/storage/relatorios/Estado_da_arte_de_avaliacao_2017.pdf"
                    target="_blank"
                  >
                    Relatório Técnico 2017
                  </a>
                </li>
                <li>
                  <a
                    className="text-blue-500 hover:underline hover:underline-offset-4"
                    href="/storage/relatorios/Estado_da_arte_de_avaliacao_2016.pdf"
                    target="_blank"
                  >
                    Relatório Técnico 2016
                  </a>
                </li>
                <li>
                  <a
                    className="text-blue-500 hover:underline hover:underline-offset-4"
                    href="/storage/relatorios/Estado_da_arte_de_avaliacao_2015-2016.pdf"
                    target="_blank"
                  >
                    Relatório Técnico 2015-2016
                  </a>
                </li>
                <li>
                  <a
                    className="text-blue-500 hover:underline hover:underline-offset-4"
                    href="/storage/relatorios/Estado_da_arte_de_avaliacao_2014.pdf"
                    target="_blank"
                  >
                    Relatório Técnico 2014
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
}
