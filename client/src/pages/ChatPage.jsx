import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

function ChatPage() {
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  const currentUser = JSON.parse(
    localStorage.getItem("user")
  );

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="chat-container">

      <div className="chat-topbar">
        <div>
          <strong>TalkSync</strong>
          {currentUser?.name && (
            <span> • {currentUser.name}</span>
          )}
        </div>

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="chat-main">

        <Sidebar
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
        />

        <ChatWindow
          selectedUser={selectedUser}
        />

      </div>

    </div>
  );
}

export default ChatPage;