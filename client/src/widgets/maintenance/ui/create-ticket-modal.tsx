import { Modal, Form, Input, Select, message } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { maintenanceApi } from "@/entities/maintenance/api/maintenance-api";
import { roomApi } from "@/entities/room/api/room-api";

interface CreateTicketModalProps {
  visible: boolean;
  onCancel: () => void;
}

export const CreateTicketModal = ({
  visible,
  onCancel,
}: CreateTicketModalProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomApi.getAllRooms().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: maintenanceApi.create,
    onSuccess: () => {
      message.success("Maintenance ticket created");
      queryClient.invalidateQueries({ queryKey: ["maintenance-tickets"] });
      form.resetFields();
      onCancel();
    },
    onError: () => {
      message.error("Failed to create ticket");
    },
  });

  return (
    <Modal
      title="Report Maintenance Issue"
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={createMutation.isPending}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => createMutation.mutate(values)}
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
                {room.number} ({room.type?.name})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: "Please describe the issue" }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
