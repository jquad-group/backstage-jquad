/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
// eslint-disable-next-line  no-restricted-imports
import { Table, TableContainer, TableBody, TableRow, TableCell, TableHead, Paper, TablePagination, TableFooter } from '@material-ui/core';
import { PipelineRun } from '@jquad-group/plugin-tekton-pipelines-common';
import TablePaginationActions from '@material-ui/core/TablePagination/TablePaginationActions';
import { CollapsibleTableRow } from '../CollapsibleTableRow';

export const TEKTON_PIPELINES_BUILD_NAMESPACE = 'tektonci/build-namespace';
export const TEKTON_PIPELINES_LABEL_SELECTOR = "tektonci/pipeline-label-selector";


type PipelineRunProps = {
  pipelineruns?: PipelineRun[];
};

export const CollapsibleTable = ({ pipelineruns }: PipelineRunProps) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  // Avoid a layout jump when reaching the last page with empty rows.
  if (pipelineruns != undefined) {
  var emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - pipelineruns.length) : 0;
  } else {
    var emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage) : 0;
  }

  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Name</TableCell>
            <TableCell align="right">Namespace</TableCell>
            <TableCell align="right">Status</TableCell>
            <TableCell align="right">Start Time</TableCell>
            <TableCell align="right">Duration</TableCell>
            <TableCell align="right">Dashboard</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(pipelineruns != undefined) && (rowsPerPage > 0
            ? pipelineruns.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            : pipelineruns
          ).map((pipelineRun) => (            
            <CollapsibleTableRow key={pipelineRun.metadata.name} pipelineRun={pipelineRun} />
          ))}
          {emptyRows > 0 && (
            <TableRow style={{ height: 53 * emptyRows }}>
              <TableCell colSpan={7} />
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          { pipelineruns != undefined && <TableRow>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
              colSpan={7}
              count={pipelineruns.length}
              rowsPerPage={rowsPerPage}
              page={page}
              SelectProps={{
                inputProps: {
                  'aria-label': 'rows per page',
                },
                native: true,
              }}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              ActionsComponent={TablePaginationActions}
            />
          </TableRow>
          }
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
