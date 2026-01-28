import { Tabs, Typography, Card } from "antd";
import { BranchManagement } from "@/widgets/branch-management/ui/branch-management";
import { BackupPage } from "@/pages/settings/ui/backup-page";
import { BranchSettings } from "@/widgets/branch-settings/ui/branch-settings";
import {
  SettingOutlined,
  BranchesOutlined,
  DatabaseOutlined,
  HomeOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export const SettingsPage = () => {
  const items = [
    {
      key: "hotel",
      label: (
        <span>
          <HomeOutlined /> Hotel Configuration
        </span>
      ),
      children: <BranchSettings />,
    },
    {
      key: "branches",
      label: (
        <span>
          <BranchesOutlined /> Branches List
        </span>
      ),
      children: (
        <Card title="Branch Management">
          <BranchManagement />
        </Card>
      ),
    },
    {
      key: "backups",
      label: (
        <span>
          <DatabaseOutlined /> Backups
        </span>
      ),
      children: <BackupPage />,
    },
    {
      key: "general",
      label: (
        <span>
          <SettingOutlined /> System Settings
        </span>
      ),
      children: (
        <Card title="General Settings">
          <Text>General application settings will go here.</Text>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Settings
        </Title>
        <Text type="secondary">
          Manage your hotel configuration and branch details
        </Text>
      </div>

      <Tabs defaultActiveKey="hotel" items={items} />
    </div>
  );
};
