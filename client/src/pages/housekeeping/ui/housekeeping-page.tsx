import { useState, useMemo } from "react";
import {
  Card,
  Segmented,
  Button,
  Typography,
  Row,
  Col,
  Tag,
  Space,
  Grid,
  Pagination,
  Input,
  Table,
  Spin,
  Empty,
  type TableColumnsType,
} from "antd";
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { RoomStatus } from "@/entities/housekeeping/api/housekeeping-api";
import {
  roomApi,
  type RoomDashboardItem,
} from "@/entities/room/api/room-api";
import { useTranslation } from "react-i18next";
import { RoomStatusDrawer } from "@/widgets/housekeeping/ui/room-status-drawer";
import { MobileTaskList } from "@/widgets/housekeeping/ui/mobile-task-list";
import { AssignTaskModal } from "@/widgets/housekeeping/ui/assign-task-modal";
import { useAuthStore } from "@/entities/user/model/auth-store";
import { usePaginationSearchParams } from "@/shared/hooks/use-pagination-search-params";

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  [RoomStatus.CLEAN]: "#52c41a",
  [RoomStatus.DIRTY]: "#ff4d4f",
  [RoomStatus.INSPECTED]: "#1890ff",
  [RoomStatus.MAINTENANCE]: "#8c8c8c",
};

export const HousekeepingPage = () => {
  const { t } = useTranslation(["housekeeping", "common", "rooms"]);
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<"Grid" | "List">("Grid");
  const [selectedRoom, setSelectedRoom] = useState<RoomDashboardItem | null>(
    null,
  );
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const { params, handleSearch, pagination, apiParams } =
    usePaginationSearchParams(24);

  const {
    data: roomsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["housekeeping-rooms", apiParams],
    queryFn: () => roomApi.getAllRooms(apiParams),
  });

  const rooms = roomsData?.data || [];
  const total = roomsData?.total || 0;

  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const statusLabel = useMemo(
    () => (status: string) => {
      const map: Record<string, string> = {
        CLEAN: t("housekeeping:status.clean"),
        DIRTY: t("housekeeping:status.dirty"),
        INSPECTED: t("housekeeping:status.inspected"),
        MAINTENANCE: t("housekeeping:status.maintenance"),
      };
      return map[status] || status;
    },
    [t],
  );

  const listColumns: TableColumnsType<RoomDashboardItem> = useMemo(
    () => [
      {
        title: t("housekeeping:columns.room"),
        dataIndex: "number",
        key: "number",
        width: 110,
        sorter: (a, b) =>
          String(a.number).localeCompare(String(b.number), undefined, {
            numeric: true,
          }),
      },
      {
        title: t("housekeeping:columns.floor"),
        dataIndex: "floor",
        key: "floor",
        width: 88,
        sorter: (a, b) => (a.floor ?? 0) - (b.floor ?? 0),
        render: (floor: number | undefined) =>
          floor != null ? floor : "—",
      },
      {
        title: t("housekeeping:columns.type"),
        key: "type",
        ellipsis: true,
        render: (_: unknown, record) => record.type?.name ?? "—",
      },
      {
        title: t("housekeeping:columns.status"),
        dataIndex: "status",
        key: "status",
        width: 160,
        render: (status: string) => (
          <Tag color={STATUS_COLORS[status] || "default"}>
            {statusLabel(status)}
          </Tag>
        ),
      },
    ],
    [t, statusLabel],
  );

  const renderGrid = () => (
    <>
      <Row gutter={[16, 16]}>
        {rooms.map((room) => (
          <Col xs={12} sm={8} md={6} lg={4} key={room.id}>
            <Card
              hoverable
              onClick={() => setSelectedRoom(room)}
              styles={{ body: { padding: 12 } }}
              style={{
                borderTop: `4px solid ${STATUS_COLORS[room.status] || "orange"}`,
                textAlign: "center",
              }}
            >
              <Title level={3} style={{ margin: 0 }}>
                {room.number}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {room.type?.name}
              </Text>
              <div style={{ marginTop: 8 }}>
                <Tag color={STATUS_COLORS[room.status] || "orange"}>
                  {statusLabel(room.status)}
                </Tag>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Pagination {...pagination} total={total} align="center" />
      </div>
    </>
  );

  const renderList = () => (
    <Card
      styles={{ body: { padding: isMobile ? 12 : 24 } }}
      style={{ borderRadius: 12 }}
    >
      <Table
        rowKey="id"
        columns={listColumns}
        dataSource={rooms}
        loading={false}
        pagination={{
          ...pagination,
          total,
          showSizeChanger: true,
          responsive: true,
        }}
        scroll={{ x: 520 }}
        locale={{ emptyText: t("housekeeping:emptyRooms") }}
        onRow={(record) => ({
          onClick: () => setSelectedRoom(record),
          style: { cursor: "pointer" },
        })}
      />
    </Card>
  );

  const showRoomBoard =
    !(isMobile && user?.role === "HOUSEKEEPER");

  return (
    <div style={{ padding: isMobile ? "16px" : "24px" }}>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? 16 : 0,
        }}
      >
        <div>
          <Title
            level={isMobile ? 3 : 2}
            style={{ margin: 0, fontSize: isMobile ? 22 : 28 }}
          >
            {t("housekeeping:title")}
          </Title>
          <Text type="secondary">{t("housekeeping:subtitle")}</Text>
        </div>
        <Space wrap style={{ width: isMobile ? "100%" : "auto" }}>
          <Input
            placeholder={t("housekeeping:searchRoom")}
            prefix={<SearchOutlined />}
            style={{ width: isMobile ? "100%" : 200 }}
            value={params.search}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            size={isMobile ? "middle" : "large"}
          />
          {showRoomBoard && (
            <Segmented
              block={isMobile}
              options={[
                {
                  label: t("housekeeping:view.grid"),
                  value: "Grid",
                  icon: <AppstoreOutlined />,
                },
                {
                  label: t("housekeeping:view.list"),
                  value: "List",
                  icon: <UnorderedListOutlined />,
                },
              ]}
              value={viewMode}
              onChange={(v) => setViewMode(v as "Grid" | "List")}
            />
          )}
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            size={isMobile ? "middle" : "large"}
          />
          {(user?.role === "MANAGER" || user?.role === "SUPER_ADMIN") && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsAssignModalOpen(true)}
              block={isMobile}
              size={isMobile ? "middle" : "large"}
            >
              {t("housekeeping:actions.assignTask")}
            </Button>
          )}
        </Space>
      </div>

      {isMobile && user?.role === "HOUSEKEEPER" ? (
        <MobileTaskList />
      ) : isLoading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 280,
          }}
        >
          <Spin size="large" tip={t("common:loading")} />
        </div>
      ) : rooms.length === 0 ? (
        <Empty description={t("housekeeping:emptyRooms")} />
      ) : viewMode === "Grid" ? (
        renderGrid()
      ) : (
        renderList()
      )}

      <RoomStatusDrawer
        room={selectedRoom}
        open={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
      />

      {isAssignModalOpen && (
        <AssignTaskModal
          visible={isAssignModalOpen}
          onCancel={() => setIsAssignModalOpen(false)}
        />
      )}
    </div>
  );
};
