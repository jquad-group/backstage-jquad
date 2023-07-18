import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { myTektonPluginPlugin, MyTektonPluginPage } from '../src/plugin';

createDevApp()
  .registerPlugin(myTektonPluginPlugin)
  .addPage({
    element: <MyTektonPluginPage />,
    title: 'Root Page',
    path: '/my-tekton-plugin'
  })
  .render();
