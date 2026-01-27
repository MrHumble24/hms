import { useState, useMemo } from "react";
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
  message,
  Badge,
  Popconfirm,
  Grid,
  List,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  companiesApi,
  type Company,
} from "@/entities/companies/api/companies-api";
import { CompanyForm } from "@/widgets/companies/ui/company-form";
import { CompanyDetails } from "@/widgets/companies/ui/company-details";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/entities/user/model/auth-store";

const { Title, Text } = Typography;
const { Option } = Select;

export const CompaniesPage = () => {
  const { t } = useTranslation(["companies", "common"]);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  // State for View Details
  const [detailsId, setDetailsId] = useState<string | null>(null);

  // State for Form Drawer
  const [selectedItem, setSelectedItem] = useState<Company | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    data: companies = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["companies"],
    queryFn: companiesApi.findAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companiesApi.remove(id),
    onSuccess: () => {
      message.success(t("common:deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || t("common:error"));
    },
  });

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.taxId.includes(search) ||
        c.contactPerson?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? c.isActive : !c.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [companies, search, statusFilter]);

  const canManage =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "MANAGER" ||
    user?.role === "ACCOUNTANT";

  const columns = [
    {
      title: t("companies:columns.companyName"),
      key: "name",
      render: (record: Company) => (
        <Space>
          <BankOutlined style={{ color: "#8c8c8c" }} />
          <Space direction="vertical" size={0}>
            <Text strong>{record.name}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              INN: {record.taxId}
            </Text>
          </Space>
        </Space>
      ),
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: t("companies:columns.contact"),
      key: "contact",
      render: (record: Company) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13 }}>{record.contactPerson || "-"}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.phone || record.email}
          </Text>
        </Space>
      ),
    },
    {
      title: t("companies:columns.activeDiscount"),
      key: "discount",
      align: "right" as const,
      render: (record: Company) => {
        const activeContract = record.contracts?.[0];
        return activeContract ? (
          <Tag color="blue" style={{ fontWeight: "bold" }}>
            {activeContract.discountPercent}%
          </Tag>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
      sorter: (a: any, b: any) =>
        (a.contracts?.[0]?.discountPercent || 0) -
        (b.contracts?.[0]?.discountPercent || 0),
    },
    {
      title: t("companies:columns.bookings"),
      key: "bookings",
      align: "center" as const,
      render: (record: Company) => (
        <Badge count={record._count?.bookings} showZero color="#108ee9" />
      ),
      sorter: (a: any, b: any) =>
        (a._count?.bookings || 0) - (b._count?.bookings || 0),
    },
    {
      title: t("companies:columns.status"),
      dataIndex: "isActive",
      key: "status",
      render: (active: boolean) => (
        <Tag color={active ? "success" : "default"}>
          {active ? "Active" : "Inactive"}
        </Tag>
      ),
    },
  ];

  const renderActions = (record: Company) => (
    <Space wrap>
      <Button
        icon={<EyeOutlined />}
        onClick={() => setDetailsId(record.id)}
        block={isMobile}
      >
        {isMobile ? "" : t("common:view")}
      </Button>

      {canManage && (
        <Button
          icon={<EditOutlined />}
          onClick={() => {
            setSelectedItem(record);
            setIsFormOpen(true);
          }}
        />
      )}

      {canManage && (
        <Popconfirm
          title={t("common:areYouSure")}
          onConfirm={() => deleteMutation.mutate(record.id)}
          okButtonProps={{
            danger: true,
            loading: deleteMutation.isPending,
          }}
        >
          <Button icon={<DeleteOutlined />} danger type="text" />
        </Popconfirm>
      )}
    </Space>
  );

  const updatedColumns = [
    ...columns,
    {
      title: t("companies:columns.actions"),
      key: "actions",
      render: (record: Company) => renderActions(record),
    },
  ];

  return (
    <div style={{ padding: isMobile ? "16px" : 0 }}>
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
          <Title level={isMobile ? 3 : 2} style={{ margin: 0 }}>
            {t("companies:title")}
          </Title>
          <Text type="secondary">{t("companies:subtitle")}</Text>
        </div>
        <Space size="middle" style={{ width: isMobile ? "100%" : "auto" }}>
          {canManage && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => {
                setSelectedItem(null);
                setIsFormOpen(true);
              }}
              block={isMobile}
            >
              {t("companies:actions.addCompany")}
            </Button>
          )}
        </Space>
      </div>

      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Input
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              placeholder={t("companies:searchPlaceholder")}
              size="large"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={14} lg={6}>
            <Select
              size="large"
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="ALL">All Accounts</Option>
              <Option value="ACTIVE">Active Clients</Option>
              <Option value="INACTIVE">Inactive / Archived</Option>
            </Select>
          </Col>
          <Col
            xs={24}
            sm={10}
            lg={8}
            style={{
              display: "flex",
              justifyContent: isMobile ? "center" : "flex-end",
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
            dataSource={filteredCompanies}
            columns={updatedColumns}
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 12 }}
          />
        ) : (
          <List
            dataSource={filteredCompanies}
            loading={isLoading}
            pagination={{ pageSize: 12, position: "bottom", align: "center" }}
            renderItem={(company: Company) => (
              <List.Item style={{ padding: "8px 16px" }}>
                <Card
                  hoverable
                  style={{
                    width: "100%",
                    borderRadius: 16,
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                  bodyStyle={{ padding: 20 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 16,
                    }}
                  >
                    <Space size={12}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: "#f0f2f5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#1890ff",
                        }}
                      >
                        <BankOutlined style={{ fontSize: 20 }} />
                      </div>
                      <div>
                        <Text strong style={{ fontSize: 16, display: "block" }}>
                          {company.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          INN: {company.taxId}
                        </Text>
                      </div>
                    </Space>
                    <Tag
                      color={company.isActive ? "success" : "default"}
                      style={{ borderRadius: 6, margin: 0 }}
                    >
                      {company.isActive ? "Active" : "Inactive"}
                    </Tag>
                  </div>

                  <div
                    style={{
                      background: "#fafafa",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Contact Person
                      </Text>
                      <Text strong style={{ fontSize: 12 }}>
                        {company.contactPerson || "-"}
                      </Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Phone / Email
                      </Text>
                      <Text style={{ fontSize: 12 }}>
                        {company.phone || company.email || "-"}
                      </Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Current Discount
                      </Text>
                      {company.contracts?.[0] ? (
                        <Tag
                          color="blue"
                          style={{ margin: 0, fontWeight: "bold" }}
                        >
                          {company.contracts[0].discountPercent}%
                        </Tag>
                      ) : (
                        <Text type="secondary">-</Text>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space>
                      <Badge
                        count={company._count?.bookings}
                        showZero
                        color="#108ee9"
                        style={{ boxShadow: "none" }}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Total Bookings
                      </Text>
                    </Space>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => setDetailsId(company.id)}
                        shape="circle"
                      />
                      {canManage && (
                        <Button
                          icon={<EditOutlined />}
                          onClick={() => {
                            setSelectedItem(company);
                            setIsFormOpen(true);
                          }}
                          shape="circle"
                        />
                      )}
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>

      <CompanyForm
        item={selectedItem}
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedItem(null);
        }}
      />

      <CompanyDetails
        id={detailsId}
        open={!!detailsId}
        onClose={() => setDetailsId(null)}
      />
    </div>
  );
};
