import { Dropdown, Button, Space, type MenuProps } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const languages = [
  { key: "uz", label: "O'zbekcha", flag: "🇺🇿" },
  { key: "en", label: "English", flag: "🇺🇸" },
  { key: "ru", label: "Русский", flag: "🇷🇺" },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    i18n.changeLanguage(key);
  };

  const currentLang =
    languages.find((l) => l.key === i18n.language) || languages[1];

  const items: MenuProps["items"] = languages.map((lang) => ({
    key: lang.key,
    label: (
      <Space>
        <span>{lang.flag}</span>
        <span>{lang.label}</span>
      </Space>
    ),
  }));

  return (
    <Dropdown
      menu={{
        items,
        onClick: handleMenuClick,
        selectedKeys: [i18n.language],
      }}
      placement="bottomRight"
      trigger={["click"]}
    >
      <Button
        type="text"
        icon={<GlobalOutlined />}
        style={{ display: "flex", alignItems: "center" }}
      >
        <Space size={4}>
          <span style={{ fontSize: 16 }}>{currentLang.flag}</span>
          <span>{currentLang.key.toUpperCase()}</span>
        </Space>
      </Button>
    </Dropdown>
  );
};
