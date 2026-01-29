import {
  Form,
  Input,
  DatePicker,
  Select,
  Row,
  Col,
  Button,
  Space,
  Divider,
  Typography,
  Drawer,
  message,
  Alert,
  Spin,
} from "antd";
import {
  UserOutlined,
  IdcardOutlined,
  GlobalOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { type Guest, guestApi } from "@/entities/guest/api/guest-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useDebounce } from "@/shared/lib/hooks/use-debounce";
import { useEffect, useState } from "react";

const { Title, Text } = Typography;
const { Option } = Select;

interface GuestFormProps {
  initialValues?: Guest | null;
  open: boolean;
  onClose: () => void;
}

const VISA_TYPES = ["TOURIST", "BUSINESS", "DIPLOMATIC", "WORK", "STUDY"];

export const GuestForm = ({ initialValues, open, onClose }: GuestFormProps) => {
  const { t } = useTranslation(["guests", "common"]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isEdit = !!initialValues;

  const [globalGuest, setGlobalGuest] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const passportSeries = Form.useWatch("passportSeries", form);
  const passportNumber = Form.useWatch("passportNumber", form);
  const debouncedPassport = useDebounce(
    { series: passportSeries, number: passportNumber },
    800,
  );

  // Global Lookup Logic
  useEffect(() => {
    const performLookup = async () => {
      if (
        !isEdit &&
        debouncedPassport.series?.length === 2 &&
        debouncedPassport.number?.length === 7
      ) {
        setIsSearching(true);
        try {
          const result = await guestApi.lookupGlobal(
            debouncedPassport.series.toUpperCase(),
            debouncedPassport.number,
          );
          setGlobalGuest(result);
        } catch (err) {
          console.error("Lookup failed", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setGlobalGuest(null);
      }
    };
    performLookup();
  }, [debouncedPassport, isEdit]);

  const pullMutation = useMutation({
    mutationFn: (id: string) => guestApi.pullToBranch(id),
    onSuccess: (res: any) => {
      message.success("Profile successfully imported to this branch!");
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      // Pre-fill the form with the pulled data
      form.setFieldsValue({
        ...res,
        dateOfBirth: res.dateOfBirth ? dayjs(res.dateOfBirth) : null,
        dateOfEntry: res.dateOfEntry ? dayjs(res.dateOfEntry) : null,
        passportIssueDate: res.passportIssueDate
          ? dayjs(res.passportIssueDate)
          : null,
        passportExpiryDate: res.passportExpiryDate
          ? dayjs(res.passportExpiryDate)
          : null,
      });
      setGlobalGuest(null);
    },
    onError: () => message.error("Failed to import profile."),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (isEdit && initialValues?.id) {
        return guestApi.update(initialValues.id, data);
      }
      return guestApi.create(data);
    },
    onSuccess: () => {
      message.success(
        isEdit ? t("guests:updateSuccess") : t("guests:createSuccess"),
      );
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      onClose();
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        message.error(t("guests:passportConflict"));
      } else {
        message.error(t("common:error"));
      }
    },
  });

  const onFinish = (values: any) => {
    const formattedValues = {
      ...values,
      dateOfBirth: values.dateOfBirth?.toISOString(),
      dateOfEntry: values.dateOfEntry?.toISOString(),
      passportIssueDate: values.passportIssueDate?.toISOString(),
      passportExpiryDate: values.passportExpiryDate?.toISOString(),
    };
    mutation.mutate(formattedValues);
  };

  if (open && initialValues && !form.getFieldValue("firstName")) {
    form.setFieldsValue({
      ...initialValues,
      dateOfBirth: initialValues.dateOfBirth
        ? dayjs(initialValues.dateOfBirth)
        : null,
      dateOfEntry: initialValues.dateOfEntry
        ? dayjs(initialValues.dateOfEntry)
        : null,
      passportIssueDate: initialValues.passportIssueDate
        ? dayjs(initialValues.passportIssueDate)
        : null,
      passportExpiryDate: initialValues.passportExpiryDate
        ? dayjs(initialValues.passportExpiryDate)
        : null,
    });
  } else if (open && !initialValues) {
    form.resetFields();
  }

  return (
    <Drawer
      title={isEdit ? t("guests:editGuest") : t("guests:addNewGuest")}
      width={720}
      onClose={onClose}
      open={open}
      styles={{ body: { paddingBottom: 80 } }}
      extra={
        <Space>
          <Button onClick={onClose}>{t("common:cancel")}</Button>
          <Button
            onClick={() => form.submit()}
            type="primary"
            loading={mutation.isPending}
          >
            {t("common:save")}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
      >
        {globalGuest && (
          <Alert
            message="Global Profile Found"
            description={
              <div>
                <Text>
                  This guest is registered at <b>{globalGuest.branch?.name}</b>.
                  Would you like to adopt this profile for your branch to avoid
                  duplication?
                </Text>
                <div style={{ marginTop: 12 }}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<SwapOutlined />}
                    onClick={() => pullMutation.mutate(globalGuest.id)}
                    loading={pullMutation.isPending}
                  >
                    Adopt Profile
                  </Button>
                </div>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 24, borderRadius: 12 }}
          />
        )}
        <section>
          <Title level={5}>
            <UserOutlined style={{ marginRight: 8 }} />
            {t("guests:basicInfo")}
          </Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="lastName"
                label={t("guests:lastName")}
                rules={[{ required: true, message: t("guests:lastNameReq") }]}
              >
                <Input placeholder="Tashatov" size="large" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="firstName"
                label={t("guests:firstName")}
                rules={[{ required: true, message: t("guests:firstNameReq") }]}
              >
                <Input placeholder="Azamat" size="large" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="patronymic" label={t("guests:patronymic")}>
                <Input placeholder="Akbarovich" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label={t("guests:phone")}
                rules={[{ required: true, message: t("guests:phoneReq") }]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="+998 90 123 45 67"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label={t("guests:email")}>
                <Input
                  prefix={<MailOutlined />}
                  placeholder="guest@example.com"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </section>

        <Divider />

        <section>
          <Title level={5}>
            <IdcardOutlined style={{ marginRight: 8 }} />
            {t("guests:passportData")}
          </Title>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="passportSeries"
                label={t("guests:passportSeries")}
                rules={[{ required: true, message: "!" }]}
              >
                <Input
                  placeholder="AA"
                  maxLength={2}
                  style={{ textTransform: "uppercase" }}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="passportNumber"
                label={t("guests:passportNumber")}
                rules={[
                  { required: true, message: t("guests:passportNumberReq") },
                ]}
              >
                <Input
                  placeholder="1234567"
                  maxLength={7}
                  size="large"
                  suffix={isSearching ? <Spin size="small" /> : null}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="citizenship"
                label={t("guests:citizenship")}
                rules={[{ required: true, message: "!" }]}
                initialValue="UZB"
              >
                <Input placeholder="UZB" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="dateOfBirth"
                label={t("guests:dateOfBirth")}
                rules={[{ required: true, message: "!" }]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  size="large"
                  format="DD.MM.YYYY"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="gender"
                label={t("guests:gender")}
                rules={[{ required: true, message: "!" }]}
              >
                <Select size="large">
                  <Option value="MALE">{t("guests:male")}</Option>
                  <Option value="FEMALE">{t("guests:female")}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="passportIssueDate"
                label={t("guests:passportIssueDate")}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  size="large"
                  format="DD.MM.YYYY"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="passportExpiryDate"
                label={t("guests:passportExpiryDate")}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  size="large"
                  format="DD.MM.YYYY"
                />
              </Form.Item>
            </Col>
          </Row>
        </section>

        <Divider />

        <section>
          <Title level={5}>
            <GlobalOutlined style={{ marginRight: 8 }} />
            {t("guests:visaInfo")}
          </Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="visaType" label={t("guests:visaType")}>
                <Select size="large" allowClear>
                  {VISA_TYPES.map((type) => (
                    <Option key={type} value={type}>
                      {type}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="visaNumber" label={t("guests:visaNumber")}>
                <Input placeholder="V1234567" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dateOfEntry" label={t("guests:dateOfEntry")}>
                <DatePicker
                  style={{ width: "100%" }}
                  size="large"
                  format="DD.MM.YYYY"
                />
              </Form.Item>
            </Col>
          </Row>
        </section>

        <Divider />

        <section>
          <Title level={5}>
            <EnvironmentOutlined style={{ marginRight: 8 }} />
            {t("guests:addressInfo")}
          </Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="region" label={t("guests:region")}>
                <Input placeholder="Tashkent City" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="district" label={t("guests:district")}>
                <Input placeholder="Yakkasaray" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label={t("guests:address")}>
            <Input.TextArea
              placeholder="Shota Rustaveli str 25, apt 12"
              rows={2}
              size="large"
            />
          </Form.Item>
        </section>
      </Form>
    </Drawer>
  );
};
