import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import socket from "../socket";

function ChatWindow({ selectedUser }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentUser = JSON.parse(
    localStorage.getItem("user")
  );

  const currentUserId =
    currentUser?._id ||
    currentUser?.id;

  // ===============================
  // LOAD MESSAGES
  // ===============================

  useEffect(() => {
    if (
      !selectedUser ||
      !currentUserId
    ) {
      setMessages([]);
      return;
    }

    const fetchMessages =
      async () => {
        try {
          const response =
            await fetch(
              `http://localhost:5002/api/messages/${currentUserId}/${selectedUser._id}`
            );

          const data =
            await response.json();

          if (response.ok) {
            setMessages(data);
          }
        } catch (error) {
          console.error(
            "Messages Error:",
            error
          );
        }
      };

    fetchMessages();
  }, [
    selectedUser,
    currentUserId,
  ]);

  // ===============================
  // MARK SEEN
  // ===============================

  useEffect(() => {
    if (
      !selectedUser ||
      !currentUserId
    ) {
      return;
    }

    const markSeen =
      async () => {
        try {
          await fetch(
            `http://localhost:5002/api/messages/seen/${selectedUser._id}/${currentUserId}`,
            {
              method: "PUT",
            }
          );

          setMessages(
            (previous) =>
              previous.map(
                (msg) => {
                  const senderId =
                    typeof msg.sender ===
                    "object"
                      ? msg.sender._id
                      : msg.sender;

                  if (
                    senderId ===
                    selectedUser._id
                  ) {
                    return {
                      ...msg,
                      seen: true,
                    };
                  }

                  return msg;
                }
              )
          );

          socket.emit(
            "messages_seen",
            {
              senderId:
                selectedUser._id,
              receiverId:
                currentUserId,
            }
          );
        } catch (error) {
          console.error(
            "Seen Error:",
            error
          );
        }
      };

    markSeen();
  }, [
    selectedUser,
    currentUserId,
  ]);

  // ===============================
  // RECEIVE MESSAGE
  // ===============================

  useEffect(() => {
    const receiveMessage =
      (data) => {
        if (
          !selectedUser ||
          !currentUserId
        ) {
          return;
        }

        const isCurrentChat =
          (data.sender ===
            currentUserId &&
            data.receiver ===
              selectedUser._id) ||
          (data.sender ===
            selectedUser._id &&
            data.receiver ===
              currentUserId);

        if (!isCurrentChat) {
          return;
        }

        setMessages(
          (previous) => {
            if (
              previous.some(
                (msg) =>
                  msg._id ===
                  data._id
              )
            ) {
              return previous;
            }

            return [
              ...previous,
              data,
            ];
          }
        );
      };

    socket.on(
      "receive_message",
      receiveMessage
    );

    return () => {
      socket.off(
        "receive_message",
        receiveMessage
      );
    };
  }, [
    selectedUser,
    currentUserId,
  ]);

  // ===============================
  // SEEN RECEIVED
  // ===============================

  useEffect(() => {
    const handleSeen =
      (data) => {
        if (
          !selectedUser ||
          data.receiverId !==
            currentUserId
        ) {
          return;
        }

        setMessages(
          (previous) =>
            previous.map(
              (msg) => {
                const receiverId =
                  typeof msg.receiver ===
                  "object"
                    ? msg.receiver._id
                    : msg.receiver;

                if (
                  receiverId ===
                  selectedUser._id
                ) {
                  return {
                    ...msg,
                    seen: true,
                  };
                }

                return msg;
              }
            )
        );
      };

    socket.on(
      "messages_seen",
      handleSeen
    );

    return () => {
      socket.off(
        "messages_seen",
        handleSeen
      );
    };
  }, [
    selectedUser,
    currentUserId,
  ]);

  // ===============================
  // TYPING
  // ===============================

  useEffect(() => {
    const handleTyping =
      (data) => {
        if (
          selectedUser &&
          data.senderId ===
            selectedUser._id
        ) {
          setIsTyping(
            data.isTyping
          );
        }
      };

    socket.on(
      "typing",
      handleTyping
    );

    return () => {
      socket.off(
        "typing",
        handleTyping
      );
    };
  }, [selectedUser]);

  // ===============================
  // AUTO SCROLL
  // ===============================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [
    messages,
    isTyping,
  ]);

  // ===============================
  // SEND TEXT / FILE
  // ===============================

  const sendMessage =
    async () => {
      const text =
        message.trim();

      if (
        !text &&
        !selectedFile
      ) {
        return;
      }

      if (
        !selectedUser ||
        !currentUserId
      ) {
        return;
      }

      try {
        setUploading(true);

        let fileData = null;

        // Upload file first
        if (selectedFile) {
          const formData =
            new FormData();

          formData.append(
            "file",
            selectedFile
          );

          const uploadResponse =
            await fetch(
              "http://localhost:5002/api/upload",
              {
                method: "POST",
                body: formData,
              }
            );

          const uploadResult =
            await uploadResponse.json();

          if (
            !uploadResponse.ok
          ) {
            alert(
              uploadResult.message ||
                "File upload failed"
            );
            return;
          }

          fileData =
            uploadResult.file;
        }

        // Save message
        const response =
          await fetch(
            "http://localhost:5002/api/messages",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                sender:
                  currentUserId,

                receiver:
                  selectedUser._id,

                text,

                file:
                  fileData,
              }),
            }
          );

        const savedMessage =
          await response.json();

        if (!response.ok) {
          console.error(
            "Message Error:",
            savedMessage
          );
          return;
        }

        // Send through socket
        socket.emit(
          "send_message",
          savedMessage
        );

        // Stop typing
        socket.emit(
          "typing",
          {
            senderId:
              currentUserId,

            receiverId:
              selectedUser._id,

            isTyping: false,
          }
        );

        setMessage("");
        setSelectedFile(null);

        if (fileInputRef.current) {
          fileInputRef.current.value =
            "";
        }
      } catch (error) {
        console.error(
          "Send Error:",
          error
        );
      } finally {
        setUploading(false);
      }
    };

  // ===============================
  // TYPING INPUT
  // ===============================

  const handleTyping =
    (e) => {
      const value =
        e.target.value;

      setMessage(value);

      if (
        !selectedUser ||
        !currentUserId
      ) {
        return;
      }

      socket.emit(
        "typing",
        {
          senderId:
            currentUserId,

          receiverId:
            selectedUser._id,

          isTyping:
            value.length > 0,
        }
      );

      clearTimeout(
        typingTimeoutRef.current
      );

      typingTimeoutRef.current =
        setTimeout(() => {
          socket.emit(
            "typing",
            {
              senderId:
                currentUserId,

              receiverId:
                selectedUser._id,

              isTyping: false,
            }
          );
        }, 1000);
    };

  // ===============================
  // FILE SELECT
  // ===============================

  const handleFileChange =
    (e) => {
      const file =
        e.target.files?.[0];

      if (!file) {
        return;
      }

      if (
        file.size >
        10 * 1024 * 1024
      ) {
        alert(
          "File size must be less than 10 MB"
        );

        e.target.value = "";
        return;
      }

      setSelectedFile(file);
    };

  // ===============================
  // ENTER
  // ===============================

  const handleKeyDown =
    (e) => {
      if (
        e.key === "Enter" &&
        !e.shiftKey
      ) {
        e.preventDefault();
        sendMessage();
      }
    };

  // ===============================
  // TIME
  // ===============================

  const formatTime =
    (date) => {
      if (!date) return "";

      return new Date(
        date
      ).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    };

  // ===============================
  // EMPTY
  // ===============================

  if (!selectedUser) {
    return (
      <div className="chat-window empty-chat">
        <p>
          Select a user to start
          chatting
        </p>
      </div>
    );
  }

  // ===============================
  // CHAT
  // ===============================

  return (
    <div className="chat-window">

      <ChatHeader
        selectedUser={
          selectedUser
        }
      />

      <div className="messages-area">

        {messages.length ===
        0 ? (
          <p className="no-messages">
            No messages yet.
            Start the
            conversation 👋
          </p>
        ) : (
          messages.map(
            (msg, index) => {

              const senderId =
                typeof msg.sender ===
                "object"
                  ? msg.sender._id
                  : msg.sender;

              const isMine =
                senderId ===
                currentUserId;

              return (
                <div
                  key={
                    msg._id ||
                    index
                  }
                  className={
                    isMine
                      ? "message sent"
                      : "message received"
                  }
                >

                  <div className="message-bubble">

                    {msg.text && (
                      <div>
                        {msg.text}
                      </div>
                    )}

                    {msg.file && (
                      <div
                        style={{
                          marginTop:
                            msg.text
                              ? "8px"
                              : "0",
                        }}
                      >

                        {msg.file.type?.startsWith(
                          "image/"
                        ) ? (
                          <img
                            src={`http://localhost:5002${msg.file.url}`}
                            alt={
                              msg.file.name
                            }
                            style={{
                              maxWidth:
                                "220px",
                              maxHeight:
                                "250px",
                              borderRadius:
                                "8px",
                              display:
                                "block",
                            }}
                          />
                        ) : (
                          <a
                            href={`http://localhost:5002${msg.file.url}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              textDecoration:
                                "none",
                            }}
                          >
                            📎{" "}
                            {
                              msg.file
                                .name
                            }
                          </a>
                        )}

                      </div>
                    )}

                    <small
                      style={{
                        display:
                          "block",
                        textAlign:
                          "right",
                        fontSize:
                          "10px",
                        marginTop:
                          "4px",
                        opacity:
                          0.7,
                      }}
                    >
                      {formatTime(
                        msg.createdAt
                      )}

                      {isMine && (
                        <span
                          style={{
                            marginLeft:
                              "5px",
                            fontSize:
                              "12px",
                          }}
                        >
                          {msg.seen
                            ? "✓✓"
                            : "✓"}
                        </span>
                      )}
                    </small>

                  </div>

                </div>
              );
            }
          )
        )}

        {isTyping && (
          <div
            style={{
              padding:
                "5px 10px",
              fontSize:
                "13px",
              opacity:
                0.7,
            }}
          >
            {
              selectedUser.name
            }{" "}
            is typing...
          </div>
        )}

        <div
          ref={
            messagesEndRef
          }
        />

      </div>

      {/* SELECTED FILE */}

      {selectedFile && (
        <div
          style={{
            padding:
              "8px 12px",
            background:
              "#1e293b",
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            fontSize:
              "13px",
          }}
        >
          <span>
            📎{" "}
            {
              selectedFile.name
            }
          </span>

          <button
            onClick={() => {
              setSelectedFile(
                null
              );

              if (
                fileInputRef.current
              ) {
                fileInputRef.current.value =
                  "";
              }
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* INPUT */}

      <div className="message-input-area">

        <input
          ref={
            fileInputRef
          }
          type="file"
          style={{
            display:
              "none",
          }}
          onChange={
            handleFileChange
          }
        />

        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          disabled={
            uploading
          }
          title="Attach file"
        >
          📎
        </button>

        <input
          type="text"
          placeholder="Type a message..."
          value={
            message
          }
          onChange={
            handleTyping
          }
          onKeyDown={
            handleKeyDown
          }
          disabled={
            uploading
          }
        />

        <button
          onClick={
            sendMessage
          }
          disabled={
            uploading ||
            (!message.trim() &&
              !selectedFile)
          }
        >
          {uploading
            ? "Sending..."
            : "Send"}
        </button>

      </div>

    </div>
  );
}

export default ChatWindow;