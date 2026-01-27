import {
  Card,
  List,
  Tag,
  Button,
  Space,
  Typography,
  Modal,
  Input,
  message,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  housekeepingApi,
  TaskStatus,
} from "@/entities/housekeeping/api/housekeeping-api";
import { useTranslation } from "react-i18next";
import { CheckCircleOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/entities/user/model/auth-store";
import { useState } from "react";

const { Text } = Typography;

export const MobileTaskList = () => {
  const { t } = useTranslation(["housekeeping", "common"]);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [completeModal, setCompleteModal] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState("");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["housekeeping", "my-tasks"],
    queryFn: housekeepingApi.findAll, // Ideally filtered by assignee=me
  });

  const completeMutation = useMutation({
    mutationFn: (taskId: string) =>
      housekeepingApi.update(taskId, {
        status: TaskStatus.COMPLETED,
        completedById: user!.id,
        notes: completionNote,
      }),
    onSuccess: async () => {
      message.success(t("housekeeping:actions.completed"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["housekeeping"] }),
        queryClient.invalidateQueries({ queryKey: ["rooms"] }),
        queryClient.invalidateQueries({ queryKey: ["housekeeping-rooms"] }),
      ]);
      await queryClient.refetchQueries({ queryKey: ["housekeeping"] });
      setCompleteModal(null);
      setCompletionNote("");
    },
  });

  const myTasks = tasks.filter(
    (t: any) => t.assigneeId === user?.id && t.status !== "COMPLETED",
  );

  return (
    <div style={{ padding: "8px 0" }}>
      <List
        loading={isLoading}
        dataSource={myTasks}
        renderItem={(item: any) => (
          <Card
            style={{ marginBottom: 12, borderRadius: 12 }}
            styles={{ body: { padding: 12 } }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Space>
                <EnvironmentOutlined style={{ color: "#1890ff" }} />
                <Text strong style={{ fontSize: 18 }}>
                  {item.room?.number}
                </Text>
                <Tag color={item.priority === "URGENT" ? "red" : "blue"}>
                  {item.priority}
                </Tag>
              </Space>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">{item.room?.type?.name}</Text>
              {item.notes && (
                <div
                  style={{
                    marginTop: 4,
                    background: "#fff7e6",
                    padding: 4,
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ fontSize: 12 }}>Note: {item.notes}</Text>
                </div>
              )}
            </div>

            <Button
              type="primary"
              block
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={() => setCompleteModal(item.id)}
            >
              {t("housekeeping:actions.markClean")}
            </Button>
          </Card>
        )}
      />

      <Modal
        title={t("housekeeping:actions.completeTask")}
        open={!!completeModal}
        onOk={() => completeMutation.mutate(completeModal!)}
        onCancel={() => setCompleteModal(null)}
        confirmLoading={completeMutation.isPending}
        okText={t("common:confirm")}
      >
        <p>{t("housekeeping:confirmClean")}</p>
        <Input.TextArea
          placeholder={t("housekeeping:placeholders.completionNote")}
          value={completionNote}
          onChange={(e) => setCompletionNote(e.target.value)}
        />
      </Modal>
    </div>
  );
};
