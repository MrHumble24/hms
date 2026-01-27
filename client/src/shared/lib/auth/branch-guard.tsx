import { Result } from "antd";
import { useTenantStore } from "@/entities/tenant/model/tenant-store";
import { BranchesOutlined } from "@ant-design/icons";

interface BranchGuardProps {
  children: React.ReactNode;
}

export const BranchGuard = ({ children }: BranchGuardProps) => {
  const { activeBranchId, availableBranches } = useTenantStore();
  const activeBranch = availableBranches.find((b) => b.id === activeBranchId);

  // If no branch selected, we might still want to allow access if the page handles it
  // But usually we always have a branch selected
  if (!activeBranchId) {
    return (
      <Result
        status="warning"
        title="No Branch Selected"
        subTitle="Please select a branch from the sidebar to continue."
      />
    );
  }

  if (activeBranch && !activeBranch.isActive) {
    return (
      <div
        style={{
          height: "calc(100vh - 200px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Result
          status="error"
          icon={<BranchesOutlined style={{ color: "#ff4d4f" }} />}
          title="Branch Deactivated"
          subTitle={`The branch "${activeBranch.name}" is currently deactivated. Please contact your administrator or switch to another branch.`}
        />
      </div>
    );
  }

  return <>{children}</>;
};
