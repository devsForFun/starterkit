import { OAuthCallbackRedirect } from '@/components/oauth-callback-redirect';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

export default function Home() {
  return (
    <>
      <Suspense fallback={null}>
        <OAuthCallbackRedirect />
      </Suspense>
      <div className="flex flex-col gap-4 h-screen justify-center items-center">
        <h1 className="text-4xl font-bold">devsForFun</h1>
        <p className="text-muted-foreground">opensource frontend template</p>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            Docs
          </Button>
          <Button disabled>Get the template</Button>
        </div>
        <p className="text-muted-foreground">
          By{' '}
          <a href="https://devsforfun.com" className="underline" rel="noopener noreferrer" target="_blank">
            devsForFun
          </a>
        </p>
      </div>
    </>
  );
}
