import { Modal, Form, Input, Select, message } from "antd";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { housekeepingApi } from "@/entities/housekeeping/api/housekeeping-api";
import { staffApi } from "@/entities/staff/api/staff-api";
import { roomApi } from "@/entities/room/api/room-api";

interface AssignTaskModalProps {
  visible: boolean;
  onCancel: () => void;
}

export const AssignTaskModal = ({
  visible,
  onCancel,
}: AssignTaskModalProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: housekeepers } = useQuery({
    queryKey: ["staff", "HOUSEKEEPER"],
    queryFn: () => staffApi.getStaffByRole("HOUSEKEEPER"),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomApi.getAllRooms().then((res) => res.data),
  });

  const createTaskMutation = useMutation({
    mutationFn: housekeepingApi.createTask,
    onSuccess: () => {
      message.success("Task assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["housekeeping-rooms"] });
      // Invalidate tasks if we had a tasks list query
      form.resetFields();
      onCancel();
    },
    onError: () => {
      message.error("Failed to assign task");
    },
  });

  return (
    <Modal
      title="Assign Housekeeping Task"
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={createTaskMutation.isPending}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => createTaskMutation.mutate(values)}
        initialValues={{ priority: "MEDIUM" }}
      >
        <Form.Item
          name="roomId"
          label="Room"
          rules={[{ required: true, message: "Please select a room" }]}
        >
          <Select
            showSearch
            placeholder="Select a room"
            optionFilterProp="children"
          >
            {rooms?.map((room: any) => (
              <Select.Option key={room.id} value={room.id}>
                {room.number} ({room.status})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="assigneeId" label="Assign To (Optional)">
          <Select placeholder="Select housekeeper">
            {housekeepers?.map((staff) => (
              <Select.Option key={staff.id} value={staff.id}>
                {staff.fullName}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="priority"
          label="Priority"
          rules={[{ required: true }]}
        >
          <Select>
            <Select.Option value="LOW">Low</Select.Option>
            <Select.Option value="MEDIUM">Medium</Select.Option>
            <Select.Option value="HIGH">High</Select.Option>
            <Select.Option value="URGENT">Urgent</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} placeholder="e.g. Extra towels needed" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
