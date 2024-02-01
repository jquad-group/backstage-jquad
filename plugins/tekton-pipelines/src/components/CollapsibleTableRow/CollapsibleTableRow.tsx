import React from 'react';
import { StatusError, StatusOK, StatusPending, StatusRunning, StatusWarning } from '@backstage/core-components';
// eslint-disable-next-line  no-restricted-imports
import { KeyboardArrowDown, KeyboardArrowUp } from '@material-ui/icons';
import { Table, TableBody, TableRow, TableCell, IconButton, Collapse, TableHead, CircularProgress } from '@material-ui/core';
/* ignore lint error for internal dependencies */
/* eslint-disable */
import { Condition, PipelineRun, TaskRun } from '../../types';
import { TaskRunRow } from '../TaskRunRow';
import { kubernetesApiRef } from '@backstage/plugin-kubernetes';
import { useApi } from '@backstage/core-plugin-api';
/* eslint-enable */


function StatusComponent(props: { conditions: [Condition]; }): JSX.Element {
  if (props.conditions !== undefined) {
    if (props.conditions[0].reason === 'Created') {
      return <StatusPending />;
    } else
      if (props.conditions[0].reason === 'Running') {
        return <StatusRunning />;
      } else
        if (props.conditions[0].reason === 'Completed') {
          return <StatusOK />;
        } else
          if (props.conditions[0].reason === 'Succeeded') {
            return <StatusOK />;
          } else
            if (props.conditions[0].reason === 'PipelineRunCancelled') {
              return <StatusWarning />;
            } else
              if (props.conditions[0].reason === 'Failed') {
                return <StatusError />;
              } else 
                if (props.conditions[0].reason === 'Error') {
                  return <StatusError />;
                }
  } else {
    return <StatusPending />;
  }   
  return <StatusPending />;

}
 
export function CollapsibleTableRow(props: { clusterName: string, pipelineRun: PipelineRun }) {
  const { clusterName, pipelineRun } = props;
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [taskRuns, setTaskRuns] = React.useState<TaskRun[]>([]);
  
  const k8s = useApi(kubernetesApiRef);

  async function fetchTaskRuns() {
    setIsLoading(true);
    const url = `/apis/${pipelineRun.apiVersion}/namespaces/${pipelineRun.metadata.namespace}/taskruns?labelSelector=tekton.dev/pipelineRun%3D${pipelineRun.metadata.name}&limit=100`;

    try {
      const response = await k8s.proxy({
        clusterName: clusterName,
        path: url,
      });

      if (response && response.status === 200) {
        const responseData = await response.json();
        if (responseData && responseData.items) {          
          setTaskRuns(responseData.items);
        }
      } else {
        // console.error('Error fetching data:', response);
      }
    } catch (error) {
      // console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setOpen(!open); // Toggle the 'open' state
    }
  };

  /*
  useEffect(() => {
    // This useEffect will run whenever kubernetesObjects changes
    // If kubernetesObjects is not undefined or null, setLoading to false
    if (taskRuns !== undefined && taskRuns !== null) {
      setIsLoading(false);
    }
  }, [taskRuns]);
  */
  

  const handleClick = async () => {
    setOpen(!open); // Toggle the 'open' state
    fetchTaskRuns();
  };
  
  return (
    <React.Fragment>
      <TableRow>
        <TableCell>        
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={handleClick}
          >            
            {isLoading ? <CircularProgress size={24} /> : (open ? <KeyboardArrowUp /> : <KeyboardArrowDown />)}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {pipelineRun.metadata.name}
        </TableCell>
        <TableCell align="right">{pipelineRun.metadata.namespace}</TableCell>        
        { pipelineRun.status.conditions !== undefined && (
          <TableCell align="right">
          <StatusComponent conditions={pipelineRun.status.conditions} />{pipelineRun.status.conditions[0].reason}</TableCell>
        )}
        { pipelineRun.status.conditions === undefined && (
        <TableCell align="right"><StatusComponent conditions={pipelineRun.status.conditions} />Pending</TableCell>
        )}        
        <TableCell align="right">{pipelineRun.status.startTime}</TableCell>
        <TableCell align="right">{pipelineRun.status.completionTime}</TableCell>
        <TableCell align="right"><a href={pipelineRun.pipelineRunDashboardUrl} target="_blank">Link</a></TableCell>
      </TableRow>
      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Table size="small" aria-label="taskruns">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Step</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>Completition Time</TableCell>
                <TableCell>Log</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>            
              {taskRuns && taskRuns.map((taskRunRow) => (
                <TaskRunRow key={taskRunRow.metadata.name} clusterName={clusterName} taskRun={taskRunRow}/>
              ))}            
            </TableBody>
          </Table>
        </Collapse>
      </TableCell>
    </React.Fragment>
  );
}


