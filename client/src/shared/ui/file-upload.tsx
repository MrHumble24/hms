import { Upload, message, Button } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState } from "react";
import { uploadApi } from "@/shared/api/upload-api";
import { resolveImageUrl } from "@/shared/lib/utils/resolve-image-url";

interface FileUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  folder?: string;
  accept?: string;
}

export const FileUpload = ({
  value,
  onChange,
  accept = "image/*",
}: FileUploadProps) => {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;

    setLoading(true);
    try {
      // Manual progress simulation if needed, but axios handles it
      const result = await uploadApi.uploadFile(file as File);

      onSuccess(result.url);
      if (onChange) {
        onChange(result.url);
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

  const handleRemove = () => {
    if (onChange) {
      onChange("");
    }
  };

  return (
    <div className="file-upload-container">
      {value ? (
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
            onClick={handleRemove}
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
};
