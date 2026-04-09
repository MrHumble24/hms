import {
  SearchOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";

export type TabType = "explore" | "bookings" | "profile";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="tg-bottom-nav">
      <div
        className={`tg-nav-item ${activeTab === "explore" ? "active" : ""}`}
        onClick={() => onTabChange("explore")}
      >
        <SearchOutlined />
        <span>Explore</span>
      </div>
      <div
        className={`tg-nav-item ${activeTab === "bookings" ? "active" : ""}`}
        onClick={() => onTabChange("bookings")}
      >
        <CalendarOutlined />
        <span>My Stays</span>
      </div>
      <div
        className={`tg-nav-item ${activeTab === "profile" ? "active" : ""}`}
        onClick={() => onTabChange("profile")}
      >
        <UserOutlined />
        <span>Profile</span>
      </div>
    </div>
  );
}
