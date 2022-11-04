# Tekton Pipelines Plugin

- The frontend plugin is located under `plugins\tekton-pipelines`.
- The backend plugin is located under `plugins\tekton-pipelines-backend`. 

![Dashboard](https://github.com/jquad-group/backstage-jquad/blob/main/img/tekton.png)


# Configuration

In the `app-config.yaml` the following properties must be set:

```
tekton:
  - baseUrl: https://kubernetes-api-server:6443
    authorizationBearerToken: TOKEN
    dashboardBaseUrl: https://tekton-dashboard.myserver.com/
```

# Add the plugin to your custom backstage app

(Optional) If you have a newly cloned backstage application run `yarn install` from the root of the application.

In order to add the tekton plugin in your backstage app, you need to run the following commands from the root directory:

`yarn workspace example-app add -cwd packages/app @jquad-group/plugin-tekton-pipelines@0.1.2`

`yarn workspace example-app add -cwd packages/backend @jquad-group/plugin-tekton-pipelines-backend@0.1.2`

In your backstage app in `.\packages\app\src\components\catalog\EntityPage.tsx` add the following:
 

```
import { EntityTektonPipelinesContent, isTektonCiAvailable } from '@jquad-group/plugin-tekton-pipelines';
...
const serviceEntityPage = (
    ...
    <EntityLayout.Route path="/tekton-pipelines-plugin" title="Tekton Pipelines">
   
      <EntitySwitch>

        <EntitySwitch.Case if={e => Boolean(isTektonCiAvailable(e))}>
          <EntityTektonPipelinesContent />
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

In the `packages/backend/src/plugins`, add the following `tekton-pipelines.ts` file:

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

In the `packages/backend/src/index.ts`, add the following:

```diff
 import search from './plugins/search';
+import tekton from './plugins/tekton-pipelines';
 import { PluginEnvironment } from './types';
 import { ServerPermissionClient } from '@backstage/plugin-permission-node';
 import { DefaultIdentityClient } from '@backstage/plugin-auth-node'
@@ -84,6 +85,7 @@ async function main() {
   const techdocsEnv = useHotMemoize(module, () => createEnv('techdocs'));
   const searchEnv = useHotMemoize(module, () => createEnv('search'));
   const appEnv = useHotMemoize(module, () => createEnv('app'));
+  const tektonEnv = useHotMemoize(module, () => createEnv('tekton'))
 
   const apiRouter = Router();
   apiRouter.use('/catalog', await catalog(catalogEnv));
@@ -92,6 +94,7 @@ async function main() {
   apiRouter.use('/techdocs', await techdocs(techdocsEnv));
   apiRouter.use('/proxy', await proxy(proxyEnv));
   apiRouter.use('/search', await search(searchEnv));
+  apiRouter.use('/tekton-pipelines', await tekton(tektonEnv) )
 

```

# Use the plugin

In a `Component` add the annotation `tektonci/build-namespace` or/and `tektonci/pipeline-label-selector`. E.g. to get the pipelines from the `microservice-build` namespace:

```
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  namespace: default
  annotations:
    tektonci/build-namespace: microservice-build
    tektonci/pipeline-label-selector: 'pipeline.jquad.rocks/git.repository.branch.name=main'
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




