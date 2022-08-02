import fetch from 'node-fetch'

interface PipelineRun {
    metadata: {
      name: string; 
      namespace: string;
      labels: Array<string>;
    }
    status: {
      conditions: [
        Condition
      ]
    }
}

interface Condition {
  reason: string;
  type: string;
  status: string;
  message: string;
}

/*
http://localhost:7007/tekton-pipelines-plugin-backend/pipelineruns?namespace=sample-go-application-build
*/
export async function getPipelineRuns(baseUrl: string, authorizationBearerToken: string, namespace: string, selector: string): Promise<PipelineRun[]> {
    let url: string
    if (selector != "") {
      url = `${baseUrl}/apis/tekton.dev/v1beta1/namespaces/${namespace}/pipelineruns?labelSelector=${selector}`
    } else {
      url = `${baseUrl}/apis/tekton.dev/v1beta1/namespaces/${namespace}/pipelineruns`
    }
    const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authorizationBearerToken}`,
        },
      }).then((res: { json: () => any }) => res.json())
    let prs: Array<PipelineRun> = []
    if (response.items) {
      const labels: Array<string> = response.items.map(
        (currentLabel: any) => currentLabel.metadata.labels
      );
      
      (response.items as PipelineRun[]).forEach(item => {
        const pr: PipelineRun = {
          metadata: {
            name: item.metadata.name,
            namespace: item.metadata.namespace,
            labels: labels,
          },
          status: {
            conditions: [
              item.status.conditions[0]
            ],
          },
        }
        
        prs.push(pr)
  
        /*
        console.log(item.metadata.name)
        console.log(item.metadata.labels)
        console.log(item.status.conditions[0])
        */
        
      })      
    }
    return prs
} 