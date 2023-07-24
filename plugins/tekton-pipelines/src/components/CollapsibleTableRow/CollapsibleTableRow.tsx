import React from 'react';
import { StatusError, StatusOK, StatusPending, StatusRunning, StatusWarning } from '@backstage/core-components';
// eslint-disable-next-line  no-restricted-imports
import { KeyboardArrowDown, KeyboardArrowUp } from '@material-ui/icons';
import { Table, Typography, TableBody, TableRow, TableCell, IconButton, Collapse, TableHead } from '@material-ui/core';
/* ignore lint error for internal dependencies */
/* eslint-disable */
import { Condition, PipelineRun } from '../../types';
import { TaskRunRow } from '../TaskRunRow';
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
  
  
  if (pipelineRun.status.completionTime === undefined) {
    pipelineRun.status.completionTime = "";
  }

  return (
    <React.Fragment>
      <TableRow>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
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
          <Typography variant="h6" gutterBottom component="div">
            TaskRuns
          </Typography>
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
              {pipelineRun.taskRuns !== undefined &&
                pipelineRun.taskRuns.map((taskRunRow) => (
                  <TaskRunRow key={taskRunRow.metadata.name} clusterName={clusterName} taskRun={taskRunRow}/>
                ))}
            </TableBody>
          </Table>
        </Collapse>
      </TableCell>
    </React.Fragment>
  );
}


