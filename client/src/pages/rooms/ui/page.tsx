import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
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
  Table,
  Tag,
  Tooltip,
  type TableColumnsType,
} from "antd";
import {
  SearchOutlined,
  AppstoreOutlined,
  TableOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  AlertOutlined,
} from "@ant-design/icons";
import { roomApi, type RoomDashboardItem } from "@/entities/room/api/room-api";
import { RoomCard } from "@/features/room-management/ui/room-card";
import { RoomSidePanel } from "@/widgets/room-side-panel/ui/side-panel";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

/** Batch size per request (server caps at 100). */
const DASHBOARD_PAGE_SIZE = 24;

function getDashboardRoomPresentation(room: RoomDashboardItem): {
  statusColor: string;
  statusCode: string;
} {
  const activeBooking = room.bookings?.[0];
  const maintenanceTicket = room.maintenance?.[0];

  if (maintenanceTicket || room.status === "MAINTENANCE") {
    return { statusColor: "#ff4d4f", statusCode: "MAINTENANCE" };
  }
  if (room.status === "DIRTY") {
    return { statusColor: "#faad14", statusCode: "DIRTY" };
  }
  if (activeBooking) {
    return { statusColor: "#1677ff", statusCode: "OCCUPIED" };
  }
  const color =
    room.status === "CLEAN"
      ? "#52c41a"
      : room.status === "INSPECTED"
        ? "#1890ff"
        : "#8c8c8c";
  return { statusColor: color, statusCode: room.status };
}

function formatDashboardStatusLabel(
  statusCode: string,
  t: (key: string) => string,
): string {
  switch (statusCode) {
    case "OCCUPIED":
      return t("rooms:occupied");
    case "CLEAN":
      return t("rooms:clean");
    case "DIRTY":
      return t("rooms:dirty");
    case "MAINTENANCE":
      return t("rooms:outOfService");
    case "INSPECTED":
      return t("rooms:inspected");
    default:
      return statusCode;
  }
}

function parseDashboardSearchParams(sp: URLSearchParams) {
  const search = sp.get("search") ?? "";
  const statusFilter = sp.get("status") ?? "all";
  const floorRaw = sp.get("floor");
  const floorFilter =
    floorRaw === null || floorRaw === "" || floorRaw === "all"
      ? ("all" as const)
      : (() => {
          const n = parseInt(floorRaw, 10);
          return Number.isFinite(n) ? n : ("all" as const);
        })();

  const viewType = sp.get("view") === "table" ? "table" : "grid";

  return {
    search,
    statusFilter,
    floorFilter,
    viewType,
  };
}

/** Drop default query keys so URLs stay short. */
function normalizeDashboardParams(p: URLSearchParams) {
  const n = new URLSearchParams(p);
  if (!n.get("search")?.trim()) n.delete("search");
  if (!n.get("status") || n.get("status") === "all") n.delete("status");
  if (!n.get("floor") || n.get("floor") === "all") n.delete("floor");
  if (n.get("view") !== "table") n.delete("view");
  return n;
}

export const RoomsPage = () => {
  const { t } = useTranslation(["rooms", "common"]);
  const [searchParams, setSearchParams] = useSearchParams();

  const { search, statusFilter, floorFilter, viewType } = useMemo(
    () => parseDashboardSearchParams(searchParams),
    [searchParams],
  );

  const setDashboardParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      setSearchParams(normalizeDashboardParams(next), { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const [searchDraft, setSearchDraft] = useState(search);
  useEffect(() => {
    setSearchDraft(search);
  }, [search]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const trimmed = searchDraft.trim();
      const fromUrl = (searchParams.get("search") ?? "").trim();
      if (trimmed === fromUrl) return;
      setDashboardParams((p) => {
        if (trimmed) p.set("search", trimmed);
        else p.delete("search");
      });
    }, 350);
    return () => window.clearTimeout(id);
  }, [searchDraft, searchParams, setDashboardParams]);

  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const [selectedRoom, setSelectedRoom] = useState<RoomDashboardItem | null>(
    null,
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isPending,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      "rooms-dashboard",
      DASHBOARD_PAGE_SIZE,
      search,
      statusFilter,
      floorFilter,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      roomApi.getDashboard({
        page: pageParam,
        limit: DASHBOARD_PAGE_SIZE,
        search,
        status: statusFilter,
        floor: floorFilter,
      }),
    getNextPageParam: (lastPage) => {
      const loaded =
        (lastPage.page - 1) * lastPage.limit + lastPage.data.length;
      if (loaded >= lastPage.total) return undefined;
      return lastPage.page + 1;
    },
    refetchInterval: 30000,
  });

  const rooms = useMemo(() => {
    const pages = data?.pages ?? [];
    const seen = new Set<string>();
    const out: RoomDashboardItem[] = [];
    for (const page of pages) {
      for (const room of page.data) {
        if (!seen.has(room.id)) {
          seen.add(room.id);
          out.push(room);
        }
      }
    }
    return out;
  }, [data?.pages]);

  const total = data?.pages[0]?.total ?? 0;

  const tableColumns: TableColumnsType<RoomDashboardItem> = useMemo(
    () => [
      {
        title: t("rooms:table.room"),
        dataIndex: "number",
        key: "number",
        width: 100,
        fixed: "left",
        sorter: (a, b) =>
          String(a.number).localeCompare(String(b.number), undefined, {
            numeric: true,
          }),
      },
      {
        title: t("rooms:table.floor"),
        dataIndex: "floor",
        key: "floor",
        width: 88,
        sorter: (a, b) => a.floor - b.floor,
      },
      {
        title: t("rooms:table.type"),
        key: "type",
        ellipsis: true,
        render: (_, room) => room.type?.name ?? "—",
      },
      {
        title: t("rooms:table.status"),
        key: "status",
        width: 160,
        render: (_, room) => {
          const { statusColor, statusCode } =
            getDashboardRoomPresentation(room);
          return (
            <Tag color={statusColor} style={{ margin: 0, borderRadius: 4 }}>
              {formatDashboardStatusLabel(statusCode, t)}
            </Tag>
          );
        },
      },
      {
        title: t("rooms:table.guest"),
        key: "guest",
        ellipsis: true,
        render: (_, room) => {
          const g = room.bookings?.[0]?.guest;
          if (!g) {
            return (
              <Text type="secondary" italic>
                {t("rooms:unoccupied")}
              </Text>
            );
          }
          return (
            <Text>
              {g.firstName} {g.lastName}
            </Text>
          );
        },
      },
      {
        title: t("rooms:table.alerts"),
        key: "alerts",
        width: 108,
        render: (_, room) => {
          const hasTask = Boolean(room.tasks?.[0]);
          const hasMaint = Boolean(room.maintenance?.[0]);
          if (!hasTask && !hasMaint) {
            return <Text type="secondary">—</Text>;
          }
          return (
            <Space size="small">
              {hasTask ? (
                <Tooltip title={t("rooms:table.hkTask")}>
                  <ClockCircleOutlined
                    style={{ color: "#faad14", fontSize: 16 }}
                  />
                </Tooltip>
              ) : null}
              {hasMaint ? (
                <Tooltip title={t("rooms:table.maintenance")}>
                  <AlertOutlined style={{ color: "#ff4d4f", fontSize: 16 }} />
                </Tooltip>
              ) : null}
            </Space>
          );
        },
      },
    ],
    [t],
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries[0]?.isIntersecting;
        if (hit && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { root: null, rootMargin: "240px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [
    viewType,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  if (isPending) {
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
              icon={<ReloadOutlined spin={isFetching && !isFetchingNextPage} />}
              onClick={() => refetch()}
              block={isMobile}
            >
              {t("rooms:refresh")}
            </Button>
            <Segmented
              block={isMobile}
              options={[
                {
                  label: t("rooms:viewGrid"),
                  value: "grid",
                  icon: <AppstoreOutlined />,
                },
                {
                  label: t("rooms:viewTable"),
                  value: "table",
                  icon: <TableOutlined />,
                },
              ]}
              value={viewType}
              onChange={(v) => {
                const next = v as "grid" | "table";
                setDashboardParams((p) => {
                  if (next === "table") p.set("view", "table");
                  else p.delete("view");
                });
              }}
            />
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              placeholder={t("rooms:searchPlaceholder")}
              allowClear
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              size="large"
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              style={{ width: "100%" }}
              size="large"
              value={statusFilter}
              onChange={(v) => {
                setDashboardParams((p) => {
                  if (v === "all") p.delete("status");
                  else p.set("status", v);
                });
              }}
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
              size="large"
              value={floorFilter}
              onChange={(v) => {
                setDashboardParams((p) => {
                  if (v === "all") p.delete("floor");
                  else p.set("floor", String(v));
                });
              }}
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
      {rooms.length === 0 ? (
        <Empty
          description={t("rooms:noRoomsMatch")}
          style={{ marginTop: 60 }}
        />
      ) : viewType === "grid" ? (
        <>
          <Row gutter={[20, 20]}>
            {rooms.map((room: RoomDashboardItem) => (
              <Col xs={24} sm={12} md={8} lg={6} xl={4.8} key={room.id}>
                <RoomCard room={room} onClick={setSelectedRoom} />
              </Col>
            ))}
          </Row>
          <div
            ref={loadMoreRef}
            style={{
              marginTop: 24,
              minHeight: 48,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isFetchingNextPage ? (
              <Spin size="small" tip={t("rooms:loadingMore")} />
            ) : null}
            {total > 0 ? (
              <Text type="secondary" style={{ fontSize: 13 }}>
                {t("rooms:loadedOfTotal", {
                  loaded: rooms.length,
                  total,
                })}
              </Text>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <Card
            styles={{ body: { padding: isMobile ? 0 : 12 } }}
            style={{ borderRadius: 12, overflow: "hidden" }}
          >
            <Table<RoomDashboardItem>
              rowKey="id"
              columns={tableColumns}
              dataSource={rooms}
              pagination={false}
              size={isMobile ? "small" : "middle"}
              scroll={{ x: 920 }}
              locale={{ emptyText: t("rooms:noRoomsMatch") }}
              onRow={(record) => ({
                onClick: () => setSelectedRoom(record),
                style: { cursor: "pointer" },
              })}
            />
          </Card>
          <div
            ref={loadMoreRef}
            style={{
              marginTop: 24,
              minHeight: 48,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isFetchingNextPage ? (
              <Spin size="small" tip={t("rooms:loadingMore")} />
            ) : null}
            {total > 0 ? (
              <Text type="secondary" style={{ fontSize: 13 }}>
                {t("rooms:loadedOfTotal", {
                  loaded: rooms.length,
                  total,
                })}
              </Text>
            ) : null}
          </div>
        </>
      )}

      {/* Side Panel Overlay */}
      <RoomSidePanel
        room={selectedRoom}
        onClose={() => setSelectedRoom(null)}
      />
    </div>
  );
};
