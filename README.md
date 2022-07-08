# Configuration

`app-config.yaml`: `tekton.baseUrl` and `tekton.authorizationBearerToken` 

# Start backstage 

From the main directory: 

 `yarn dev`

Navigate to `http://localhost:3000/` 

![Dashboard](https://github.com/jquad-group/backstage/blob/main/img/tekton.png)



# Add the plugin to your custom backstage app

In order to add the tekton plugin in your backstage app, you need to run the following commands from the root directory:

`yarn workspace example-app add -cwd packages/app @jquad-group/plugin-tekton-pipelines@0.0.1`

`yarn workspace example-app add -cwd packages/backend @jquad-group/plugin-tekton-pipelines-backend@0.0.1`

`yarn build && yarn tsc && yarn install` 

In your backstage app in `.\packages\app\src\components\catalog\EntityPage.tsx` add the following:
 

```
import { TektonPipelinesPluginPage } from '@backstage/plugin-tekton-pipelines-plugin';
...
    <EntityLayout.Route path="/tekton-pipelines-plugin" title="Tekton Pipelines Plugin">
      <TektonPipelinesPluginPage />
    </EntityLayout.Route>    
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