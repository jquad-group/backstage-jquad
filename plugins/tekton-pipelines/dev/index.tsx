import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { EntityTektonPipelinesContent, tektonPipelinesPluginPlugin } from '../src/plugin';
import { KubernetesApi, kubernetesApiRef, kubernetesPlugin} from '@backstage/plugin-kubernetes';
import {
  CustomObjectsByEntityRequest,
  FetchResponse,
  ObjectsByEntityResponse,
  WorkloadsByEntityRequest,
} from '@backstage/plugin-kubernetes-common';

import pipelineRun1 from '../src/__fixtures__/pipelineRun1.json';
import pipelineRun2 from '../src/__fixtures__/pipelineRun2.json';
import pipelineRun3 from '../src/__fixtures__/pipelineRun3.json';
import { TestApiProvider } from '@backstage/test-utils';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';


const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'backstage',
    description: 'backstage.io',
    annotations: {
      'backstage.io/kubernetes-label-selector': 'app=microservice',
      'tektonci/enabled': "true",
    },
  },
  spec: {
    lifecycle: 'production',
    type: 'service',
    owner: 'user:guest',
  },
};

class MockKubernetesClient implements KubernetesApi {
  readonly resources: FetchResponse[];

  constructor(fixtureData: { [resourceType: string]: any[] }) {
    this.resources = Object.entries(fixtureData).flatMap(
      ([type, resources]) =>
        ({ type: type.toLocaleLowerCase('en-US'), resources } as FetchResponse),
    );
  }
  getCluster(_clusterName: string): Promise<{ name: string; authProvider: string; oidcTokenProvider?: string | undefined; dashboardUrl?: string | undefined; } | undefined> {
    throw new Error('Method not implemented.');
  }
  async getPodLogs(_request: {
    podName: string;
    namespace: string;
    clusterName: string;
    containerName: string;
    token: string;
  }): Promise<string> {
    return await 'some logs';
  }
  async getWorkloadsByEntity(
    _request: WorkloadsByEntityRequest,
  ): Promise<ObjectsByEntityResponse> {
    return {
      items: [
        {
          cluster: { name: 'mock-cluster' },
          resources: this.resources,
          podMetrics: [],
          errors: [],
        },
      ],
    };
  }
  async getCustomObjectsByEntity(
    _request: CustomObjectsByEntityRequest,
  ): Promise<ObjectsByEntityResponse> {
    return {
      items: [
        {
          cluster: { name: 'mock-cluster' },
          resources: this.resources,
          podMetrics: [],
          errors: [],
        },
      ],
    };
  }

  async getObjectsByEntity(): Promise<ObjectsByEntityResponse> {
    return {
      items: [
        {
          cluster: { name: 'mock-cluster' },
          resources: this.resources,
          podMetrics: [],
          errors: [],
        },
      ],
    };
  }

  async getClusters(): Promise<{ name: string; authProvider: string }[]> {
    return [{ name: 'mock-cluster', authProvider: 'serviceAccount' }];
  }

  async proxy(_options: { clusterName: String; path: String }): Promise<any> {
    return {
      kind: 'Namespace',
      apiVersion: 'v1',
      metadata: {
        name: 'mock-ns',
      },
    };
  }
}

createDevApp()
  .registerPlugin(kubernetesPlugin, tektonPipelinesPluginPlugin)
  .addPage({
    element: (
      <TestApiProvider
        apis={[[kubernetesApiRef, new MockKubernetesClient(pipelineRun1)]]}
      >
        <EntityProvider entity={mockEntity}>
          <EntityTektonPipelinesContent />
        </EntityProvider>
      </TestApiProvider>
    ),
    title: 'Tekton Pipelines 1',
    path: '/tekton-pipelines-1'
  }).addPage({
    element: (
      <TestApiProvider
        apis={[[kubernetesApiRef, new MockKubernetesClient(pipelineRun2)]]}
      >
        <EntityProvider entity={mockEntity}>
          <EntityTektonPipelinesContent />
        </EntityProvider>
      </TestApiProvider>
    ),
    title: 'Tekton Pipelines 2',
    path: '/tekton-pipelines-2'
  }).addPage({
    element: (
      <TestApiProvider
        apis={[[kubernetesApiRef, new MockKubernetesClient(pipelineRun3)]]}
      >
        <EntityProvider entity={mockEntity}>
          <EntityTektonPipelinesContent />
        </EntityProvider>
      </TestApiProvider>
    ),
    title: 'Tekton Pipelines 3',
    path: '/tekton-pipelines-3'
  })
  .render();
