import { useState } from "react";
import {
  Card,
  Button,
  Typography,
  Space,
  App,
  Modal,
  Upload,
  Input,
  Alert,
  Table,
} from "antd";
import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  UploadOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { backupApi } from "@/entities/backup/api/backup-api";
import type { UploadFile } from "antd/es/upload/interface";

const { Title, Text, Paragraph } = Typography;

export const BackupPage = () => {
  const { message, modal } = App.useApp();
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreSecret, setRestoreSecret] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const backupsQuery = useQuery({
    queryKey: ["backups"],
    queryFn: backupApi.getBackups,
  });

  const createBackupMutation = useMutation({
    mutationFn: backupApi.createBackup,
    onSuccess: () => {
      message.success("Backup created successfully and sent to Telegram!");
    },
    onError: (error: any) => {
      message.error(`Backup failed: ${error.message}`);
    },
  });

  const restoreBackupMutation = useMutation({
    mutationFn: ({ file, secret }: { file: File; secret: string }) =>
      backupApi.restoreBackup(file, secret),
    onSuccess: () => {
      message.success("System restored successfully!");
      setIsRestoreModalOpen(false);
      setRestoreSecret("");
      setFileList([]);
      // Optional: Refresh page or logout
    },
    onError: (error: any) => {
      message.error(
        `Restore failed: ${error.response?.data?.message || error.message}`,
      );
    },
  });

  const handleCreateBackup = () => {
    modal.confirm({
      title: "Create System Backup",
      content:
        "This will generate a full database backup and send it to the configured Telegram chat. Do you want to proceed?",
      onOk: () => createBackupMutation.mutate(),
    });
  };

  const handleRestore = () => {
    if (fileList.length === 0) {
      message.warning("Please select a backup file to restore.");
      return;
    }
    if (!restoreSecret) {
      message.warning("Please enter the emergency restore secret.");
      return;
    }

    const file = fileList[0].originFileObj as File;
    restoreBackupMutation.mutate({ file, secret: restoreSecret });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Title level={4}>System Backup & Restore</Title>
        <Paragraph type="secondary">
          Manage system backups and emergency restoration. Automated daily
          backups are configured to run at midnight.
        </Paragraph>
      </div>

      <Card title="Manual Backup">
        <Space direction="vertical">
          <Text>
            Trigger a manual backup immediately. The backup file will be sent to
            the Telegram bot.
          </Text>
          <Button
            type="primary"
            icon={<CloudDownloadOutlined />}
            onClick={handleCreateBackup}
            loading={createBackupMutation.isPending}
          >
            Create Backup Now
          </Button>
        </Space>
      </Card>

      <Card title="Available Backups">
        <Table
          dataSource={backupsQuery.data || []}
          rowKey="filename"
          loading={backupsQuery.isLoading}
          columns={[
            {
              title: "Filename",
              dataIndex: "filename",
              key: "filename",
            },
            {
              title: "Size",
              dataIndex: "size",
              key: "size",
              render: (size) => (size / 1024 / 1024).toFixed(2) + " MB",
            },
            {
              title: "Created At",
              dataIndex: "createdAt",
              key: "createdAt",
              render: (date) => new Date(date).toLocaleString(),
            },
            {
              title: "Action",
              key: "action",
              render: (_, record: any) => (
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    const url = backupApi.getDownloadUrl(record.filename);
                    window.open(url, "_blank");
                  }}
                >
                  Download
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Emergency Restore" style={{ borderColor: "#ff4d4f" }}>
        <Space direction="vertical">
          <Alert
            message="Danger Zone"
            description="Restoring from a backup will overwrite the current database. This action cannot be undone."
            type="error"
            showIcon
          />
          <Text>
            Restore the system from a backup file. You will need the Emergency
            Restore Secret.
          </Text>
          <Button
            danger
            icon={<CloudUploadOutlined />}
            onClick={() => setIsRestoreModalOpen(true)}
          >
            Restore System...
          </Button>
        </Space>
      </Card>

      <Modal
        title="Restore System from Backup"
        open={isRestoreModalOpen}
        onCancel={() => setIsRestoreModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsRestoreModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="restore"
            type="primary"
            danger
            loading={restoreBackupMutation.isPending}
            onClick={handleRestore}
          >
            Restore Database
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Alert
            message="Warning: This will wipe current data!"
            type="warning"
            showIcon
          />

          <div>
            <Text strong>1. Select Backup File (.dump, .sql, .tar)</Text>
            <Upload
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList.slice(-1))}
              accept=".dump,.sql,.tar"
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </div>

          <div>
            <Text strong>2. Enter Emergency Secret</Text>
            <Input.Password
              placeholder="Enter secret key..."
              value={restoreSecret}
              onChange={(e) => setRestoreSecret(e.target.value)}
            />
          </div>
        </Space>
      </Modal>
    </Space>
  );
};
