import { useState } from "react";
import {
  Table,
  Space,
  Button,
  Typography,
  Card,
  Input,
  Tabs,
  Popconfirm,
  message,
  Avatar,
  Image,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { UtensilsCrossed, LayoutGrid } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restaurantApi } from "@/entities/restaurant";
import type {
  RestaurantMenuItem,
  RestaurantCategory,
} from "@/entities/restaurant";
import { MenuItemForm } from "@/widgets/restaurant/ui/menu-item-form";
import { CategoryForm } from "@/widgets/restaurant/ui/category-form";
import { useTranslation } from "react-i18next";
import { resolveImageUrl } from "@/shared/lib/utils/resolve-image-url";

const { Title, Text } = Typography;

export const MenuManagementPage = () => {
  const { t, i18n } = useTranslation(["common", "restaurant"]);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const [selectedItem, setSelectedItem] = useState<RestaurantMenuItem | null>(
    null,
  );
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState<RestaurantCategory | null>(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);

  const { data: menuData, isLoading: itemsLoading } = useQuery({
    queryKey: ["restaurant-menu-items", search],
    queryFn: () => restaurantApi.getMenuItems({ search, take: 50 }),
  });

  const items = menuData?.data || [];

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["restaurant-categories"],
    queryFn: restaurantApi.getCategories,
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => restaurantApi.deleteMenuItem(id),
    onSuccess: () => {
      message.success(t("common:success"));
      queryClient.invalidateQueries({ queryKey: ["restaurant-menu-items"] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => restaurantApi.deleteCategory(id),
    onSuccess: () => {
      message.success(t("common:success"));
      queryClient.invalidateQueries({ queryKey: ["restaurant-categories"] });
    },
  });

  const getLocalized = (obj: any) => {
    if (!obj) return "";
    return obj[i18n.language] || obj["en"] || Object.values(obj)[0] || "";
  };

  const filteredItems = items;

  const itemColumns = [
    {
      title: t("restaurant:menu.table.image"),
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 80,
      render: (url: string) =>
        url ? (
          <Image
            src={resolveImageUrl(url)}
            width={50}
            style={{ borderRadius: 4 }}
          />
        ) : (
          <Avatar
            icon={<UtensilsCrossed size={20} />}
            shape="square"
            size={50}
          />
        ),
    },
    {
      title: t("restaurant:menu.table.name"),
      key: "name",
      render: (record: RestaurantMenuItem) => (
        <Space direction="vertical" size={0}>
          <Text strong>{getLocalized(record.name)}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {getLocalized(record.description)}
          </Text>
        </Space>
      ),
    },
    {
      title: t("restaurant:menu.table.category"),
      key: "category",
      render: (record: RestaurantMenuItem) => (
        <Text>{getLocalized(record.category?.name)}</Text>
      ),
    },
    {
      title: t("restaurant:menu.table.price"),
      dataIndex: "price",
      key: "price",
      render: (price: number) => (
        <Text strong>
          {new Intl.NumberFormat().format(price)} {t("common:currency")}
        </Text>
      ),
    },
    {
      title: t("restaurant:menu.table.calories"),
      dataIndex: "calories",
      key: "calories",
      render: (cal: number) =>
        cal ? <Text>{cal} kcal</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: t("restaurant:menu.table.actions"),
      key: "actions",
      render: (record: RestaurantMenuItem) => (
        <Space>
          <Button
            icon={<EditOutlined style={{ fontSize: 14 }} />}
            onClick={() => {
              setSelectedItem(record);
              setIsItemFormOpen(true);
            }}
          />
          <Popconfirm
            title={t("restaurant:menu.table.confirmDelete")}
            onConfirm={() => deleteItemMutation.mutate(record.id)}
          >
            <Button
              icon={<DeleteOutlined style={{ fontSize: 14 }} />}
              danger
              type="text"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const categoryColumns = [
    {
      title: t("restaurant:menu.table.name"),
      key: "name",
      render: (record: RestaurantCategory) => (
        <Text strong>{getLocalized(record.name)}</Text>
      ),
    },
    {
      title: t("restaurant:menu.table.itemsCount"),
      key: "itemsCount",
      render: (record: RestaurantCategory) => record.items?.length || 0,
    },
    {
      title: t("restaurant:menu.table.actions"),
      key: "actions",
      render: (record: RestaurantCategory) => (
        <Space>
          <Button
            icon={<EditOutlined style={{ fontSize: 14 }} />}
            onClick={() => {
              setSelectedCategory(record);
              setIsCategoryFormOpen(true);
            }}
          />
          <Popconfirm
            title={t("restaurant:menu.table.confirmDelete")}
            onConfirm={() => deleteCategoryMutation.mutate(record.id)}
          >
            <Button
              icon={<DeleteOutlined style={{ fontSize: 14 }} />}
              danger
              type="text"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            {t("restaurant:menu.title")}
          </Title>
          <Text type="secondary">{t("restaurant:menu.subtitle")}</Text>
        </div>
      </div>

      <Tabs
        defaultActiveKey="items"
        items={[
          {
            key: "items",
            label: (
              <Space>
                <UtensilsCrossed size={18} /> {t("restaurant:menu.itemsTab")}
              </Space>
            ),
            children: (
              <>
                <Card style={{ marginBottom: 16 }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Input
                      placeholder={t("restaurant:menu.searchItems")}
                      prefix={<SearchOutlined />}
                      style={{ width: 300 }}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setSelectedItem(null);
                        setIsItemFormOpen(true);
                      }}
                    >
                      {t("restaurant:menu.addItem")}
                    </Button>
                  </div>
                </Card>
                <Table
                  dataSource={filteredItems}
                  columns={itemColumns}
                  loading={itemsLoading}
                  rowKey="id"
                  pagination={{ pageSize: 15 }}
                />
              </>
            ),
          },
          {
            key: "categories",
            label: (
              <Space>
                <LayoutGrid size={18} /> {t("restaurant:menu.categoriesTab")}
              </Space>
            ),
            children: (
              <>
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setSelectedCategory(null);
                        setIsCategoryFormOpen(true);
                      }}
                    >
                      {t("restaurant:menu.addCategory")}
                    </Button>
                  </div>
                </Card>
                <Table
                  dataSource={categories}
                  columns={categoryColumns}
                  loading={categoriesLoading}
                  rowKey="id"
                />
              </>
            ),
          },
        ]}
      />

      <MenuItemForm
        item={selectedItem}
        open={isItemFormOpen}
        onClose={() => setIsItemFormOpen(false)}
      />

      <CategoryForm
        category={selectedCategory}
        open={isCategoryFormOpen}
        onClose={() => setIsCategoryFormOpen(false)}
      />
    </div>
  );
};
