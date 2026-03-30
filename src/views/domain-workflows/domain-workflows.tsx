'use client';
import React, { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

import useSuspenseConfigValue from '@/hooks/use-config-value/use-suspense-config-value';
import { type DescribeClusterResponse } from '@/route-handlers/describe-cluster/describe-cluster.types';
import request from '@/utils/request';
import { type DomainPageTabContentProps } from '@/views/domain-page/domain-page-content/domain-page-content.types';
import useUserInfo from '@/views/shared/hooks/use-user-info/use-user-info';

import isClusterAdvancedVisibilityEnabled from './helpers/is-cluster-advanced-visibility-enabled';

const DomainWorkflowsBasic = dynamic(
  () => import('@/views/domain-workflows-basic/domain-workflows-basic')
);

const DomainWorkflowsAdvanced = dynamic(
  () => import('./domain-workflows-advanced/domain-workflows-advanced')
);

export default function DomainWorkflows(props: DomainPageTabContentProps) {
  const { data: authInfo, isLoading: isAuthLoading } = useUserInfo();

  const isAdmin = authInfo?.isAdmin === true;
  const isAuthEnabled = authInfo?.authEnabled === true;
  const isValidToken = authInfo?.auth?.isValidToken === true;
  const isAuthenticatedNonAdmin = isAuthEnabled && isValidToken && !isAdmin;

  const shouldFetchClusterInfo =
    Boolean(authInfo) && (!isAuthEnabled || isAdmin);

  const { data: clusterInfo } = useQuery<DescribeClusterResponse>({
    queryKey: ['describeCluster', props.cluster],
    queryFn: () =>
      request(`/api/clusters/${props.cluster}`).then((res) => res.json()),
    enabled: shouldFetchClusterInfo,
    retry: false,
    throwOnError: shouldFetchClusterInfo,
  });

  const isAdvancedVisibilityEnabled = useMemo(() => {
    // Non-admin authenticated users may not be allowed to call describeCluster,
    // so default them to the basic workflows view.
    // TODO: Revisit the non-admin default to basic visibility once the https://github.com/cadence-workflow/cadence/issues/7784 is resolved.
    if (isAuthenticatedNonAdmin) {
      return false;
    }
    if (!clusterInfo) return false;
    return isClusterAdvancedVisibilityEnabled(clusterInfo);
  }, [clusterInfo, isAuthenticatedNonAdmin]);

  const { data: isNewWorkflowsListEnabled } = useSuspenseConfigValue(
    'WORKFLOWS_LIST_ENABLED'
  );

  if (isAuthLoading) {
    return null;
  }

  if (!isAdvancedVisibilityEnabled) {
    return (
      <DomainWorkflowsBasic domain={props.domain} cluster={props.cluster} />
    );
  }

  return (
    <DomainWorkflowsAdvanced
      domain={props.domain}
      cluster={props.cluster}
      isNewWorkflowsListEnabled={isNewWorkflowsListEnabled}
    />
  );
}
