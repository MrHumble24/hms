import { Result, Button } from "antd";
import { useTenantStore } from "@/entities/tenant/model/tenant-store";
import { BranchesOutlined, SettingOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

interface BranchGuardProps {
  children: React.ReactNode;
}

export const BranchGuard = ({ children }: BranchGuardProps) => {
  const { activeBranchId, availableBranches } = useTenantStore();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Check if setup is completed
  // We allow the user to be on /settings while completing setup
  const isSettingsPage = location.pathname === "/settings";
  if (activeBranch && !activeBranch.isSetupCompleted && !isSettingsPage) {
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
          status="info"
          icon={<SettingOutlined style={{ color: "#1677ff" }} />}
          title="Hotel Setup Required"
          subTitle={`Welcome! Please complete the basic configuration for "${activeBranch.name}" to unlock all features.`}
          extra={
            <Button
              type="primary"
              size="large"
              onClick={() => navigate("/settings")}
            >
              Complete Setup Now
            </Button>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
};
