import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { EntityTektonPipelinesContent, tektonPipelinesPluginPlugin } from '../src/plugin';

createDevApp()
  .registerPlugin(tektonPipelinesPluginPlugin)
  .addPage({
    element: <EntityTektonPipelinesContent />,
    title: 'Root Page',
    path: '/tekton-pipelines'
  })
  .render();
