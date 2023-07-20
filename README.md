# Tekton Pipelines Plugin

- The frontend plugin is located under `plugins\tekton-pipelines`.

![Dashboard](https://github.com/jquad-group/backstage-jquad/blob/main/img/tekton.png)


# Pre-requirements 

This plugin uses the Backstage backend kubernetes plugin. Therefore the backstage kubernetes plugin needs to be installed and configured on your backstage instance first.

Installation can be found here: https://backstage.io/docs/features/kubernetes/installation.

Configuration of the plugin: https://backstage.io/docs/features/kubernetes/configuration

Additionally, the following permissions need to be configured in the `backstage-read-only` Cluster Role:

```
  - apiGroups:
      - tekton.dev
    resources:
      - pipelineruns
      - taskruns
    verbs:
      - get
      - list      
      - watch
  ...
  - apiGroups:
      - '*'
    resources:
      - pods/log  # can download pod logs
```

Add the Tekton custom resources in your `app-config.yaml` like this:
```
kubernetes:
  serviceLocatorMethod:
    type: 'multiTenant'
  clusterLocatorMethods:
    - type: 'config'
      clusters:
        - url: https://host.docker.internal:21301
          name: k3d
          authProvider: 'serviceAccount'
          skipTLSVerify: true
          skipMetricsLookup: true
          serviceAccountToken: eyJhbGciOiJSUzI1NiIsImtpZCI6IlRiYlFqeHZSQy1qSFpoNzRyaGlBYXM5anQwdHZ3alZ3VEVwbHNpeG5wb3MifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJwaXBlbGluZS1kZW1vIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImJhY2tzdGFnZSIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50Lm5hbWUiOiJiYWNrc3RhZ2UiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC51aWQiOiIxNzZjZTk3Zi1lMjM5LTQyZWQtYTJiOC00ZTE4ZjZlNGIxOGYiLCJzdWIiOiJzeXN0ZW06c2VydmljZWFjY291bnQ6cGlwZWxpbmUtZGVtbzpiYWNrc3RhZ2UifQ.uer0wvSPrFyYykUFkMqgqPn7pxnoNChLmJAyE1Mpa82_1WYcqF9Uv7e8I7Vf0fevz_f6Pjbf257XCsXL-q9ZEk2qsFSRpLbkmixpAFeMaJ2R2Iw_6FBDk7WRa58SLDQ91SwJVo5gkVeMsCAejqHAWstj7UgwpZBAKifobNpzgaSWkc0JmwiqpTTRzdxHhKZBClQNXghyrEzhGdI3RxPpnHqtEJk120b41p7oanlfyNY570K1DCyHtjNdQIDfQkPAqaG_HOhQwrVRRG5RRmDykMzRSiHGcW40eR0xBGR3UNvDlTOsPPbIloGfa9seR4pCbaXrz9e_-rV0n00r2nllyw
          dashboardUrl: http://127.0.0.1:64713 # url copied from running the command: minikube service kubernetes-dashboard -n kubernetes-dashboard
          dashboardApp: standard
          #caData: ${K8S_CONFIG_CA_DATA}
          #caFile: '' # local path to CA file
          customResources:
            #- group: 'tekton.dev'
            #  apiVersion: 'v1beta1'
            #  plural: 'pipelineruns'
            #- group: 'tekton.dev'
            #  apiVersion: 'v1beta1'
            #  plural: 'taskruns'
            - group: 'tekton.dev'
              apiVersion: 'v1'
              plural: 'pipelineruns'              
            - group: 'tekton.dev'
              apiVersion: 'v1'
              plural: 'taskruns'

```

# Add the tekton frontend plugin to your custom backstage app

Add the frontend plugin from the `packages/app` directory using:
`yarn add @jquad-group/plugin-tekton-pipelines@0.5.0`

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

# Use the plugin

In a `Component` entity, besides the annotation `backstage.io/kubernetes-id` or `backstage.io/kubernetes-namespace`, add the annotation `tektonci: "true"`.

```
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  namespace: default
  annotations:
    backstage.io/kubernetes-id: microservice
    tektonci: "true"
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




