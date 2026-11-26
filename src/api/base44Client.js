import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { localClient } from './localClient';

const { appId, token, functionsVersion, appBaseUrl, backend } = appParams;

// Par défaut l'application parle à son propre backend (server/).
// VITE_BACKEND=base44 permet de revenir temporairement à l'ancienne plateforme.
const base44 =
  backend === 'base44'
    ? createClient({
        appId,
        token,
        functionsVersion,
        serverUrl: '',
        requiresAuth: false,
        appBaseUrl,
      })
    : localClient;

export { base44 };
