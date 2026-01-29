import { useState } from "react";
import {
  Drawer,
  Tabs,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  Card,
  Badge,
  Descriptions,
  Popconfirm,
  message,
  Grid,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
} from "antd";
import {
  FileDoneOutlined,
  CalendarOutlined,
  PlusOutlined,
  DeleteOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companiesApi } from "@/entities/companies/api/companies-api";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/entities/user/model/auth-store";
import dayjs from "dayjs";

const { Text } = Typography;

interface CompanyDetailsProps {
  id: string | null;
  open: boolean;
  onClose: () => void;
}

export const CompanyDetails = ({ id, open, onClose }: CompanyDetailsProps) => {
  const { t } = useTranslation(["companies", "common"]);
  const screens = Grid.useBreakpoint();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  const canManage =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "MANAGER" ||
    user?.role === "ACCOUNTANT";

  const { data: company, isLoading } = useQuery({
    queryKey: ["companies", id],
    queryFn: () => companiesApi.findOne(id!),
    enabled: !!id && open,
  });

  const createContractMutation = useMutation({
    mutationFn: (values: any) =>
      companiesApi.createContract(id!, {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate ? values.endDate.toISOString() : undefined,
      }),
    onSuccess: () => {
      message.success(t("common:success"));
      queryClient.invalidateQueries({ queryKey: ["companies", id] });
      setIsContractModalOpen(false);
      form.resetFields();
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || t("common:error"));
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: (contractId: string) => companiesApi.removeContract(contractId),
    onSuccess: () => {
      message.success(t("common:deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: ["companies", id] });
    },
  });

  const bookingColumns = [
    {
      title: "Booking ID",
      dataIndex: "id",
      key: "id",
      render: (id: string) => <Text code>{id.slice(0, 8)}</Text>,
    },
    {
      title: "Guest",
      dataIndex: "guest",
      key: "guest",
      render: (guest: any) => guest?.fullName || "N/A",
    },
    {
      title: "Check-in",
      dataIndex: "checkIn",
      key: "checkIn",
      render: (d: string) => dayjs(d).format("DD MMM, YYYY"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <Tag color="blue">{status}</Tag>,
    },
  ];

  const contractColumns = [
    {
      title: "Discount",
      dataIndex: "discountPercent",
      key: "discount",
      render: (val: number) => <Text strong>{val}%</Text>,
    },
    {
      title: "Validity",
      key: "validity",
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13 }}>
            {dayjs(record.startDate).format("DD.MM.YY")} -{" "}
            {record.endDate ? dayjs(record.endDate).format("DD.MM.YY") : "∞"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "status",
      render: (active: boolean) => (
        <Tag color={active ? "green" : "gray"}>
          {active ? "Active" : "Expired"}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (record: any) =>
        canManage && (
          <Space>
            <Popconfirm
              title={t("common:areYouSure")}
              onConfirm={() => deleteContractMutation.mutate(record.id)}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          </Space>
        ),
    },
  ];

  return (
    <Drawer
      title={company?.name || "Company Profile"}
      width={screens.md ? 700 : "100%"}
      onClose={onClose}
      open={open}
      loading={isLoading}
    >
      {company && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card bordered={false} styles={{ body: { padding: 0 } }}>
            <Descriptions bordered size="small" column={screens.md ? 2 : 1}>
              <Descriptions.Item label="INN / Tax ID">
                {company.taxId}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge
                  status={company.isActive ? "processing" : "default"}
                  text={company.isActive ? "Active Client" : "Inactive"}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Contact">
                {company.contactPerson || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {company.phone || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Email" span={2}>
                {company.email || "-"}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Tabs
            defaultActiveKey="bookings"
            items={[
              {
                key: "bookings",
                label: (
                  <span>
                    <CalendarOutlined />
                    {t("companies:tabs.bookings")}
                    <Badge
                      count={company._count?.bookings}
                      offset={[10, -5]}
                      style={{ backgroundColor: "#f0f0f0", color: "#888" }}
                    />
                  </span>
                ),
                children: (
                  <Table
                    dataSource={company.bookings}
                    columns={bookingColumns}
                    pagination={{ pageSize: 5 }}
                    size="small"
                    scroll={{ x: true }}
                  />
                ),
              },
              {
                key: "contracts",
                label: (
                  <span>
                    <FileDoneOutlined />
                    {t("companies:tabs.contracts")}
                  </span>
                ),
                children: (
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        marginBottom: 16,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      {canManage && (
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => setIsContractModalOpen(true)}
                        >
                          {t("companies:actions.newContract")}
                        </Button>
                      )}
                    </div>
                    <Table
                      dataSource={company.contracts}
                      columns={contractColumns}
                      pagination={false}
                      size="small"
                      scroll={{ x: true }}
                    />
                  </div>
                ),
              },
            ]}
          />
        </Space>
      )}

      <Modal
        title={t("companies:actions.newContract")}
        open={isContractModalOpen}
        onCancel={() => {
          setIsContractModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={createContractMutation.isPending}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) => createContractMutation.mutate(v)}
          initialValues={{ startDate: dayjs(), isActive: true }}
        >
          <Form.Item
            name="discountPercent"
            label="Discount %"
            rules={[{ required: true }]}
          >
            <InputNumber
              min={0}
              max={100}
              style={{ width: "100%" }}
              prefix={<PercentageOutlined />}
              placeholder="e.g. 15"
            />
          </Form.Item>

          <Space style={{ width: "100%" }}>
            <Form.Item
              name="startDate"
              label="Start Date"
              rules={[{ required: true }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="endDate" label="End Date (Optional)">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Space>

          <Form.Item name="description" label="Internal Notes">
            <Input.TextArea rows={3} placeholder="Contract details..." />
          </Form.Item>
        </Form>
      </Modal>
    </Drawer>
  );
};
