import { BellOutlined } from "@ant-design/icons";

export default function NotificationDropdown({ notifications }) {
  return (
    <div className="notification-wrapper">
      <BellOutlined className="notification-icon" />

      <div className="notification-dropdown">
        <h4>Thông báo</h4>

        {notifications.length === 0 && (
          <p className="empty">Không có thông báo mới</p>
        )}

        {notifications.slice(0, 5).map((item, index) => (
          <div key={index} className="notification-item">
            <div className="title">{item.title}</div>
            <div className="desc">{item.description}</div>
            <div className="time">{item.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
