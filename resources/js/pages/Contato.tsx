import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Layout } from '@/layouts/Layout';

export default function Contato() {
  return (
    <Layout>
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-3xl font-bold">Contato (WIP)</h1>

        <section className="mb-12">
          <Card>
            <CardContent>
              <p className="my-6">Para nos enviar uma mensagem, preencha o formulário abaixo.</p>
              <p className="mb-6">
                Campos com <span className="text-red-500">*</span> são obrigatórios.
              </p>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="name">
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input id="name" name="name" type="text" required />
                </div>
                <div>
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="subject">
                    Assunto <span className="text-red-500">*</span>
                  </Label>
                  <Input id="subject" name="subject" type="text" required />
                </div>
                <div>
                  <Label htmlFor="message">
                    Mensagem <span className="text-red-500">*</span>
                  </Label>
                  <Textarea id="message" name="message" rows={4} required />
                </div>
                <div>
                  <Label htmlFor="captcha">Código de verificação</Label>
                  <Input id="captcha" name="captcha" type="text" placeholder="Digite as letras da imagem" />
                  <p className="mt-1 text-sm text-gray-500">Por favor, digite as letras que aparecem na imagem acima.</p>
                </div>
                <Button type="submit" disabled>
                  Enviar
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
}
