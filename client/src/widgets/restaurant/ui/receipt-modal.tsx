import { Modal, Button, Typography, Divider, Table, Tag } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import type { RestaurantOrder } from "@/entities/restaurant";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { useRef } from "react";

const { Title, Text } = Typography;

interface ReceiptModalProps {
  order: RestaurantOrder | null;
  open: boolean;
  onClose: () => void;
}

export const ReceiptModal = ({ order, open, onClose }: ReceiptModalProps) => {
  const { t, i18n } = useTranslation(["common", "restaurant"]);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const handlePrint = () => {
    const printContent = receiptRef.current;
    const WindowPnt = window.open(
      "",
      "",
      "left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0",
    );

    if (printContent && WindowPnt) {
      WindowPnt.document.write(`
        <html>
          <head>
            <title>Receipt - ${order.id.slice(-6).toUpperCase()}</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; padding: 20px; font-size: 14px; color: #000; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h2 { margin: 0; text-transform: uppercase; }
              .header p { margin: 5px 0; }
              .divider { border-top: 1px dashed #000; margin: 10px 0; }
              .items { width: 100%; border-collapse: collapse; }
              .items th { text-align: left; border-bottom: 1px dashed #000; padding: 5px 0; }
              .items td { padding: 5px 0; }
              .total { text-align: right; margin-top: 15px; font-weight: bold; font-size: 16px; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; }
              @page { margin: 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>${t("restaurant:receipt.businessName")}</h2>
              <p>${t("restaurant:receipt.orderNo", { id: order.id.slice(-6).toUpperCase() })}</p>
              <p>${t("restaurant:history.columns.dateTime")}: ${dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}</p>
              ${order.tableNumber ? `<p>${t("restaurant:receipt.table", { number: order.tableNumber })}</p>` : ""}
            </div>
            <div class="divider"></div>
            <table class="items">
              <thead>
                <tr>
                  <th>${t("restaurant:receipt.item")}</th>
                  <th style="text-align: center;">${t("restaurant:receipt.qty")}</th>
                  <th style="text-align: right;">${t("restaurant:receipt.price")}</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.menuItem.name[i18n.language] || item.menuItem.name["en"] || Object.values(item.menuItem.name)[0]}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">${new Intl.NumberFormat().format(item.price * item.quantity)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="divider"></div>
            <div class="total">
              ${t("restaurant:receipt.total")}: ${new Intl.NumberFormat().format(order.totalAmount)} ${t("common:currency")}
            </div>
            <div class="footer">
              <p>${t("restaurant:receipt.thankYou")}</p>
              <p>${t("restaurant:receipt.comeAgain")}</p>
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      WindowPnt.document.close();
    }
  };

  const getLocalized = (obj: any) => {
    if (!obj) return "";
    return obj[i18n.language] || obj["en"] || Object.values(obj)[0] || "";
  };

  return (
    <Modal
      title={t("restaurant:receipt.title")}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {t("common:close")}
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
        >
          {t("restaurant:receipt.print")}
        </Button>,
      ]}
    >
      <div
        ref={receiptRef}
        style={{
          padding: 16,
          background: "#fbfbfb",
          border: "1px solid #f0f0f0",
          borderRadius: 4,
          fontFamily: "monospace",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            {t("restaurant:receipt.businessName")}
          </Title>
          <Text type="secondary">
            {t("restaurant:receipt.orderNo", {
              id: order.id.slice(-6).toUpperCase(),
            })}
          </Text>
          <br />
          <Text type="secondary">
            {dayjs(order.createdAt).format("DD MMM YYYY, HH:mm")}
          </Text>
          {order.tableNumber && (
            <div style={{ marginTop: 4 }}>
              <Tag color="blue">
                {t("restaurant:kds.table")}: {order.tableNumber}
              </Tag>
            </div>
          )}
        </div>

        <Divider dashed style={{ margin: "12px 0" }} />

        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          <Table
            dataSource={order.items}
            pagination={false}
            size="small"
            rowKey="id"
            columns={[
              {
                title: t("restaurant:receipt.item"),
                key: "name",
                render: (record) => getLocalized(record.menuItem.name),
              },
              {
                title: t("restaurant:receipt.qty"),
                dataIndex: "quantity",
                align: "center",
              },
              {
                title: t("restaurant:receipt.price"),
                key: "price",
                align: "right",
                render: (record) =>
                  new Intl.NumberFormat().format(
                    record.price * record.quantity,
                  ),
              },
            ]}
          />
        </div>

        <Divider dashed style={{ margin: "12px 0" }} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 8px",
          }}
        >
          <Text strong style={{ fontSize: 16 }}>
            {t("restaurant:receipt.total")}
          </Text>
          <Text strong style={{ fontSize: 20 }}>
            {new Intl.NumberFormat().format(order.totalAmount)}{" "}
            {t("common:currency")}
          </Text>
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t("restaurant:receipt.thankYou")}
          </Text>
        </div>
      </div>
    </Modal>
  );
};
