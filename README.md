# Tekton Pipelines Plugin Documentation

1. [Overview](#overview)
2. [Pre-requirements](#pre-requirements)
3. [Adding Tekton Frontend Plugin to Your Backstage App](#adding-tekton-frontend-plugin-to-your-backstage-app)
4. [Using the Plugin](#using-the-plugin)
5. [Developing the Tekton Pipelines Plugin Locally](#developing-the-tekton-pipelines-plugin-locally)

# Overview

The Tekton Pipelines plugin provides integration with Tekton Pipelines in Backstage. It allows users to view Tekton `PipelineRuns` associated with their components.

- The frontend plugin is located under `plugins\tekton-pipelines`.

![Dashboard](https://github.com/jquad-group/backstage-jquad/blob/main/img/tekton.png)


# Pre-requirements 

Before using the Tekton Pipelines plugin, make sure you have fulfilled the following pre-requisites:

1. Install and configure the Backstage backend Kubernetes plugin on your Backstage instance. Follow the installation guide at: https://backstage.io/docs/features/kubernetes/installation.

2. Configure the Kubernetes plugin by following the instructions at: https://backstage.io/docs/features/kubernetes/configuration.

3. Ensure that the necessary permissions are set in the `backstage-read-only` Cluster Role to access Tekton resources:

```
  // ...
  # Access Tekton Resources
  - apiGroups:
      - tekton.dev
    resources:
      - pipelineruns
      - taskruns
    verbs:
      - get
      - list      
      - watch
  // ...
  # Access Step Logs
  - apiGroups:
      - '*'
    resources:
      - pods/log  # can download pod logs
```

4. Add the Tekton custom resources to your `app-config.yaml` as shown below:

```
kubernetes:
  // ...
  clusterLocatorMethods:
    - type: 'config'
      clusters:
        - name: k3d      
          // ...
          customResources:
            - group: 'tekton.dev'
              apiVersion: 'v1'
              plural: 'pipelineruns'              
```

# Adding Tekton Frontend Plugin to Your Backstage App

To incorporate the Tekton Pipelines plugin into your custom Backstage app, follow these steps:

1. Navigate to `./packages/app`, and install the frontend plugin using yarn:
`yarn add @jquad-group/backstage-plugin-tekton-pipelines-plugin@1.1.0-beta.1`

2. In your Backstage app, navigate to the file `./packages/app/src/components/catalog/EntityPage.tsx` and add the following code:

```
import { EntityTektonPipelinesContent, isTektonCiAvailable } from '@jquad-group/plugin-tekton-pipelines';
// ...
const serviceEntityPage = (
    // ...
    <EntityLayout.Route path="/tekton-pipelines" title="Tekton Pipelines">
      <EntitySwitch>

        <EntitySwitch.Case if={e => Boolean(isTektonCiAvailable(e))}>
          <EntityTektonPipelinesContent refreshIntervalMs={5000}/>
        </EntitySwitch.Case>

        <EntitySwitch.Case>
          <EmptyState
            title="No Tekton Dashboard available for this entity"
            missing="info"
            description="You need to add the annotation 'tektonci/enabled: true' to your entity component if you want to enable the Tekton Pipelines for it."
          />
        </EntitySwitch.Case>

      </EntitySwitch>

    </EntityLayout.Route>

    // ...
);
    
```

# Using the Plugin

To enable Tekton Pipelines for a Component entity, add the annotation `tektonci/enabled: "true"` in addition to the existing `backstage.io/kubernetes-id`, `backstage.io/kubernetes-namespace`, or `backstage.io/kubernetes-label-selector` annotations. For example:

```
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  namespace: dev
  annotations:
    backstage.io/kubernetes-label-selector: 'app=microservice'
    tektonci/enabled: "true"
  name: microservice
  description: Microservice
spec:
  type: service
  lifecycle: production
  owner: user:guest
```

This will list all the `PipelineRuns` having the label `app: microservice`, e.g.

```
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  generateName: microservice-pipeline-
  namespace: dev
  labels:     
    app: microservice
```

You can also configure the tekton dashboard url for each cluster by adding the annotation `tektonci.[clusterName]/dashboard` to the catalog info. 
For example, having a kubernetes configuration for the clusters `rancher` and `k3d`:

```
kubernetes:
    ...
    - type: 'config'
      clusters:
        - url: http://host.docker.internal:21301
          name: k3d
          ...
        - url: https://rancher.example.com:6443
          name: rancher
          ...
```

one can configure a separate url for `rancher` and `k3d` for the tekton dashboard like this:

```
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  namespace: dev
  annotations:
    backstage.io/kubernetes-label-selector: 'app=microservice'
    tektonci/enabled: "true"
    tektoncd.k3d/dashboard: http://localhost:8080/tekton/$namespace/$pipelinerun
    tektoncd.rancher/dashboard: https://rancher.example.com:8080/tekton/$namespace/$pipelinerun
  name: microservice
  description: Microservice
spec:
  type: service
  lifecycle: production
  owner: user:guest
```

In the above example `$namespace` and `$pipelinerun` are variables, that are automatically interpolated on runtime from the plugin. 

# Developing the Tekton Pipelines Plugin Locally

To work on the Tekton Pipelines plugin locally, follow these steps:
1. Navigate to the main directory of the Backstage app
2. Start the development server: `yarn dev`
3. Access the local development environment by opening your web browser and visiting: `http://localhost:3000/`.  





