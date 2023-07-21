import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const tektonPipelinesPluginPlugin = createPlugin({
  id: 'tekton-pipelines',
  routes: {
    root: rootRouteRef,
  },
});

export type EntityTektonPipelinesContentProps = {
  /**
   * Sets the refresh interval in milliseconds. The default value is 10000 (10 seconds)
   */
  refreshIntervalMs?: number;
};

export const EntityTektonPipelinesContent: (
  props: EntityTektonPipelinesContentProps,
) => JSX.Element = tektonPipelinesPluginPlugin.provide(
  createRoutableExtension({
    name: 'EntityTektonPipelinesContent',
    component: () => import('./Router').then(m => m.Router),
    mountPoint: rootRouteRef,
  }),
);

