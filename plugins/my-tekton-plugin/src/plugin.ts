import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const myTektonPluginPlugin = createPlugin({
  id: 'my-tekton-plugin',
  routes: {
    root: rootRouteRef,
  },
});

export type EntityTektonContentProps = {
  /**
   * Sets the refresh interval in milliseconds. The default value is 10000 (10 seconds)
   */
  refreshIntervalMs?: number;
};

export const EntityMyTektonPluginContent: (
  props: EntityTektonContentProps,
) => JSX.Element = myTektonPluginPlugin.provide(
  createRoutableExtension({
    name: 'EntityMyTektonPluginContent',
    component: () => import('./Router').then(m => m.Router),
    mountPoint: rootRouteRef,
  }),
);

