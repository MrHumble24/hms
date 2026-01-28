import { Upload, message, Button, Card, Row, Col } from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { uploadApi } from "@/shared/api/upload-api";
import { resolveImageUrl } from "@/shared/lib/utils/resolve-image-url";

interface FileUploadProps {
  value?: string | string[];
  onChange?: (val: any) => void;
  folder?: string;
  accept?: string;
  multiple?: boolean;
  maxCount?: number;
}

export const FileUpload = ({
  value,
  onChange,
  accept = "image/*",
  multiple = false,
  maxCount = 10,
}: FileUploadProps) => {
  const [loading, setLoading] = useState(false);

  const images = Array.isArray(value) ? value : value ? [value] : [];

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;

    setLoading(true);
    try {
      const result = await uploadApi.uploadFile(file as File);
      onSuccess(result.url);

      if (multiple) {
        const newImages = [...images, result.url];
        if (onChange) onChange(newImages);
      } else {
        if (onChange) onChange(result.url);
      }

      message.success("File uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      onError(error);
      message.error("File upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (urlToRemove: string) => {
    if (multiple) {
      const newImages = images.filter((url) => url !== urlToRemove);
      if (onChange) onChange(newImages);
    } else {
      if (onChange) onChange("");
    }
  };

  const renderSingle = () => (
    <div className="file-upload-single">
      {value && typeof value === "string" ? (
        <div style={{ position: "relative", marginBottom: 8, maxWidth: 200 }}>
          <img
            src={resolveImageUrl(value)}
            alt="Uploaded"
            style={{
              width: "100%",
              borderRadius: 8,
              border: "1px solid #d9d9d9",
            }}
          />
          <Button
            type="primary"
            danger
            shape="circle"
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleRemove(value)}
            style={{ position: "absolute", top: -8, right: -8 }}
          />
        </div>
      ) : (
        <Upload
          customRequest={handleUpload}
          showUploadList={false}
          accept={accept}
          disabled={loading}
        >
          <Button icon={<UploadOutlined />} loading={loading}>
            {loading ? "Uploading..." : "Click to Upload"}
          </Button>
        </Upload>
      )}
    </div>
  );

  const renderMultiple = () => (
    <div className="file-upload-multiple">
      <Row gutter={[12, 12]}>
        {images.map((url, index) => (
          <Col key={index} xs={12} sm={8} md={6}>
            <Card
              bodyStyle={{ padding: 0 }}
              style={{ overflow: "hidden", borderRadius: 8 }}
            >
              <div style={{ position: "relative", aspectRatio: "4/3" }}>
                <img
                  src={resolveImageUrl(url)}
                  alt={`Upload ${index}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <Button
                  type="primary"
                  danger
                  size="small"
                  shape="circle"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(url)}
                  style={{ position: "absolute", top: 4, right: 4 }}
                />
              </div>
            </Card>
          </Col>
        ))}
        {images.length < maxCount && (
          <Col xs={12} sm={8} md={6}>
            <Upload
              customRequest={handleUpload}
              showUploadList={false}
              accept={accept}
              disabled={loading}
              multiple
            >
              <div
                style={{
                  height: "100%",
                  aspectRatio: "4/3",
                  border: "1px dashed #d9d9d9",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  background: "#fafafa",
                }}
              >
                <PlusOutlined style={{ fontSize: 24, color: "#999" }} />
                <div style={{ marginTop: 8, color: "#666" }}>
                  {loading ? "Uploading..." : "Upload"}
                </div>
              </div>
            </Upload>
          </Col>
        )}
      </Row>
    </div>
  );

  return multiple ? renderMultiple() : renderSingle();
};
