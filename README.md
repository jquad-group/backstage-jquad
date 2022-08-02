# Tekton Pipelines Plugin

- The frontend plugin is located under `plugins\tekton-pipelines`.
- The backend plugin is located under `plugins\tekton-pipelines-backend`. 

![Dashboard](https://github.com/jquad-group/backstage-jquad/blob/main/img/tekton.png)

# Configuration

In the `app-config.yaml` the following properties must be set:

```
tekton:
  baseUrl: https://kubernetes-api-server:6443
  authorizationBearerToken: TOKEN
```

# Add the plugin to your custom backstage app

(Optional) If you have a newly cloned backstage application run `yarn install` from the root of the application.

In order to add the tekton plugin in your backstage app, you need to run the following commands from the root directory:

`yarn workspace example-app add -cwd packages/app @jquad-group/plugin-tekton-pipelines@0.0.4`

`yarn workspace example-app add -cwd packages/backend @jquad-group/plugin-tekton-pipelines-backend@0.0.4`

`yarn tsc`

`yarn build && yarn tsc && yarn install` 

In your backstage app in `.\packages\app\src\components\catalog\EntityPage.tsx` add the following:
 

```
import { TektonPipelinesPluginPage, isTektonCiAvailable } from '@jquad-group/plugin-tekton-pipelines';
...
const serviceEntityPage = (
    ...
    <EntityLayout.Route path="/tekton-pipelines-plugin" title="Tekton Pipelines">
    <EntitySwitch>
    <EntitySwitch.Case if={e => Boolean(isTektonCiAvailable(e))}>
      <TektonPipelinesPluginPage />
    </EntitySwitch.Case>

    <EntitySwitch.Case>
      <EmptyState
        title="No Tekton Pipelines available for this entity"
        missing="info"
        description="You need to add the annotation 'tektonci/build-namespace' to your component if you want to enable the Tekton Pipelines for it."
      />
    </EntitySwitch.Case>
    </EntitySwitch>
    </EntityLayout.Route>
    ...
);
    
```

In the `packages/backend/src/plugins`, add the following `tekton.ts` file:

```
import { createRouter } from '@jquad-group/plugin-tekton-pipelines-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {

  return await createRouter({
    logger: env.logger,
    config: env.config,
  });
}
```

# Use the plugin

In a `Component` add the annotation `tektonci/build-namespace` or `tektonci/pipeline-label-selector`. E.g. to get the pipelines from the `microservice-build` namespace:

```
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  namespace: default
  annotations:
    tektonci/build-namespace: microservice-build
  name: jquad-microservice
  description: JQuad Microservice
spec:
  type: service
  lifecycle: production
  owner: user:guest
```

# Develop the tekton pipelines plugin locally 

From the main directory: 

 `yarn dev`

Navigate to `http://localhost:3000/` 




