import { Card, Form, Input, Button, Typography, Layout, Divider } from "antd";
import { UserOutlined, LockOutlined, ShopOutlined } from "@ant-design/icons";
import { useLogin } from "@/features/auth/hooks/use-login";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/features/language-switcher/ui/switcher";

const { Title, Text } = Typography;
const { Content, Footer, Header } = Layout;

export const LoginPage = () => {
  const { t } = useTranslation("auth");
  const { mutate: login, isPending } = useLogin();

  const onFinish = (values: any) => {
    login(values);
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Header
        style={{
          background: "transparent",
          display: "flex",
          justifyContent: "flex-end",
          padding: "0 24px",
          alignItems: "center",
        }}
      >
        <LanguageSwitcher />
      </Header>
      <Content
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "24px",
        }}
      >
        <Card
          bordered={false}
          style={{
            width: "100%",
            maxWidth: 420,
            borderRadius: 12,
            boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
            overflow: "hidden",
          }}
          bodyStyle={{ padding: "40px 32px" }}
        >
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div
              style={{
                width: 64,
                height: 64,
                background: "#1677ff",
                borderRadius: 16,
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 16,
                boxShadow: "0 8px 16px rgba(22, 119, 255, 0.2)",
              }}
            >
              <ShopOutlined style={{ fontSize: 32, color: "#fff" }} />
            </div>
            <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
              {t("loginTitle")}
            </Title>
            <Text type="secondary">{t("loginSubtitle")}</Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            requiredMark={false}
            initialValues={{
              email: "super@hms.uz",
              password: "password123",
            }}
          >
            <Form.Item
              name="email"
              label={t("emailLabel")}
              rules={[
                { required: true, message: t("emailRequired") },
                { type: "email", message: t("emailInvalid") },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "rgba(0,0,0,0.25)" }} />}
                placeholder={t("emailPlaceholder")}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={t("passwordLabel")}
              rules={[{ required: true, message: t("passwordRequired") }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "rgba(0,0,0,0.25)" }} />}
                placeholder={t("passwordPlaceholder")}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={isPending}
                style={{
                  height: 48,
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {t("signInButton")}
              </Button>
            </Form.Item>
          </Form>

          <Divider plain>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t("prodReady")}
            </Text>
          </Divider>

          <div style={{ textAlign: "center" }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t("forgotPassword")}
            </Text>
          </div>
        </Card>
      </Content>
      <Footer style={{ textAlign: "center", background: "transparent" }}>
        <Text type="secondary">
          ©{new Date().getFullYear()} Antigravity Hotel Management System
        </Text>
      </Footer>
    </Layout>
  );
};
