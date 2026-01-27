import { Tabs, Typography, Card } from "antd";
import { BranchManagement } from "@/widgets/branch-management/ui/branch-management";
import { BackupPage } from "@/pages/settings/ui/backup-page";
import {
  SettingOutlined,
  BranchesOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export const SettingsPage = () => {
  const items = [
    {
      key: "general",
      label: (
        <span>
          <SettingOutlined /> General
        </span>
      ),
      children: (
        <Card title="General Settings">
          <Text>General application settings will go here.</Text>
        </Card>
      ),
    },
    {
      key: "branches",
      label: (
        <span>
          <BranchesOutlined /> Branches
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
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Settings
        </Title>
        <Text type="secondary">Manage application configuration</Text>
      </div>

      <Tabs defaultActiveKey="general" items={items} />
    </div>
  );
};
