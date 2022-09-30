import fetch from 'node-fetch'

interface PipelineRun {
    metadata: {
      name: string; 
      namespace: string;
      labels: Array<string>;
    }
    pipelineRunDashboardUrl: string;
    taskRuns: Array<TaskRun>
    status: {
      conditions: [
        Condition
      ]
      startTime: Date
      completionTime: Date
      duration: number
      durationString: string
    }
}

interface TaskRun {
  metadata: {
    name: string; 
    namespace: string;
    labels: Array<string>;
  }
  status: {
    conditions: [
      Condition
    ],
    steps: Array<string>
    startTime: Date
    completionTime: Date
    duration: number
    durationString: string
  }
  log: string;
}

interface Condition {
  reason: string;
  type: string;
  status: string;
  message: string;
}


const getPipelineRuns = async (baseUrl: string, authorizationBearerToken: string, namespace: string, selector: string, dashboardBaseUrl: string): Promise<PipelineRun[]> => {
    let url: string
    if (selector) {
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
      let trs: Array<TaskRun> = [];
      
      (response.items as PipelineRun[]).forEach(item => {
        const pr: PipelineRun = {
          metadata: {
            name: item.metadata.name,
            namespace: item.metadata.namespace,
            labels: labels,
          },
          pipelineRunDashboardUrl: `${dashboardBaseUrl}#/namespaces/${namespace}/pipelineruns/${item.metadata.name}`,
          taskRuns: trs,
          status: {
            conditions: [
              item.status.conditions[0]
            ],
            startTime: new Date(item.status.startTime),
            completionTime: new Date(item.status.completionTime),
            duration: (new Date(item.status.completionTime).getTime() - new Date(item.status.startTime).getTime()) / 1000,            
            durationString: new Date(((new Date(item.status.completionTime).getTime() - new Date(item.status.startTime).getTime()) / 1000) * 1000).toISOString().slice(11, 19)
          },
        }
        
        prs.push(pr)
      })      
    }
    return prs
} 

const getTaskRunsForPipelineRun = async (baseUrl: string, authorizationBearerToken: string, namespace: string, pipelineRunName: string): Promise<TaskRun[]> => {

  const url = `${baseUrl}/apis/tekton.dev/v1beta1/namespaces/${namespace}/taskruns?labelSelector=tekton.dev%2FpipelineRun%3D${pipelineRunName}&limit=500`
  const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authorizationBearerToken}`,
      },
    }).then((res: { json: () => any }) => res.json())
  let taskRuns: Array<TaskRun> = []
  if (response.items) {      
    const labels: Array<string> = response.items.map(
      (currentLabel: any) => currentLabel.metadata.labels
    );    
    (response.items as TaskRun[]).forEach(item => {
      const taskRun: TaskRun = {
        metadata: {
          name: item.metadata.name,
          namespace: item.metadata.namespace,
          labels: labels
        },
        status: {
          conditions: [
            item.status.conditions[0]
          ],
          steps: item.status.steps.map(
            (currentStep: any) => currentStep.container
          ),
          startTime: new Date(item.status.startTime),
          completionTime: new Date(item.status.completionTime),
          duration: (new Date(item.status.completionTime).getTime() - new Date(item.status.startTime).getTime()) / 1000,            
          durationString: new Date(((new Date(item.status.completionTime).getTime() - new Date(item.status.startTime).getTime()) / 1000) * 1000).toISOString().slice(11, 19)
        },
        log: ""
      }
      taskRuns.push(taskRun)
    })      
  }
  return taskRuns
} 


const getLogsForTaskRun = async (baseUrl: string, authorizationBearerToken: string, namespace: string, taskRun: TaskRun): Promise<string> => {
  let podName: string;
  let stepName: string

  podName = taskRun.metadata.name + "-pod" 
  stepName = taskRun.status.steps[0]
  const url = `${baseUrl}/api/v1/namespaces/${namespace}/pods/${podName}/log?container=${stepName}`
  const response = await fetch(url, {
      headers: {
        'Content-Type': 'plain/text',
        Authorization: `Bearer ${authorizationBearerToken}`,
      },
    })

    const decoded = await response.text() 

  return decoded
}

export async function getMicroservicePipelineRuns(baseUrl: string, authorizationBearerToken: string, namespace: string, selector: string, dashboardBaseUrl: string): Promise<PipelineRun[]> {  
      const pipelineRuns = await getPipelineRuns(baseUrl, authorizationBearerToken, namespace, selector, dashboardBaseUrl)
      for (const pipelineRun of pipelineRuns) {
        const taskRuns = await getTaskRunsForPipelineRun(baseUrl, authorizationBearerToken, namespace, pipelineRun.metadata.name)
        for (const taskRun of taskRuns) {
          const logs = await getLogsForTaskRun(baseUrl, authorizationBearerToken, namespace, taskRun)
          console.log("-----------")
          console.log(logs)
          taskRun.log = logs
        }
        const taskRunsSorted = taskRuns.sort(
          (taskRunA, taskRunB) => taskRunA.status.startTime.getTime() - taskRunB.status.startTime.getTime(),
        );        
        pipelineRun.taskRuns = taskRunsSorted
      }
      return pipelineRuns
}