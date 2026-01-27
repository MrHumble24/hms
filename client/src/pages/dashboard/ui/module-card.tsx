import React from "react";
import { Card, Typography, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { useTabStore } from "@/entities/navigation/model/tab-store";

const { Title, Text } = Typography;

interface ModuleCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  path: string;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  id,
  title,
  description,
  icon,
  color,
  path,
}) => {
  const navigate = useNavigate();
  const addTab = useTabStore((state) => state.addTab);

  const handleClick = () => {
    addTab({ key: id, label: title, path });
    navigate(path);
  };

  return (
    <Card
      hoverable
      onClick={handleClick}
      style={{
        borderRadius: 12,
        height: "100%",
        border: "1px solid #f0f0f0",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
      }}
      bodyStyle={{ padding: 24 }}
      className="module-card"
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <div
          style={{
            width: 56,
            height: 56,
            background: `${color}10`, // 10% opacity
            color: color,
            borderRadius: 12,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 28,
            transition: "transform 0.3s ease",
          }}
        >
          {icon}
        </div>
        <div>
          <Title level={4} style={{ margin: "0 0 8px 0", fontWeight: 600 }}>
            {title}
          </Title>
          <Text type="secondary" style={{ fontSize: 13, lineHeight: "1.5" }}>
            {description}
          </Text>
        </div>
      </Space>
    </Card>
  );
};
