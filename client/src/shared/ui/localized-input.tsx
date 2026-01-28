import { Form, Input, Card, Button, Tooltip, message } from "antd";
import { useTranslation } from "react-i18next";
import { MagicOutlined } from "@ant-design/icons";
import { useState } from "react";
import { aiApi } from "@/shared/api/ai-api";

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
  const form = Form.useFormInstance();
  const languages = ["en", "uz", "ru"];
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    // Get values for this specific field
    const currentValues = form.getFieldValue(name) || {};

    // Find first non-empty value to translate from
    const sourceLang = languages.find((lang) => currentValues[lang]?.trim());
    const sourceText = sourceLang ? currentValues[sourceLang] : "";

    if (!sourceText) {
      message.warning("Please enter text in at least one language first");
      return;
    }

    try {
      setIsTranslating(true);
      const translations = await aiApi.translate(sourceText);

      // Update form values
      form.setFieldsValue({
        [name]: {
          en: translations.en,
          uz: translations.uz,
          ru: translations.ru,
        },
      });
      message.success("Translations generated");
    } catch (error) {
      console.error("Translation error:", error);
      message.error("Failed to generate translations");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Card
      size="small"
      title={label}
      style={{ marginBottom: 16 }}
      extra={
        <Tooltip title="Auto-translate with AI">
          <Button
            type="text"
            icon={<MagicOutlined />}
            onClick={handleTranslate}
            loading={isTranslating}
            style={{ color: "#722ed1" }}
          />
        </Tooltip>
      }
    >
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
