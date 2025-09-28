import { Layout } from '@/layouts/Layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from '@inertiajs/react';
import ligiaEImg from '../../images/ligia-elliot.gif';
import ligiaLImg from '../../images/ligia-leite.gif';
import luciaVImg from '../../images/lucia-vilarinho.gif';
import jessicaMImg from '../../images/jessica-martins.gif';

export default function QuemSomos() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Quem Somos (WIP)</h1>

        {/* Seção de Pesquisadores */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Pesquisadores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profa. Dra. Ligia Gomes Elliot */}
            <Card>
              <CardHeader className="flex flex-row items-center space-x-4">
                <Avatar className='size-18'>
                  <AvatarImage src={ligiaEImg} alt="Profa. Dra. Ligia Gomes Elliot" />
                  <AvatarFallback>LG</AvatarFallback>
                </Avatar>
                <CardTitle className='text-xl'>Profa. Dra. Ligia Gomes Elliot</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-200 mb-2">
                  PhD em Educação/Avaliação e Mestre em Estudos Latino Americanos pela Universidade da Califórnia Los Angeles, Mestre em Educação pela Universidade Federal do Rio de Janeiro, Coordenadora do Programa de Pós Graduação e do Curso de Mestrado Profissional em Avaliação da Fundação Cesgranrio e pesquisadora do Centro de Avaliação. Pós Doutorado em Avaliação, UFRJ.
                </p>
                <Link
                  href="http://lattes.cnpq.br/3407515397492906"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Currículo Lattes
                </Link>
              </CardContent>
            </Card>

            {/* Profa. Dra. Ligia Silva Leite */}
            <Card>
              <CardHeader className="flex flex-row items-center space-x-4">
                <Avatar className='size-18'>
                  <AvatarImage src={ligiaLImg} alt="Profa. Dra. Ligia Silva Leite" />
                  <AvatarFallback>LL</AvatarFallback>
                </Avatar>
                <CardTitle className='text-xl'>Profa. Dra. Ligia Silva Leite</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-200 mb-2">
                  Doutora em Educação pela Temple University e Mestre em Educação pela Universidade Federal do Rio de Janeiro (UFRJ). Professora do Curso de Mestrado Profissional em Avaliação da Fundação Cesgranrio e da Faculdade de Educação da Universidade do Estado do Rio de Janeiro (UERJ). Pós Doutorado em Tecnologia Educacional pela Universidade de Pittsburgh.
                </p>
                <Link
                  href="http://lattes.cnpq.br/7255232148754522"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Currículo Lattes
                </Link>
              </CardContent>
            </Card>

            {/* Profa. Dra. Lucia Regina Goulart Vilarinho */}
            <Card>
              <CardHeader className="flex flex-row items-center space-x-4">
                <Avatar className='size-18'>
                  <AvatarImage src={luciaVImg} alt="Profa. Dra. Lucia Regina Goulart Vilarinho" />
                  <AvatarFallback>LV</AvatarFallback>
                </Avatar>
                <CardTitle className='text-xl'>Profa. Dra. Lucia Regina Goulart Vilarinho</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-200 mb-2">
                  Doutora e Mestre em Educação pela Faculdade de Educação, Universidade Federal do Rio de Janeiro (UFRJ); Pedagoga, pela Pontifícia Universidade Católica do Rio de Janeiro - PUC-Rio; professora aposentada da Faculdade de Educação da Universidade Federal do Rio de Janeiro (UFRJ); professora do PPGE da Universidade Estácio de Sá/RJ (2000-2014), professora do Curso de Mestrado Profissional em Avaliação da Fundação Cesgranrio.
                </p>
                <Link
                  href="http://lattes.cnpq.br/1757678864925265"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Currículo Lattes
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Seção de Assistentes de Pesquisa e Alunos */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Assistentes de pesquisa e alunos</h2>
          <ul className=" list-disc list-inside text-gray-100 space-y-2">
            <li>Ano 2023</li>
            <li>Ano 2022</li>
            <li>Ano 2021</li>
            <li>Ano 2020</li>
            <li>Ano 2019</li>
            <li>Ano 2018</li>
            <li>Ano 2017</li>
            <li>Ano 2016</li>
            <li>Ano 2015</li>
            <li>Ano 2014</li>
          </ul>
        </section>

        {/* Seção de Designer do Logo */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Designer do logo do projeto</h2>
          <Card>
            <CardHeader className="flex flex-row items-center space-x-4">
              <Avatar className='size-18'>
                <AvatarImage src={jessicaMImg} alt="Jéssica Marques Marins" />
                <AvatarFallback>JM</AvatarFallback>
              </Avatar>
              <CardTitle className='text-xl'>Jéssica Marques Marins</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-200 mb-2">
                Graduanda do Curso de Comunicação Visual Design da Escola de Belas Artes da Universidade Federal do Rio de Janeiro (UFRJ). Estagiária de Design da Pró-reitoria de Pós-graduação e Pesquisa da UFRJ (PR-2/UFRJ).
              </p>
              <Link
                href="http://lattes.cnpq.br/4407621365289182"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Currículo Lattes
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
}