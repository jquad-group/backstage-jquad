import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { myTektonTestPluginPlugin, MyTektonTestPluginPage } from '../src/plugin';

createDevApp()
  .registerPlugin(myTektonTestPluginPlugin)
  .addPage({
    element: <MyTektonTestPluginPage />,
    title: 'Root Page',
    path: '/my-tekton-test-plugin'
  })
  .render();
