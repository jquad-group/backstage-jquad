import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const myTektonTestPluginPlugin = createPlugin({
  id: 'my-tekton-test-plugin',
  routes: {
    root: rootRouteRef,
  },
});

export const MyTektonTestPluginPage = myTektonTestPluginPlugin.provide(
  createRoutableExtension({
    name: 'MyTektonTestPluginPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
