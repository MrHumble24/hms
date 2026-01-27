import { Select, Space, Typography, Skeleton } from "antd";
import { BranchesOutlined } from "@ant-design/icons";
import { useTenantStore } from "@/entities/tenant/model/tenant-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { branchApi } from "@/entities/branch/api/branch-api";
import { useEffect } from "react";

const { Text } = Typography;

export const BranchSwitcher = () => {
  const queryClient = useQueryClient();
  const {
    activeBranchId,
    setActiveBranch,
    setAvailableBranches,
    activeTenantId,
  } = useTenantStore();

  const { data: branches, isLoading } = useQuery({
    queryKey: ["branches", activeTenantId],
    queryFn: () => branchApi.getAllBranches(activeTenantId || undefined),
    enabled: !!activeTenantId,
  });

  useEffect(() => {
    if (branches) {
      setAvailableBranches(branches);
    }
  }, [branches, setAvailableBranches]);

  const handleBranchChange = (branchId: string) => {
    setActiveBranch(branchId);

    // Invalidate all queries to refetch with new branch context
    queryClient.invalidateQueries();
  };

  if (isLoading) {
    return (
      <Space direction="vertical" style={{ width: "100%", padding: "16px" }}>
        <Skeleton.Input active size="small" style={{ width: "60px" }} />
        <Skeleton.Input active size="default" style={{ width: "100%" }} />
      </Space>
    );
  }

  if (!branches || branches.length === 0) {
    return null;
  }

  return (
    <Space direction="vertical" style={{ width: "100%", padding: "16px" }}>
      <Text type="secondary" style={{ fontSize: "12px" }}>
        <BranchesOutlined /> Branch
      </Text>
      <Select
        value={activeBranchId}
        onChange={handleBranchChange}
        style={{ width: "100%" }}
        options={branches.map((branch) => ({
          label: branch.isActive ? branch.name : `${branch.name} (Deactivated)`,
          value: branch.id,
          disabled: !branch.isActive,
        }))}
        placeholder="Select branch"
      />
    </Space>
  );
};
