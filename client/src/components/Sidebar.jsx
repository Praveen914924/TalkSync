import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import socket from "../socket";

function Sidebar({ selectedUser, setSelectedUser }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});

  const currentUser = JSON.parse(
    localStorage.getItem("user")
  );

  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(
          "http://localhost:5002/api/auth/users"
        );

        const data = await response.json();

        if (response.ok) {
          setUsers(
            data.filter(
              (user) => user._id !== currentUserId
            )
          );
        }
      } catch (error) {
        console.error("Users Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    socket.emit("user_online", currentUserId);

    const handleOnlineUsers = (ids) => {
      setOnlineUsers(ids);
    };

    const handleUserOnline = (userId) => {
      setOnlineUsers((prev) =>
        prev.includes(userId)
          ? prev
          : [...prev, userId]
      );
    };

    const handleUserOffline = (userId) => {
      setOnlineUsers((prev) =>
        prev.filter((id) => id !== userId)
      );
    };

    const handleReceiveMessage = (data) => {
      const otherUserId =
        data.sender === currentUserId
          ? data.receiver
          : data.sender;

      setLastMessages((prev) => ({
        ...prev,
        [otherUserId]: {
          text: data.text,
          createdAt: data.createdAt,
        },
      }));

      if (
        data.receiver === currentUserId &&
        selectedUser?._id !== data.sender
      ) {
        setUnreadCounts((prev) => ({
          ...prev,
          [data.sender]:
            (prev[data.sender] || 0) + 1,
        }));
      }
    };

    socket.on("online_users", handleOnlineUsers);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);
    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.off(
        "receive_message",
        handleReceiveMessage
      );
    };
  }, [currentUserId, selectedUser]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);

    setUnreadCounts((prev) => ({
      ...prev,
      [user._id]: 0,
    }));
  };

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredUsers = users.filter((user) =>
    user.name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="sidebar">

      <div className="logo">
        <h2>TalkSync</h2>
      </div>

      <div className="search-box">
        <FaSearch />

        <input
          type="text"
          placeholder="Search user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="user-list">

        {loading ? (
          <p>Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p>No users found</p>
        ) : (
          filteredUsers.map((user) => {
            const isOnline = onlineUsers.includes(
              user._id
            );

            const lastMessage =
              lastMessages[user._id];

            const unread =
              unreadCounts[user._id] || 0;

            return (
              <div
                key={user._id}
                className="user-card"
                onClick={() => handleSelectUser(user)}
                style={{
                  background:
                    selectedUser?._id === user._id
                      ? "#334155"
                      : "transparent",
                }}
              >

                <div
                  className="avatar"
                  style={{
                    position: "relative",
                  }}
                >
                  {user.name
                    ?.charAt(0)
                    .toUpperCase()}

                  <span
                    style={{
                      position: "absolute",
                      bottom: "0",
                      right: "0",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: isOnline
                        ? "#22c55e"
                        : "#64748b",
                      border: "2px solid #0f172a",
                    }}
                  />
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h4>{user.name}</h4>

                    {lastMessage && (
                      <small>
                        {formatTime(
                          lastMessage.createdAt
                        )}
                      </small>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                    }}
                  >

                    <span
                      style={{
                        color: isOnline
                          ? "#22c55e"
                          : "#94a3b8",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "170px",
                      }}
                    >
                      {lastMessage
                        ? lastMessage.text
                        : isOnline
                        ? "Online"
                        : "Offline"}
                    </span>

                    {unread > 0 && (
                      <span
                        style={{
                          background: "#22c55e",
                          color: "white",
                          borderRadius: "50%",
                          minWidth: "20px",
                          height: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      >
                        {unread}
                      </span>
                    )}

                  </div>

                </div>

              </div>
            );
          })
        )}

      </div>

    </div>
  );
}

export default Sidebar;