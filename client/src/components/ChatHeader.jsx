import { useEffect, useState } from "react";
import socket from "../socket";

function ChatHeader({ selectedUser }) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!selectedUser) {
      setIsOnline(false);
      return;
    }

    const handleOnlineUsers = (users) => {
      setIsOnline(users.includes(selectedUser._id));
    };

    const handleOnline = (userId) => {
      if (userId === selectedUser._id) {
        setIsOnline(true);
      }
    };

    const handleOffline = (userId) => {
      if (userId === selectedUser._id) {
        setIsOnline(false);
      }
    };

    socket.on("online_users", handleOnlineUsers);
    socket.on("user_online", handleOnline);
    socket.on("user_offline", handleOffline);

    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.off("user_online", handleOnline);
      socket.off("user_offline", handleOffline);
    };
  }, [selectedUser]);

  if (!selectedUser) {
    return null;
  }

  return (
    <div className="chat-header">

      <div className="header-avatar">
        {selectedUser.name
          ?.charAt(0)
          .toUpperCase()}
      </div>

      <div>
        <h3>{selectedUser.name}</h3>

        <span
          className={
            isOnline
              ? "status-online"
              : "status-offline"
          }
        >
          {isOnline ? "● Online" : "● Offline"}
        </span>
      </div>

    </div>
  );
}

export default ChatHeader;