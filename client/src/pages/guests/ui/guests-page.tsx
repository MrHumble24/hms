import { useState } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Input,
  Typography,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Grid,
  List,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SwapOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { guestApi, type Guest } from "@/entities/guest/api/guest-api";
import { useAuthStore } from "@/entities/user/model/auth-store";
import { useTenantStore } from "@/entities/tenant/model/tenant-store";
import { GuestForm } from "@/widgets/guest-form/ui/guest-form";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { usePaginationSearchParams } from "@/shared/hooks/use-pagination-search-params";

const { Title, Text } = Typography;

export const GuestsPage = () => {
  const { t } = useTranslation(["guests", "common"]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  useAuthStore();
  const { activeBranchId } = useTenantStore();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const queryClient = useQueryClient();
  const { params, handleSearch, pagination, apiParams } =
    usePaginationSearchParams();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["guests", apiParams],
    queryFn: () => guestApi.getAll(apiParams),
  });

  const guests = data?.data || [];
  const total = data?.total || 0;

  const pullMutation = useMutation({
    mutationFn: (id: string) => guestApi.pullToBranch(id),
    onSuccess: () => {
      message.success("Guest record restored to this branch!");
      queryClient.invalidateQueries({ queryKey: ["guests"] });
    },
    onError: () => message.error("Failed to restore record."),
  });

  // Client-side filtering removed in favor of server-side
  const filteredGuests = guests;

  const columns = [
    {
      title: t("guests:fullName"),
      key: "name",
      render: (record: Guest) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            {record.lastName} {record.firstName}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.patronymic}
          </Text>
        </Space>
      ),
    },
    {
      title: t("guests:passport"),
      key: "passport",
      render: (record: Guest) => (
        <Space direction="vertical" size={0}>
          <Text>
            {record.passportSeries} {record.passportNumber}
          </Text>
          <Tag color="cyan">{record.citizenship}</Tag>
        </Space>
      ),
    },
    {
      title: t("guests:contact"),
      key: "contact",
      render: (record: Guest) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13 }}>{record.phone}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.email}
          </Text>
        </Space>
      ),
    },
    {
      title: t("guests:dateOfBirth"),
      dataIndex: "dateOfBirth",
      key: "dob",
      render: (val: string) => dayjs(val).format("DD.MM.YYYY"),
    },
    {
      title: "Branch",
      key: "branch",
      render: (record: any) => {
        const isCurrentBranch = record.branchId === activeBranchId;
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 13 }}>
              {isCurrentBranch ? (
                <Tag icon={<HomeOutlined />} color="green">
                  {record.branch?.name || "Local"}
                </Tag>
              ) : (
                <Tag color="orange">{record.branch?.name || "Other"}</Tag>
              )}
            </Text>
          </Space>
        );
      },
    },
  ];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => guestApi.remove(id),
    onSuccess: () => {
      message.success(t("guests:deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: ["guests"] });
    },
  });

  const renderActions = (record: any) => {
    const isCurrentBranch = record.branchId === activeBranchId;

    return (
      <Space size="middle">
        {!isCurrentBranch && (
          <Popconfirm
            title="This guest is in another branch. Restore to current branch?"
            onConfirm={() => pullMutation.mutate(record.id)}
            okText="Restore"
          >
            <Button
              type="primary"
              ghost
              size="small"
              icon={<SwapOutlined />}
              title="Pull to current branch"
              loading={pullMutation.isPending}
            >
              Adopt
            </Button>
          </Popconfirm>
        )}
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => {
            setSelectedGuest(record);
            setIsFormOpen(true);
          }}
        />
        <Popconfirm
          title={t("guests:deleteConfirm")}
          onConfirm={() => deleteMutation.mutate(record.id)}
          okText={t("common:yes")}
          cancelText={t("common:no")}
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    );
  };

  const updatedColumns = [
    ...columns.slice(0, -1),
    {
      title: t("common:actions"),
      key: "actions",
      render: (record: Guest) => renderActions(record),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          background: "#fff",
          padding: isMobile ? "16px" : "24px",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
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
              style={{ margin: 0, fontSize: isMobile ? 20 : 24 }}
            >
              {t("guests:title")}
            </Title>
            <Text type="secondary">{t("guests:subtitle")}</Text>
          </div>
          <Space wrap style={{ width: isMobile ? "100%" : "auto" }}>
            <Button
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={() => refetch()}
              block={isMobile}
            >
              {t("guests:refresh")}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => {
                setSelectedGuest(null);
                setIsFormOpen(true);
              }}
              block={isMobile}
            >
              {t("guests:addNewGuest")}
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Input
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              placeholder={t("guests:searchPlaceholder")}
              allowClear
              value={params.search}
              onChange={(e) => handleSearch(e.target.value)}
              size="large"
            />
          </Col>
        </Row>
      </div>

      <Card
        bodyStyle={{ padding: 0 }}
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          margin: isMobile ? "0 16px" : 0,
        }}
      >
        {!isMobile ? (
          <Table
            columns={updatedColumns}
            dataSource={filteredGuests}
            loading={isLoading}
            rowKey="id"
            pagination={{ ...pagination, total }}
          />
        ) : (
          <List
            dataSource={filteredGuests}
            loading={isLoading}
            pagination={{ ...pagination, total, align: "center" }}
            renderItem={(guest: Guest) => (
              <List.Item>
                <Card
                  style={{ width: "100%", margin: "0 8px" }}
                  bodyStyle={{ padding: 16 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <Text strong style={{ fontSize: 16 }}>
                        {guest.lastName} {guest.firstName}
                      </Text>
                      {guest.patronymic && (
                        <div style={{ fontSize: 12, color: "#888" }}>
                          {guest.patronymic}
                        </div>
                      )}
                    </div>
                    <Tag color={guest.gender === "MALE" ? "blue" : "magenta"}>
                      {t(`guests:${guest.gender.toLowerCase()}`)}
                    </Tag>
                  </div>

                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size={4}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Passport:
                      </Text>
                      <Space>
                        <Text style={{ fontSize: 12 }}>
                          {guest.passportSeries} {guest.passportNumber}
                        </Text>
                        <Tag color="cyan" style={{ margin: 0, fontSize: 10 }}>
                          {guest.citizenship}
                        </Tag>
                      </Space>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Phone:
                      </Text>
                      <Text style={{ fontSize: 12 }}>{guest.phone}</Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Email:
                      </Text>
                      <Text style={{ fontSize: 12 }}>{guest.email || "-"}</Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        DOB:
                      </Text>
                      <Text style={{ fontSize: 12 }}>
                        {dayjs(guest.dateOfBirth).format("DD.MM.YYYY")}
                      </Text>
                    </div>
                  </Space>

                  <div
                    style={{
                      marginTop: 16,
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    {renderActions(guest)}
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>

      <GuestForm
        open={isFormOpen}
        initialValues={selectedGuest}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedGuest(null);
        }}
      />
    </div>
  );
};
