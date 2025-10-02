import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Layout } from '@/layouts/Layout';

import { useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

interface RecaptchaParameters {
  sitekey: string;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  [key: string]: unknown; // Allow additional properties if needed
}

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render: (container: HTMLElement | string, parameters: RecaptchaParameters) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
    };
    __recaptchaOnLoadCallback?: () => void;
  }
}

export default function Contato() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    subject: '',
    msg: '',
    captcha: '',
  });

  const captchaRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  // Estado para controlar a visibilidade do modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const id = 'recaptcha-v2';
    if (!recaptchaSiteKey) {
      console.error('VITE_RECAPTCHA_SITE_KEY não definida');
      return;
    }
    if (document.getElementById(id)) return;

    // define callback global ANTES de injetar o script
    window.__recaptchaOnLoadCallback = () => {
      if (!window.grecaptcha || typeof window.grecaptcha.render !== 'function') {
        console.error('grecaptcha carregado mas render não é função');
        return;
      }
      if (captchaRef.current) {
        widgetIdRef.current = window.grecaptcha!.render(captchaRef.current as HTMLElement, {
          sitekey: recaptchaSiteKey,
          callback: (token: string) => setData('captcha', token),
          'expired-callback': () => setData('captcha', ''),
        });
        console.log('reCAPTCHA v2 renderizado, widgetId=', widgetIdRef.current);
      }
    };

    const script = document.createElement('script');
    script.id = id;
    script.src = `https://www.google.com/recaptcha/api.js?onload=__recaptchaOnLoadCallback&render=explicit&hl=pt-BR`;
    script.async = true;
    script.defer = true;
    script.onerror = (e) => console.error('Falha ao carregar reCAPTCHA', e);
    document.body.appendChild(script);

    return () => {
      try {
        delete window.__recaptchaOnLoadCallback;
      } catch {
        // Ignore errors when deleting global callback
      }
      // não remova o script para evitar re-injeção em SPA, a menos que queira cleanup
    };
  }, [recaptchaSiteKey, setData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // tenta usar token já definido pelo callback; senão obtém via getResponse
    let token = data.captcha;
    if (!token && widgetIdRef.current !== null && window.grecaptcha) {
      token = window.grecaptcha!.getResponse(widgetIdRef.current);
      setData('captcha', token);
    }

    post('/contato', {
      onSuccess: () => {
        // Abrir o modal e limpar os campos
        setShowSuccessModal(true);
        setData('name', '');
        setData('email', '');
        setData('subject', '');
        setData('msg', '');
        setData('captcha', '');
        if (window.grecaptcha && widgetIdRef.current !== null) {
          window.grecaptcha.reset(widgetIdRef.current);
        }
      },
      onError: (errs) => console.log('Erros de validação:', errs),
    });
  };

  return (
    <>
      {/* <Head>
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
      </Head> */}
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
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <Label htmlFor="name">
                      Nome <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      minLength={10}
                      required
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                      minLength={6}
                      required
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="subject">
                      Assunto <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      value={data.subject}
                      onChange={(e) => setData('subject', e.target.value)}
                      minLength={5}
                      required
                    />
                    {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
                  </div>
                  <div>
                    <Label htmlFor="message">
                      Mensagem <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      name="msg"
                      rows={4}
                      value={data.msg}
                      onChange={(e) => setData('msg', e.target.value)}
                      minLength={10}
                      required
                    />
                    {errors.msg && <p className="text-sm text-red-500">{errors.msg}</p>}
                  </div>
                  <div>
                    <Label htmlFor="captcha">ReCaptcha:</Label>
                    <div className="g-recaptcha" data-sitekey={recaptchaSiteKey}></div>
                    <div ref={captchaRef}></div>
                    {errors.captcha && <p className="text-sm text-red-500">{errors.captcha}</p>}
                  </div>
                  <Button type="submit" disabled={processing}>
                    Enviar
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Modal de Sucesso */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="text-center">
            <DialogHeader>
              <DialogTitle className="text-center">Sucesso!</DialogTitle>
              <DialogDescription className="mt-4 text-center">Sua mensagem foi enviada com sucesso!</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <Button onClick={() => setShowSuccessModal(false)}>Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </Layout>
    </>
  );
}
