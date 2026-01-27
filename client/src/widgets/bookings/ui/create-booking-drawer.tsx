import {
  Drawer,
  Form,
  Button,
  DatePicker,
  Select,
  InputNumber,
  Space,
  Typography,
  Divider,
  message,
  Grid,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bookingApi,
  BookingSource,
  type CreateBookingDto,
} from "@/entities/booking/api/booking-api";
import { guestApi } from "@/entities/guest/api/guest-api";
import { roomApi } from "@/entities/room/api/room-api";
import { useTranslation } from "react-i18next";
import {
  UserOutlined,
  HomeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface CreateBookingDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const CreateBookingDrawer = ({
  open,
  onClose,
}: CreateBookingDrawerProps) => {
  const { t } = useTranslation(["bookings", "common"]); // Assuming 'bookings' namespace exists or will default
  const screens = Grid.useBreakpoint();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch Data
  const { data: guests = [], isLoading: isLoadingGuests } = useQuery({
    queryKey: ["guests"],
    queryFn: () => guestApi.getAll().then((res) => res.data),
  });

  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomApi.getAllRooms().then((res) => res.data), // Note: This gets all rooms, ideally we filter by availability in backend
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBookingDto) => bookingApi.create(data),
    onSuccess: () => {
      message.success(t("common:success", "Booking created successfully"));
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      onClose();
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message ||
          t("common:error", "Failed to create booking"),
      );
    },
  });

  const onFinish = (values: any) => {
    const [start, end] = values.dates;

    // Transform to DTO
    const dto: CreateBookingDto = {
      checkIn: start.toISOString(),
      checkOut: end.toISOString(),
      primaryGuestId: values.guestId,
      source: values.source,
      roomStays: [
        {
          roomId: values.roomId,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          adultsCount: values.adultsCount || 1,
          childrenCount: values.childrenCount || 0,
        },
      ],
    };

    createMutation.mutate(dto);
  };

  const guestOptions = guests.map((g: any) => ({
    label: `${g.firstName} ${g.lastName} (${g.phone})`,
    value: g.id,
  }));

  const roomOptions = rooms.map((r: any) => ({
    label: `${r.number} - ${r.type?.name} ($${r.type?.basePrice?.toLocaleString()})`,
    value: r.id,
    status: r.status, // We can disable if dirty/occupied technically, but business logic might allow override
  }));

  return (
    <Drawer
      title={
        <Space>
          <CalendarOutlined />
          {t("bookings:createTitle", "New Reservation")}
        </Space>
      }
      width={screens.md ? 500 : "100%"}
      onClose={onClose}
      open={open}
      footer={
        <div style={{ textAlign: "right" }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            {t("common:cancel", "Cancel")}
          </Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={createMutation.isPending}
          >
            {t("common:create", "Create Reservation")}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* Section 1: Guest */}
        <div style={{ marginBottom: 24 }}>
          <Title level={5}>
            <UserOutlined /> {t("bookings:guestDetails", "Guest Details")}
          </Title>
          <Divider style={{ margin: "12px 0" }} />
          <Form.Item
            name="guestId"
            label={t("bookings:selectGuest", "Select Guest")}
            rules={[{ required: true, message: "Please select a guest" }]}
          >
            <Select
              showSearch
              placeholder="Search by name or phone"
              optionFilterProp="label"
              options={guestOptions}
              loading={isLoadingGuests}
              allowClear
            />
          </Form.Item>
        </div>

        {/* Section 2: Stay Details */}
        <div style={{ marginBottom: 24 }}>
          <Title level={5}>
            <CalendarOutlined /> {t("bookings:stayDetails", "Stay Details")}
          </Title>
          <Divider style={{ margin: "12px 0" }} />

          <Form.Item
            name="dates"
            label={t("bookings:dates", "Check-in / Check-out")}
            rules={[{ required: true, message: "Please select dates" }]}
          >
            <RangePicker
              style={{ width: "100%" }}
              format="YYYY-MM-DD"
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Form.Item>

          <Form.Item
            name="roomId"
            label={t("bookings:selectRoom", "Select Room")}
            help="Rooms valid for selection"
          >
            <Select
              showSearch
              placeholder="Search room number"
              optionFilterProp="label"
              options={roomOptions}
              loading={isLoadingRooms}
              allowClear
            />
          </Form.Item>
        </div>

        {/* Section 3: Occupancy & Info */}
        <div style={{ marginBottom: 24 }}>
          <Title level={5}>
            <HomeOutlined /> {t("bookings:occupancy", "Occupancy & Info")}
          </Title>
          <Divider style={{ margin: "12px 0" }} />

          <Space size="large" style={{ display: "flex", marginBottom: 16 }}>
            <Form.Item
              name="adultsCount"
              label={t("bookings:adults", "Adults")}
              initialValue={1}
              style={{ marginBottom: 0 }}
            >
              <InputNumber min={1} max={10} />
            </Form.Item>
            <Form.Item
              name="childrenCount"
              label={t("bookings:children", "Children")}
              initialValue={0}
              style={{ marginBottom: 0 }}
            >
              <InputNumber min={0} max={10} />
            </Form.Item>
          </Space>

          <Form.Item
            name="source"
            label={t("bookings:source", "Booking Source")}
            initialValue={BookingSource.WALK_IN}
          >
            <Select
              options={Object.values(BookingSource).map((src) => ({
                label: src.replace("_", " "),
                value: src,
              }))}
            />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
};
