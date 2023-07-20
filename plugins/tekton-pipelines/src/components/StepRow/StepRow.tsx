import React, { Fragment } from 'react';
import { StatusError, StatusOK, StatusPending, StatusRunning, StatusWarning } from '@backstage/core-components';
// eslint-disable-next-line  no-restricted-imports
import { TableRow, TableCell, Button, CircularProgress } from '@material-ui/core';
import { useApi } from '@backstage/core-plugin-api';
import { kubernetesApiRef } from '@backstage/plugin-kubernetes';
//import logger from '../../logging/logger';

/* ignore lint error for internal dependencies */
/* eslint-disable */
import { Step } from '../../types';
import { StepLog } from '../StepLog';


function StatusComponent(props: { reason: string; }): JSX.Element {
  if (props.reason === 'Created') {
    return <StatusPending />;
  } else
    if (props.reason === 'Running') {
      return <StatusRunning />;
    } else
      if (props.reason === 'Completed') {
        return <StatusOK />;
      } else
        if (props.reason === 'Succeeded') {
          return <StatusOK />;
        } else
          if (props.reason === 'PipelineRunCancelled') {
            return <StatusWarning />;
          } else
            if (props.reason === 'Failed') {
              return <StatusError />;
            }
  if (props.reason === 'Error') {
    return <StatusError />;
  }
  return <StatusPending />;

}

export function StepRow(props: { clusterName: string, namespace: string, podName: string, step: Step }) {
  const { clusterName, namespace, podName, step } = props;

  const [data, setData] = React.useState({data: ""});
  const [isLoading, setIsLoading] = React.useState(false);

  const k8s = useApi(kubernetesApiRef);

  const handleClick = async (step: Step) => {
    setIsLoading(true);
    const url = `/api/v1/namespaces/${namespace}/pods/${podName}/log?container=step-${step.name}`;

    k8s.proxy({
      clusterName: clusterName,
      path: url,
    }).then(async (res) => {
      data.data = await res.text();
      step.log = data.data;
    });
    
    setData(data);
    setIsLoading(false);
    
  };
  
  return (
    <Fragment>
          <TableRow key={step.name}>
            <TableCell>
              {step.name}
            </TableCell>
            {step.terminated !== undefined && (
            <><TableCell>
            <StatusComponent reason={step.terminated.reason} />{step.terminated.reason}
          </TableCell><TableCell>
              {step.terminated.startedAt}   
            </TableCell><TableCell>
              {step.terminated.finishedAt}
            </TableCell><TableCell>              
              <Button value="logs" onClick={() => handleClick(step)} disabled={isLoading}>Show Log</Button>
              {isLoading && (
                <CircularProgress size={15} />
              )}

              {!isLoading && data.data !== "" && (
                <StepLog opened={true} text={data.data} />
              )}
            </TableCell></>   
            )}                   
          </TableRow>
    </Fragment>
  );
}
