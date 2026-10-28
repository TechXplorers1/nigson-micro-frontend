var ngDevMode = true;
var ngServerMode = false;
(globalThis as any).ngDevMode = true;
(globalThis as any).ngServerMode = false;
(window as any).ngDevMode = true;
(window as any).ngServerMode = false;

import { initFederation } from '@angular-architects/native-federation';

initFederation('federation.manifest.json', {
  hostRemoteEntry: { url: './remoteEntry.json' },
})
  .catch((err) => console.error(err))
  .then((_) => import('./bootstrap'))
  .catch((err) => console.error(err));
