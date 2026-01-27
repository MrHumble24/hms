import { useState } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Popconfirm,
  message,
  Card,
  Input,
  Modal,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roomApi, type RoomDashboardItem } from "@/entities/room/api/room-api";
import { RoomForm } from "@/widgets/room-form/ui/room-form";
import { useTranslation } from "react-i18next";
import { usePaginationSearchParams } from "@/shared/hooks/use-pagination-search-params";

const { Title, Text } = Typography;

export const RoomsManagementPage = () => {
  const { t } = useTranslation(["inventory", "common"]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomDashboardItem | null>(
    null,
  );
  const [qrRoom, setQrRoom] = useState<RoomDashboardItem | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const queryClient = useQueryClient();
  const { params, handleSearch, pagination, apiParams } =
    usePaginationSearchParams();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["rooms-inventory", apiParams],
    queryFn: () => roomApi.getAllRooms(apiParams),
  });

  const rooms = data?.data || [];
  const total = data?.total || 0;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roomApi.removeRoom(id),
    onSuccess: () => {
      message.success(t("common:deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: ["rooms-inventory"] });
    },
    onError: () => {
      message.error(t("common:error"));
    },
  });

  // Client-side filtering removed in favor of server-side
  const filteredRooms = rooms;

  const handleBulkQrDownload = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select rooms first");
      return;
    }
    setIsBulkLoading(true);
    try {
      const blob = await roomApi.bulkQrDownload(selectedRowKeys as string[]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "room-qrs.zip");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success("Bulk QR codes downloaded");
    } catch (err) {
      message.error("Failed to download QR codes");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const columns = [
    {
      title: t("inventory:roomNumber"),
      dataIndex: "number",
      key: "number",
      render: (text: string) => (
        <Text strong style={{ fontSize: 16 }}>
          {text}
        </Text>
      ),
      sorter: (a: any, b: any) => a.number.localeCompare(b.number),
    },
    {
      title: t("inventory:roomType"),
      key: "type",
      render: (record: RoomDashboardItem) => (
        <Space direction="vertical" size={0}>
          <Text>{record.type.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {new Intl.NumberFormat().format(Number(record.type.basePrice))} UZS
          </Text>
        </Space>
      ),
    },
    {
      title: t("inventory:floor"),
      dataIndex: "floor",
      key: "floor",
      render: (floor: number) => (
        <Tag color="purple">
          {t("inventory:floor")} {floor}
        </Tag>
      ),
      sorter: (a: any, b: any) => a.floor - b.floor,
    },
    {
      title: t("inventory:capacity"),
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity: number) => (
        <Text>
          {capacity} {t("common:pax") || "Pax"}
        </Text>
      ),
    },
    {
      title: t("common:status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colors: any = {
          CLEAN: "success",
          DIRTY: "warning",
          MAINTENANCE: "error",
          INSPECTED: "processing",
        };
        return <Tag color={colors[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: t("common:actions"),
      key: "actions",
      render: (record: RoomDashboardItem) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<QrcodeOutlined />}
            onClick={() => setQrRoom(record)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedRoom(record);
              setIsFormOpen(true);
            }}
          />
          <Popconfirm
            title={t("common:deleteConfirm")}
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          background: "#fff",
          padding: "24px",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0, fontSize: 24 }}>
              {t("inventory:roomInventoryTitle")}
            </Title>
            <Text type="secondary">{t("inventory:roomInventorySubtitle")}</Text>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={() => refetch()}
            >
              {t("common:refresh")}
            </Button>
            <Button
              icon={<QrcodeOutlined />}
              disabled={selectedRowKeys.length === 0}
              loading={isBulkLoading}
              onClick={handleBulkQrDownload}
            >
              {selectedRowKeys.length > 0
                ? `Download ${selectedRowKeys.length} QR Codes`
                : "Bulk QRs"}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => {
                setSelectedRoom(null);
                setIsFormOpen(true);
              }}
            >
              {t("inventory:addRoom")}
            </Button>
          </Space>
        </div>

        <Input
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder="Search by room #..."
          style={{ maxWidth: 400 }}
          size="large"
          allowClear
          value={params.search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <Card
        bodyStyle={{ padding: 0 }}
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          columns={columns}
          dataSource={filteredRooms}
          loading={isLoading}
          rowKey="id"
          pagination={{ ...pagination, total }}
        />
      </Card>

      <RoomForm
        open={isFormOpen}
        initialValues={selectedRoom}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedRoom(null);
        }}
      />

      <Modal
        title={`Room ${qrRoom?.number} QR Code`}
        open={!!qrRoom}
        onCancel={() => setQrRoom(null)}
        footer={[
          <Button key="close" onClick={() => setQrRoom(null)}>
            Close
          </Button>,
        ]}
        centered
        width={350}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "20px 0",
            gap: 20,
          }}
        >
          <div
            style={{
              padding: 16,
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <QRCodeSVG
              value={`${window.location.origin}/restaurant/public/menu?room=${qrRoom?.id}&tenant=${localStorage.getItem("activeTenantId")}&branch=${localStorage.getItem("activeBranchId")}`}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <div style={{ textAlign: "center" }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Scan this code to open the restaurant menu for room{" "}
              <strong>{qrRoom?.number}</strong>
            </Text>
          </div>
          <Button
            type="dashed"
            onClick={() =>
              window.open(
                `${window.location.origin}/restaurant/public/menu?room=${qrRoom?.id}&tenant=${localStorage.getItem("activeTenantId")}&branch=${localStorage.getItem("activeBranchId")}`,
                "_blank",
              )
            }
          >
            Open Menu Link
          </Button>
        </div>
      </Modal>
    </div>
  );
};
