import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Table, TableColumn, Progress, ResponseErrorPanel } from '@backstage/core-components';
import useAsync from 'react-use/lib/useAsync';
import { useApi } from '@backstage/core-plugin-api';
import { kubernetesApiRef } from '@backstage/plugin-kubernetes';

type Namespace = {
    metadata: {
      name: string;
     };
    };

type DenseTableProps = {
  namespaces: Namespace[];
};

const useStyles = makeStyles({
  avatar: {
    height: 32,
    width: 32,
    borderRadius: '50%',
  },
});

export const DenseTable = ({ namespaces }: DenseTableProps) => {
  const classes = useStyles();

  const columns: TableColumn[] = [{ title: 'Name', field: 'name' }];

  const data = namespaces.map(ns => {
    return {
      name: ns.metadata.name,
    };
  });

  return (
    <Table
      title="Example Namespace List (fetching data from k3d)"
      options={{ search: false, paging: false }}
      columns={columns}
      data={data}
      />
      );
};

export const ExampleFetchComponent = () => {

    const k8s = useApi(kubernetesApiRef);
    const { value, loading, error } = useAsync(async (): Promise<Namespace[]> => {
      const response = await k8s.proxy({
        clusterName: 'k3d',
        path: '/api/v1/namespaces',
      });
       const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      return data.items;
     }, []);
   
     if (loading) {
      return <Progress />;
    } else if (error) {
      return <ResponseErrorPanel error={error} />;
    }

     return <DenseTable namespaces={value || []} />;
};
