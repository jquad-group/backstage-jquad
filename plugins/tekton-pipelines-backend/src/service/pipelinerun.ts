/* ignore lint error for internal dependencies */
/* eslint-disable */
import {
  PipelineRun,
  Step,
  TaskRun,
  Terminated,
} from '@jquad-group/plugin-tekton-pipelines-common';
/* eslint-enable */
import fetch from 'node-fetch';

const getPipelineRuns = async (
  baseUrl: string,
  authorizationBearerToken: string,
  namespace: string,
  selector: string,
  dashboardBaseUrl: string,
): Promise<PipelineRun[]> => {
  let url: string;
  if (selector) {
    url = `${baseUrl}/apis/tekton.dev/v1beta1/namespaces/${namespace}/pipelineruns?labelSelector=${selector}`;
  } else {
    url = `${baseUrl}/apis/tekton.dev/v1beta1/namespaces/${namespace}/pipelineruns`;
  }
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authorizationBearerToken}`,
    },
  }).then((res: { json: () => any }) => res.json());
  const prs: Array<PipelineRun> = [];
  if (response.items) {
    const trs: Array<TaskRun> = [];

    (response.items as PipelineRun[]).forEach(item => {
      let currStartTime: Date;
      let currCompletionTime: Date; 
      let currDuration: number;
      let currDurationString: string;
      if ((item.status.completionTime !== undefined) && (item.status.startTime !== undefined)){        
          currCompletionTime = new Date(item.status.completionTime);
          currStartTime = new Date(item.status.startTime);
          currDuration = (currCompletionTime.getTime() - currStartTime.getTime()) / 1000;
        currDurationString = new Date(
          ((currCompletionTime.getTime() -
            currStartTime.getTime()) /
            1000) *
            1000,
        )
          .toISOString()
          .slice(11, 19);
      } else if ((item.status.completionTime === undefined) && (item.status.startTime !== undefined)) {
        currCompletionTime = new Date(0);        
        currStartTime = new Date(item.status.startTime);
        currDuration = 0;
        currDurationString = "";
      } else {
        currCompletionTime = new Date(0);        
        currStartTime = new Date(0);
        currDuration = 0;
        currDurationString = "";
      }
      const pr: PipelineRun = {
        metadata: {
          name: item.metadata.name,
          namespace: item.metadata.namespace,
          labels: item.metadata.labels,
        },
        pipelineRunDashboardUrl: `${dashboardBaseUrl}#/namespaces/${namespace}/pipelineruns/${item.metadata.name}`,
        taskRuns: trs,
        status: {
          conditions: [item.status.conditions[0]],
          startTime: currStartTime,
          completionTime: currCompletionTime,
          duration: currDuration,
          durationString: currDurationString,
        },
      };

      prs.push(pr);
    });
  }
  return prs;
};

const getTaskRunsForMicroservice = async (
  baseUrl: string,
  authorizationBearerToken: string,
  namespace: string,
  selector: string,
): Promise<TaskRun[]> => {
  let url: string;
  if (selector) {
    url = `${baseUrl}/apis/tekton.dev/v1beta1/namespaces/${namespace}/taskruns?labelSelector=${selector}&limit=500`;
  } else {
    url = `${baseUrl}/apis/tekton.dev/v1beta1/namespaces/${namespace}/taskruns`;
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authorizationBearerToken}`,
    },
  }).then((res: { json: () => any }) => res.json());
  const taskRuns: Array<TaskRun> = [];

  if (response.items) {
    (response.items as TaskRun[]).forEach(item => {
      let currCompletionTime: Date; 
      let currDuration: number;
      let currDurationString: string;
      let currStartTime: Date;
      if ((item.status.completionTime !== undefined) && (item.status.startTime !== undefined)) {
        currCompletionTime = new Date(item.status.completionTime);
        currStartTime = new Date(item.status.startTime);
        currDuration = (currCompletionTime.getTime() - currStartTime.getTime()) / 1000;
      currDurationString = new Date(
        ((currCompletionTime.getTime() -
          currStartTime.getTime()) /
          1000) *
          1000,
      )
        .toISOString()
        .slice(11, 19);
    } else if ((item.status.completionTime === undefined) && (item.status.startTime !== undefined)) {
      currStartTime = new Date(item.status.startTime);
      currCompletionTime = new Date(0);
      currDuration = 0;
      currDurationString = "";
    } else {
      currStartTime = new Date(0);
      currCompletionTime = new Date(0);
      currDuration = 0;
      currDurationString = "";
    }
    (item.status.steps as Step[]).forEach(currentStep => {
      if (currentStep.terminated !== undefined) {
        if ((currentStep.terminated.finishedAt !== undefined) && (currentStep.terminated.startedAt !== undefined)) {
          currentStep.terminated.durationString = new Date(
            ((new Date(currentStep.terminated.finishedAt).getTime() -
              new Date(currentStep.terminated.startedAt).getTime()) /
              1000) *
              1000,
          )
            .toISOString()
            .slice(11, 19);
        } else if ((currentStep.terminated.startedAt !== undefined) && (currentStep.terminated.finishedAt === undefined)) {
          currentStep.terminated.finishedAt = new Date(0);
          currentStep.terminated.startedAt = new Date(currentStep.terminated.startedAt);
          currentStep.terminated.duration = 0;
          currentStep.terminated.durationString = "";
        } else {
          currentStep.terminated.startedAt = new Date(0);
          currentStep.terminated.finishedAt = new Date(0);
          currentStep.terminated.duration = 0;
          currentStep.terminated.durationString = "";
        }      
      } else {
        const currTerminated: Terminated = {
          startedAt: new Date(0),
          finishedAt: new Date(0),
          duration: 0,
          durationString: "",
          reason: ""
        }
        currentStep.terminated = currTerminated;
      }
    }
  )
   const taskRun: TaskRun = {
        metadata: {
          name: item.metadata.name,
          namespace: item.metadata.namespace,
          labels: item.metadata.labels,
        },
        status: {
          conditions: [item.status.conditions[0]],
          steps: item.status.steps,
          podName: item.status.podName,
          startTime: currStartTime,
          completionTime: currCompletionTime,
          duration: currDuration,
          durationString: currDurationString,
        },
      };
      taskRuns.push(taskRun);
    });
  }
  return taskRuns;
};

const getLogsForTaskRun = async (
  baseUrl: string,
  authorizationBearerToken: string,
  namespace: string,
  taskRun: TaskRun,
): Promise<void> => {
  for (const currentStep of taskRun.status.steps) {
    const url = `${baseUrl}/api/v1/namespaces/${namespace}/pods/${taskRun.status.podName}/log?container=${currentStep.container}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'plain/text',
        Authorization: `Bearer ${authorizationBearerToken}`,
      },
    });

    const decoded = await response.text();
    currentStep.log = decoded;
  }
};

export async function getMicroservicePipelineRuns(
  baseUrl: string,
  authorizationBearerToken: string,
  namespace: string,
  selector: string,
  dashboardBaseUrl: string,
): Promise<PipelineRun[]> {
  const [pipelineRuns, taskRuns] = await Promise.all([
    getPipelineRuns(
      baseUrl,
      authorizationBearerToken,
      namespace,
      selector,
      dashboardBaseUrl,
    ),
    getTaskRunsForMicroservice(
      baseUrl,
      authorizationBearerToken,
      namespace,
      selector,
    ),
  ]);

  for (const pipelineRun of pipelineRuns) {
    const taskRunsForPipelineRun: Array<TaskRun> = [];
    for (const taskRun of taskRuns) {
      const pipelineRunNameLabel =
        taskRun.metadata.labels['tekton.dev/pipelineRun'];
      if (String(pipelineRunNameLabel) === pipelineRun.metadata.name) {
        await getLogsForTaskRun(
          baseUrl,
          authorizationBearerToken,
          namespace,
          taskRun,
        );
        taskRunsForPipelineRun.push(taskRun);
      }
    }
    const taskRunsSorted = taskRunsForPipelineRun.sort(
      (taskRunA, taskRunB) =>
        taskRunA.status.startTime.getTime() -
        taskRunB.status.startTime.getTime(),
    );
    pipelineRun.taskRuns = taskRunsSorted;
  }

  return pipelineRuns;
}
