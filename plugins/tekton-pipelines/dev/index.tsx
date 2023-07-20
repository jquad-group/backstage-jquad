import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { tektonPipelinesPluginPlugin } from '../src/plugin';

createDevApp()
  .registerPlugin(tektonPipelinesPluginPlugin)
  .addPage({
    element: <TektonPipelinesPluginPage />,
    title: 'Root Page',
    path: '/my-tekton-plugin'
  })
  .render();
