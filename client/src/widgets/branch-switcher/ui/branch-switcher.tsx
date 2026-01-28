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
    console.log("🔀 Branch Change - Setting to:", branchId);

    // First, update localStorage directly to ensure it's set before any API calls
    localStorage.setItem("activeBranchId", branchId);

    // Then update the store state
    setActiveBranch(branchId);

    // Verify localStorage was updated
    console.log(
      "🔍 LocalStorage immediately after:",
      localStorage.getItem("activeBranchId"),
    );

    // Use setTimeout to ensure the state is fully propagated before refetching
    // This creates a new event loop tick, ensuring all synchronous updates are done
    setTimeout(() => {
      console.log(
        "🔄 Invalidating queries with branchId:",
        localStorage.getItem("activeBranchId"),
      );
      queryClient.invalidateQueries();
    }, 0);
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
