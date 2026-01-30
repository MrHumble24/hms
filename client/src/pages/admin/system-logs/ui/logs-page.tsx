import {
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Input,
  Select,
  Card,
  Grid,
  List,
  Modal,
  Descriptions,
} from "antd";
import { SearchOutlined, ReloadOutlined, EyeOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { adminApi, type SystemLog } from "@/entities/admin/api/admin-api";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

export const LogsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const context = searchParams.get("context") || "";
  const level = searchParams.get("level") || undefined;

  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["system-logs", page, pageSize, context, level],
    queryFn: () =>
      adminApi.getLogs({
        skip: (page - 1) * pageSize,
        take: pageSize,
        context,
        level,
      }),
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case "INFO":
        return "blue";
      case "WARN":
        return "orange";
      case "ERROR":
        return "red";
      case "FATAL":
        return "magenta";
      case "DEBUG":
        return "cyan";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "Level",
      dataIndex: "level",
      key: "level",
      width: 100,
      render: (level: string) => (
        <Tag color={getLevelColor(level)}>{level}</Tag>
      ),
    },
    {
      title: "Context",
      dataIndex: "context",
      key: "context",
      width: 120,
      render: (text: string) => (text ? <Tag>{text}</Tag> : "-"),
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      render: (text: string) => (
        <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 400 }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_: any, record: SystemLog) => (
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => setSelectedLog(record)}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? "16px" : "24px" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            gap: isMobile ? 16 : 0,
          }}
        >
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            System Logs
          </Title>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
        </div>

        <Card>
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              gap: 16,
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <Input
              placeholder="Filter by context (e.g. HTTP, DB)..."
              prefix={<SearchOutlined />}
              style={{ width: isMobile ? "100%" : 300 }}
              value={context}
              onChange={(e) => {
                const val = e.target.value;
                setSearchParams((prev) => {
                  if (val) prev.set("context", val);
                  else prev.delete("context");
                  prev.set("page", "1");
                  return prev;
                });
              }}
            />
            <Select
              placeholder="Filter by level"
              style={{ width: isMobile ? "100%" : 200 }}
              allowClear
              value={level}
              onChange={(val) => {
                setSearchParams((prev) => {
                  if (val) prev.set("level", val);
                  else prev.delete("level");
                  prev.set("page", "1");
                  return prev;
                });
              }}
            >
              <Option value="INFO">INFO</Option>
              <Option value="WARN">WARN</Option>
              <Option value="ERROR">ERROR</Option>
              <Option value="FATAL">FATAL</Option>
              <Option value="DEBUG">DEBUG</Option>
            </Select>
          </div>

          {!isMobile ? (
            <Table
              columns={columns}
              dataSource={data?.logs}
              loading={isLoading}
              rowKey="id"
              pagination={{
                current: page,
                pageSize: pageSize,
                total: data?.total,
                showSizeChanger: true,
                onChange: (newPage, newPageSize) => {
                  setSearchParams((prev) => {
                    prev.set("page", newPage.toString());
                    prev.set("pageSize", newPageSize.toString());
                    return prev;
                  });
                },
              }}
            />
          ) : (
            <List
              loading={isLoading}
              dataSource={data?.logs}
              pagination={{
                current: page,
                pageSize: pageSize,
                total: data?.total,
                align: "center",
                onChange: (newPage, newPageSize) => {
                  setSearchParams((prev) => {
                    prev.set("page", newPage.toString());
                    prev.set("pageSize", newPageSize.toString());
                    return prev;
                  });
                },
              }}
              renderItem={(record: SystemLog) => (
                <List.Item>
                  <Card
                    style={{ width: "100%" }}
                    title={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <Tag color={getLevelColor(record.level)}>
                          {record.level}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          {dayjs(record.timestamp).format("HH:mm:ss")}
                        </Text>
                      </div>
                    }
                    extra={
                      <Button
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => setSelectedLog(record)}
                      />
                    }
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      {record.context && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text type="secondary">Context:</Text>
                          <Tag>{record.context}</Tag>
                        </div>
                      )}
                      <Text>{record.message}</Text>
                    </Space>
                  </Card>
                </List.Item>
              )}
            />
          )}
        </Card>
      </Space>

      <Modal
        title="Log Details"
        open={!!selectedLog}
        onCancel={() => setSelectedLog(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedLog(null)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedLog && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Timestamp">
              {dayjs(selectedLog.timestamp).format("YYYY-MM-DD HH:mm:ss")}
            </Descriptions.Item>
            <Descriptions.Item label="Level">
              <Tag color={getLevelColor(selectedLog.level)}>
                {selectedLog.level}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Context">
              {selectedLog.context || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Message">
              {selectedLog.message}
            </Descriptions.Item>
            <Descriptions.Item label="Metadata">
              <pre
                style={{
                  maxHeight: "300px",
                  overflow: "auto",
                  background: "#f5f5f5",
                  padding: "8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};
