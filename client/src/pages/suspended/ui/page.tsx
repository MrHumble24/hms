import { Result, Button, Layout, Typography, Card } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Content, Footer } = Layout;
const { Text, Title } = Typography;

export const SuspendedPage = () => {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Content
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "24px",
        }}
      >
        <Result
          status="error"
          icon={<LockOutlined style={{ color: "#ff4d4f", fontSize: 64 }} />}
          title={
            <Title level={2} style={{ marginTop: 0 }}>
              Access Suspended
            </Title>
          }
          subTitle={
            <div
              style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}
            >
              <Text
                style={{
                  fontSize: 16,
                  display: "block",
                  marginBottom: 24,
                  color: "rgba(0,0,0,0.65)",
                }}
              >
                We're sorry, but your access to the Antigravity HMS platform has
                been temporarily suspended.
              </Text>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 20,
                  marginBottom: 32,
                  textAlign: "left",
                }}
              >
                <Card
                  size="small"
                  title="Possible Reasons"
                  headStyle={{ background: "#fafafa" }}
                >
                  <ul
                    style={{
                      paddingLeft: 20,
                      margin: 0,
                      fontSize: 13,
                      color: "rgba(0,0,0,0.65)",
                    }}
                  >
                    <li style={{ marginBottom: 4 }}>
                      Subscription expiration or billing issue
                    </li>
                    <li style={{ marginBottom: 4 }}>
                      Organization-wide maintenance
                    </li>
                    <li style={{ marginBottom: 4 }}>
                      Security policy violation
                    </li>
                  </ul>
                </Card>

                <Card
                  size="small"
                  title="Next Steps"
                  headStyle={{ background: "#fafafa" }}
                >
                  <ul
                    style={{
                      paddingLeft: 20,
                      margin: 0,
                      fontSize: 13,
                      color: "rgba(0,0,0,0.65)",
                    }}
                  >
                    <li style={{ marginBottom: 4 }}>
                      Contact your System Administrator
                    </li>
                    <li style={{ marginBottom: 4 }}>
                      Check your email for status updates
                    </li>
                    <li style={{ marginBottom: 4 }}>
                      Reach out to Antigravity Support
                    </li>
                  </ul>
                </Card>
              </div>

              <Text type="secondary" style={{ fontSize: 13 }}>
                If you believe this is a mistake, please contact us at{" "}
                <a href="mailto:support@antigravity.uz">
                  support@antigravity.uz
                </a>
              </Text>
            </div>
          }
          extra={[
            <Button
              type="primary"
              key="login"
              onClick={handleBackToLogin}
              style={{ minWidth: 120, height: 40 }}
            >
              Back to Login
            </Button>,
            <Button
              key="support"
              icon={<MailOutlined />}
              href="mailto:support@antigravity.uz"
              style={{ height: 40 }}
            >
              Contact Support
            </Button>,
          ]}
        />
      </Content>
      <Footer style={{ textAlign: "center", background: "transparent" }}>
        <Text type="secondary">
          ©{new Date().getFullYear()} Antigravity Hotel Management System
        </Text>
      </Footer>
    </Layout>
  );
};
