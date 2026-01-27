import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Typography,
  Row,
  Col,
  Card,
  Input,
  Select,
  Space,
  Button,
  Segmented,
  Spin,
  Empty,
  Grid,
} from "antd";
import {
  SearchOutlined,
  AppstoreOutlined,
  TableOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { roomApi, type RoomDashboardItem } from "@/entities/room/api/room-api";
import { RoomCard } from "@/features/room-management/ui/room-card";
import { RoomSidePanel } from "@/widgets/room-side-panel/ui/side-panel";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

export const RoomsPage = () => {
  const { t } = useTranslation(["rooms", "common"]);
  const [viewType, setViewType] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [floorFilter, setFloorFilter] = useState<number | "all">("all");
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const [selectedRoom, setSelectedRoom] = useState<RoomDashboardItem | null>(
    null,
  );

  const {
    data: rooms = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["rooms-dashboard"],
    queryFn: roomApi.getDashboard,
    refetchInterval: 30000, // Refresh every 30s
  });

  const filteredRooms = useMemo(() => {
    return rooms.filter((room: RoomDashboardItem) => {
      const matchesSearch =
        room.number.toLowerCase().includes(search.toLowerCase()) ||
        room.bookings[0]?.guest?.firstName
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "OCCUPIED"
          ? room.bookings.length > 0
          : room.status === statusFilter);

      const matchesFloor = floorFilter === "all" || room.floor === floorFilter;

      return matchesSearch && matchesStatus && matchesFloor;
    });
  }, [rooms, search, statusFilter, floorFilter]);

  if (isLoading) {
    return (
      <div
        style={{
          height: "60vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" tip={t("common:loading")} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Top Header & Filters */}
      <div
        style={{
          marginBottom: 24,
          background: "#fff",
          padding: isMobile ? "16px" : "24px",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            gap: isMobile ? 16 : 0,
            marginBottom: 20,
          }}
        >
          <div>
            <Title
              level={isMobile ? 3 : 2}
              style={{
                margin: 0,
                fontSize: isMobile ? 20 : 24,
                fontWeight: 700,
              }}
            >
              {t("rooms:title")}
            </Title>
            <Text type="secondary">{t("rooms:subtitle")}</Text>
          </div>
          <Space size="middle" style={{ width: isMobile ? "100%" : "auto" }}>
            <Button
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={() => refetch()}
              block={isMobile}
            >
              {t("rooms:refresh")}
            </Button>
            {!isMobile && (
              <Segmented
                options={[
                  { label: "Grid", value: "grid", icon: <AppstoreOutlined /> },
                  { label: "Table", value: "table", icon: <TableOutlined /> },
                ]}
                value={viewType}
                onChange={(v) => setViewType(v as any)}
              />
            )}
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              placeholder={t("rooms:searchPlaceholder")}
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="large"
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              style={{ width: "100%" }}
              defaultValue="all"
              size="large"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: t("rooms:allStatuses") },
                { value: "OCCUPIED", label: t("rooms:occupied") },
                { value: "CLEAN", label: t("rooms:clean") },
                { value: "DIRTY", label: t("rooms:dirty") },
                { value: "MAINTENANCE", label: t("rooms:outOfService") },
              ]}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              style={{ width: "100%" }}
              defaultValue="all"
              size="large"
              value={floorFilter}
              onChange={setFloorFilter}
              options={[
                { value: "all", label: t("rooms:allFloors") },
                { value: 1, label: `${t("rooms:floor")} 1` },
                { value: 2, label: `${t("rooms:floor")} 2` },
                { value: 3, label: `${t("rooms:floor")} 3` },
                { value: 4, label: `${t("rooms:floor")} 4` },
              ]}
            />
          </Col>
        </Row>
      </div>

      {/* Main Content View */}
      {viewType === "grid" ? (
        filteredRooms.length > 0 ? (
          <Row gutter={[20, 20]}>
            {filteredRooms.map((room: RoomDashboardItem) => (
              <Col xs={24} sm={12} md={8} lg={6} xl={4.8} key={room.id}>
                <RoomCard room={room} onClick={setSelectedRoom} />
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description={t("common:error")} style={{ marginTop: 60 }} />
        )
      ) : (
        <Card
          bodyStyle={{ padding: 0 }}
          style={{ borderRadius: 12, overflow: "hidden" }}
        >
          {/* Table view could be implemented here as a secondary view */}
          <div style={{ padding: 40, textAlign: "center" }}>
            <TableOutlined
              style={{ fontSize: 48, color: "#d9d9d9", marginBottom: 16 }}
            />
            <Title level={5}>Table View is under development</Title>
            <Text type="secondary">
              Please use the Grid View for operational management.
            </Text>
          </div>
        </Card>
      )}

      {/* Side Panel Overlay */}
      <RoomSidePanel
        room={selectedRoom}
        onClose={() => setSelectedRoom(null)}
      />
    </div>
  );
};
