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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roomApi, type RoomType } from "@/entities/room/api/room-api";
import { RoomTypeForm } from "@/widgets/room-type-form/ui/room-type-form";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

export const RoomTypesPage = () => {
  const { t } = useTranslation(["room-types", "common"]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<RoomType | null>(null);

  const queryClient = useQueryClient();

  const {
    data: types = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["room-types"],
    queryFn: roomApi.getAllRoomTypes,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roomApi.removeRoomType(id),
    onSuccess: () => {
      message.success(t("common:deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: ["room-types"] });
    },
    onError: () => {
      message.error(t("common:error"));
    },
  });

  const columns = [
    {
      title: t("room-types:typeName"),
      dataIndex: "name",
      key: "name",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: t("room-types:basePrice"),
      dataIndex: "basePrice",
      key: "price",
      render: (val: number) => (
        <Text>{new Intl.NumberFormat().format(val)} UZS</Text>
      ),
    },
    {
      title: t("room-types:amenities"),
      dataIndex: "amenities",
      key: "amenities",
      render: (amenities: string[]) => (
        <Space size={[0, 4]} wrap>
          {amenities?.map((a) => (
            <Tag key={a} color="blue">
              {t(`room-types:amenityOptions.${a}`)}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t("common:actions"),
      key: "actions",
      render: (record: RoomType) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedType(record);
              setIsFormOpen(true);
            }}
          />
          <Popconfirm
            title={t("common:deleteConfirm")}
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText={t("common:yes")}
            cancelText={t("common:no")}
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, fontSize: 24 }}>
            {t("room-types:roomTypesTitle")}
          </Title>
          <Text type="secondary">{t("room-types:roomTypesSubtitle")}</Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined spin={isFetching} />}
            onClick={() => refetch()}
          >
            {t("common:refresh")}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => {
              setSelectedType(null);
              setIsFormOpen(true);
            }}
          >
            {t("room-types:addRoomType")}
          </Button>
        </Space>
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
          columns={columns}
          dataSource={types}
          loading={isLoading}
          rowKey="id"
          pagination={{ pageSize: 12 }}
        />
      </Card>

      <RoomTypeForm
        open={isFormOpen}
        initialValues={selectedType}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedType(null);
        }}
      />
    </div>
  );
};
