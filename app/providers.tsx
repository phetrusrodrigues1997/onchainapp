'use client';

import { base } from 'wagmi/chains';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import type { ReactNode } from 'react';

export function Providers(props: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      projectId={process.env.NEXT_PUBLIC_PROJECT_ID}
      chain={base}
      config={{ appearance: { 
            mode: 'auto',
        }
      }}
    >
      {props.children}
      
    </OnchainKitProvider>
  );
}

