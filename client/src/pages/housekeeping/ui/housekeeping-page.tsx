import { useState } from "react";
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
import { roomApi } from "@/entities/room/api/room-api";
import { useTranslation } from "react-i18next";
import { RoomStatusDrawer } from "@/widgets/housekeeping/ui/room-status-drawer";
import { MobileTaskList } from "@/widgets/housekeeping/ui/mobile-task-list";
import { AssignTaskModal } from "@/widgets/housekeeping/ui/assign-task-modal";
import { useAuthStore } from "@/entities/user/model/auth-store";
import { usePaginationSearchParams } from "@/shared/hooks/use-pagination-search-params";

const { Title, Text } = Typography;

export const HousekeepingPage = () => {
  const { t } = useTranslation(["housekeeping", "common", "rooms"]);
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<"Grid" | "List">("Grid");
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const { params, handleSearch, pagination, apiParams } =
    usePaginationSearchParams(24); // Larger page size for grid

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

  const statusColors: Record<string, string> = {
    [RoomStatus.CLEAN]: "#52c41a", // Green
    [RoomStatus.DIRTY]: "#ff4d4f", // Red
    [RoomStatus.INSPECTED]: "#1890ff", // Blue
    [RoomStatus.MAINTENANCE]: "#8c8c8c", // Gray
  };

  const renderGrid = () => {
    if (isLoading) {
      return (
        <div style={{ textAlign: "center", padding: "50px" }}>Loading...</div>
      );
    }

    return (
      <>
        <Row gutter={[16, 16]}>
          {rooms.map((room: any) => (
            <Col xs={12} sm={8} md={6} lg={4} key={room.id}>
              <Card
                hoverable
                onClick={() => setSelectedRoom(room)}
                styles={{ body: { padding: 12 } }}
                style={{
                  borderTop: `4px solid ${statusColors[room.status] || "orange"}`,
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
                  <Tag color={statusColors[room.status] || "orange"}>
                    {room.status}
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
  };

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
            placeholder="Search room..."
            prefix={<SearchOutlined />}
            style={{ width: isMobile ? "100%" : 200 }}
            value={params.search}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            size={isMobile ? "middle" : "large"}
          />
          {!isMobile && (
            <Segmented
              options={[
                { label: "Grid", value: "Grid", icon: <AppstoreOutlined /> },
                {
                  label: "List",
                  value: "List",
                  icon: <UnorderedListOutlined />,
                },
              ]}
              value={viewMode}
              onChange={setViewMode}
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

      {/* Mobile Task View for Housekeepers */}
      {isMobile && user?.role === "HOUSEKEEPER" ? (
        <MobileTaskList />
      ) : (
        <>
          {viewMode === "Grid" ? (
            renderGrid()
          ) : (
            <div>Table View Placeholder</div>
          )}
        </>
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
