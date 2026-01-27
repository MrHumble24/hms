import { useState } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Card,
  Input,
  Select,
  Row,
  Col,
  Tooltip,
  Badge,
  Popconfirm,
  message,
  Grid,
  List,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  inventoryApi,
  type InventoryItem,
  type InventoryCategory,
} from "@/entities/inventory/api/inventory-api";
import { StockUpdateDrawer } from "@/widgets/inventory/ui/stock-update-drawer";
import { InventoryForm } from "@/widgets/inventory/ui/inventory-form";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/entities/user/model/auth-store";
import { usePaginationSearchParams } from "@/shared/hooks/use-pagination-search-params";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

export const InventoryPage = () => {
  const { t } = useTranslation(["inventory", "common"]);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const { params, handleSearch, setParam, pagination, apiParams } =
    usePaginationSearchParams();

  // State for Stock Update Drawer
  const [selectedItemForStock, setSelectedItemForStock] =
    useState<InventoryItem | null>(null);
  const [isStockUpdateOpen, setIsStockUpdateOpen] = useState(false);

  // State for Inventory Form Drawer (Create/Edit)
  const [selectedItemForEdit, setSelectedItemForEdit] =
    useState<InventoryItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["inventory", apiParams],
    queryFn: () => inventoryApi.findAll(apiParams),
  });

  const items = data?.data || [];
  const total = data?.total || 0;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.remove(id),
    onSuccess: () => {
      message.success(t("common:success"));
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || t("common:error"));
    },
  });

  // Client-side filtering removed for search and category
  // Stock filter remains client-only for now unless further refactored
  const filteredItems = items;

  const canManage = user?.role === "SUPER_ADMIN" || user?.role === "MANAGER";
  const canDelete = user?.role === "SUPER_ADMIN";

  const columns = [
    {
      title: t("inventory:columns.itemName"),
      key: "name",
      render: (record: InventoryItem) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            SKU: {record.sku}
          </Text>
        </Space>
      ),
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: t("inventory:columns.category"),
      render: (record: InventoryItem) => (
        <Tag>{t(`inventory:categories.${record.category}`)}</Tag>
      ),
    },
    {
      title: t("inventory:columns.currentStock"),
      key: "stock",
      align: "right" as const,
      render: (record: InventoryItem) => {
        let statusColor = "#52c41a"; // Normal
        if (record.quantity === 0)
          statusColor = "#ff4d4f"; // Out
        else if (record.quantity <= record.minThreshold)
          statusColor = "#fa8c16"; // Low

        return (
          <Tooltip
            title={`${record.quantity} / ${record.minThreshold} (Threshold)`}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <Title level={4} style={{ margin: 0, color: statusColor }}>
                {record.quantity}
              </Title>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {record.unit}
              </Text>
            </div>
          </Tooltip>
        );
      },
      sorter: (a: any, b: any) => a.quantity - b.quantity,
    },
    {
      title: t("inventory:columns.lastUpdated"),
      key: "audit",
      render: (record: InventoryItem) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>
            {dayjs(record.updatedAt).format("DD MMM, HH:mm")}
          </Text>
          {record.lastUpdatedBy && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.lastUpdatedBy.fullName} (
              {record.lastUpdatedBy.role.toLowerCase()})
            </Text>
          )}
        </Space>
      ),
    },
  ];

  const renderActions = (record: InventoryItem) => (
    <Space wrap>
      <Button
        type="primary"
        ghost
        icon={<ReloadOutlined />}
        onClick={() => {
          setSelectedItemForStock(record);
          setIsStockUpdateOpen(true);
        }}
        size={isMobile ? "small" : "middle"}
      >
        {t("inventory:actions.updateStock")}
      </Button>

      {canManage && (
        <Button
          icon={<EditOutlined />}
          size={isMobile ? "small" : "middle"}
          onClick={() => {
            setSelectedItemForEdit(record);
            setIsFormOpen(true);
          }}
        />
      )}

      {canDelete && (
        <Popconfirm
          title={t("common:areYouSure")}
          onConfirm={() => deleteMutation.mutate(record.id)}
          okText={t("common:yes")}
          cancelText={t("common:no")}
          okButtonProps={{
            danger: true,
            loading: deleteMutation.isPending,
          }}
        >
          <Button
            icon={<DeleteOutlined />}
            danger
            type="text"
            size={isMobile ? "small" : "middle"}
          />
        </Popconfirm>
      )}
    </Space>
  );

  const updatedColumns = [
    ...columns.slice(0, -1),
    {
      title: t("inventory:columns.actions"),
      key: "actions",
      render: (record: InventoryItem) => renderActions(record),
    },
  ];

  const categories: InventoryCategory[] = [
    "MINIBAR",
    "HOUSEKEEPING",
    "MAINTENANCE",
    "KITCHEN",
    "OTHER",
  ];

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
            {t("inventory:title")}
          </Title>
          <Text type="secondary">{t("inventory:subtitle")}</Text>
        </div>
        <Space size="middle" wrap style={{ width: isMobile ? "100%" : "auto" }}>
          <Badge
            count={items.filter((i) => i.quantity <= i.minThreshold).length}
            offset={[-2, 2]}
            style={{ width: isMobile ? "100%" : "auto" }}
          >
            <Button
              icon={<ExclamationCircleOutlined />}
              onClick={() => {}}
              block={isMobile}
              disabled
            >
              {t("inventory:filters.lowStock")}
            </Button>
          </Badge>

          {canManage && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedItemForEdit(null);
                setIsFormOpen(true);
              }}
              block={isMobile}
              size={isMobile ? "middle" : "large"}
            >
              {t("inventory:actions.addNewItem")}
            </Button>
          )}
        </Space>
      </div>

      <Card
        style={{ marginBottom: 24, borderRadius: 12 }}
        bodyStyle={{ padding: isMobile ? 16 : 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              placeholder={t("inventory:searchPlaceholder")}
              size="large"
              value={params.search}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              size="large"
              style={{ width: "100%" }}
              placeholder={t("inventory:filters.allCategories")}
              value={params.category || "ALL"}
              onChange={(v) => setParam("category", v)}
            >
              <Option value="ALL">
                {t("inventory:filters.allCategories")}
              </Option>
              {categories.map((c) => (
                <Option key={c} value={c}>
                  {t(`inventory:categories.${c}`)}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={6}>
            <Select
              size="large"
              style={{ width: "100%" }}
              placeholder={t("inventory:filters.allStock")}
              value="ALL"
              disabled
            >
              <Option value="ALL">{t("inventory:filters.allStock")}</Option>
            </Select>
          </Col>
          <Col
            xs={12}
            sm={6}
            md={4}
            style={{
              display: "flex",
              justifyContent: isMobile ? "flex-start" : "flex-end",
            }}
          >
            <Button
              icon={<ReloadOutlined spin={isFetching} />}
              size="large"
              onClick={() => refetch()}
              block={isMobile}
            >
              {t("common:refresh")}
            </Button>
          </Col>
        </Row>
      </Card>

      <Card
        styles={{ body: { padding: 0 } }}
        style={{ borderRadius: 12, overflow: "hidden" }}
      >
        {!isMobile ? (
          <Table
            dataSource={filteredItems}
            columns={updatedColumns}
            loading={isLoading}
            rowKey="id"
            pagination={{ ...pagination, total }}
            className="dense-table"
          />
        ) : (
          <List
            dataSource={filteredItems}
            loading={isLoading}
            pagination={{ ...pagination, total, align: "center" }}
            renderItem={(item: InventoryItem) => {
              let statusColor = "#52c41a";
              if (item.quantity === 0) statusColor = "#ff4d4f";
              else if (item.quantity <= item.minThreshold)
                statusColor = "#fa8c16";

              return (
                <List.Item>
                  <Card
                    style={{ width: "100%", margin: "0 8px" }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <Text strong style={{ fontSize: 16 }}>
                          {item.name}
                        </Text>
                        <div style={{ fontSize: 12, color: "#888" }}>
                          SKU: {item.sku}
                        </div>
                      </div>
                      <Tag>{t(`inventory:categories.${item.category}`)}</Tag>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16,
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Stock Level
                        </Text>
                        <Space align="baseline">
                          <Text
                            style={{
                              fontSize: 20,
                              fontWeight: 700,
                              color: statusColor,
                            }}
                          >
                            {item.quantity}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.unit}
                          </Text>
                        </Space>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Last Updated
                        </Text>
                        <div>
                          {dayjs(item.updatedAt).format("DD MMM, HH:mm")}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12 }}
                    >
                      {renderActions(item)}
                    </div>
                  </Card>
                </List.Item>
              );
            }}
          />
        )}
      </Card>

      <StockUpdateDrawer
        item={selectedItemForStock}
        open={isStockUpdateOpen}
        onClose={() => {
          setIsStockUpdateOpen(false);
          setSelectedItemForStock(null);
        }}
      />

      <InventoryForm
        item={selectedItemForEdit}
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedItemForEdit(null);
        }}
      />
    </div>
  );
};
