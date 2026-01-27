import { Form, Input, Card } from "antd";
import { useTranslation } from "react-i18next";

interface LocalizedInputProps {
  label: string;
  name: string; // The property name in the form, e.g., 'name' or 'description'
  required?: boolean;
}

export const LocalizedInput = ({
  label,
  name,
  required,
}: LocalizedInputProps) => {
  const { i18n } = useTranslation();
  const languages = ["en", "uz", "ru"];

  return (
    <Card size="small" title={label} style={{ marginBottom: 16 }}>
      {languages.map((lang) => (
        <Form.Item
          key={lang}
          name={[name, lang]}
          label={lang.toUpperCase()}
          rules={
            required && lang === i18n.language
              ? [{ required: true, message: `Required (${lang})` }]
              : []
          }
        >
          <Input placeholder={`${label} in ${lang.toUpperCase()}`} />
        </Form.Item>
      ))}
    </Card>
  );
};
