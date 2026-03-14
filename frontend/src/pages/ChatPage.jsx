import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ConversationList from "../components/chat/ConversationList";
import ChatWindow from "../components/chat/ChatWindow";
import GroupInfoPanel from "../components/chat/GroupInfoPanel";
import { useSocket } from "../hooks/useSocket";

const ChatPage = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [selectedConv, setSelectedConv] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const { socket } = useSocket();

  const handleSelectConversation = (id, conv) => {
    setSelectedId(id);
    setSelectedConv(conv);
    setShowSidebar(false);
  };

  useEffect(() => {
    if (!socket || !selectedId) return;
    const onConversationUpdated = (conv) => {
      if (String(conv?._id) !== String(selectedId)) return;
      setSelectedConv((prev) => ({ ...(prev || {}), ...conv }));
    };
    socket.on("conversation-updated", onConversationUpdated);
    return () => socket.off("conversation-updated", onConversationUpdated);
  }, [socket, selectedId]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden font-sans relative">
      {/* Mobile overlay backdrop when sidebar is open */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-500"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Mobile toggle button - only visible when sidebar closed on mobile */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="fixed top-4 left-4 z-20 lg:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-2.5 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm transition-all active:scale-90 hover:bg-white dark:hover:bg-gray-800"
          aria-label="Open chats"
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="text-gray-700 dark:text-gray-300"
          >
            <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      )}

      {/* Sidebar - fixed on all screens, slides in/out */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-72 lg:w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          transition-transform duration-500 ease-out shadow-xl
          ${showSidebar ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="px-5 py-6 lg:px-6 lg:py-8 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
            {/* Home button + title */}
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Home"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-blue-600 dark:text-blue-400"
                >
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>
              <h2 className="text-xl font-semibold tracking-tight text-gray-800 dark:text-gray-100">
                🔀SyncChat
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {/* Desktop close button */}
              <button
                onClick={() => setShowSidebar(false)}
                className="hidden lg:block text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full transition-colors"
                aria-label="Close sidebar"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {/* Mobile close button */}
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full transition-colors"
                aria-label="Close sidebar"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
            <ConversationList
              selectedId={selectedId}
              onSelectConversation={handleSelectConversation}
            />
          </div>
        </div>
      </aside>

      {/* Floating button when sidebar closed on desktop */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="fixed left-4 top-4 z-50 hidden lg:flex w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-lg items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
          title="Open chats"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="text-gray-700 dark:text-gray-300"
          >
            <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      )}

      {/* Main area */}
      <main
        className={`
          flex-1 flex flex-col min-w-0 bg-gray-100 dark:bg-gray-950
          transition-margin duration-500 ease-out
          ${showSidebar ? "lg:ml-80" : "lg:ml-0"}
        `}
      >
        <div className="flex-1 flex justify-center h-full px-4 sm:px-6 lg:px-8">
          <div className="w-full h-full max-w-4xl xl:max-w-5xl bg-white dark:bg-gray-900 rounded-2xl lg:rounded-none lg:border-x border-gray-200 dark:border-gray-800 flex flex-col relative shadow-sm lg:shadow-lg">
            {selectedId ? (
              <ChatWindow
                conversationId={selectedId}
                conversation={selectedConv}
                onOpenInfo={() => setShowInfoPanel(true)}
                onOpenSidebar={() => setShowSidebar(false)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <svg
                    width="28"
                    height="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25-9 3.694-9 8.25c0 1.618.504 3.12 1.365 4.365L3 20.25l4.365-1.365A8.947 8.947 0 0012 20.25z" />
                  </svg>
                </div>
                <p className="text-sm font-light text-gray-500 dark:text-gray-400 tracking-wide max-w-xs">
                  Select a thread to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Info Panel */}
      {showInfoPanel && selectedConv?.isGroup && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 sm:hidden"
            onClick={() => setShowInfoPanel(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl animate-in slide-in-from-right duration-500">
            <GroupInfoPanel
              conversation={selectedConv}
              onClose={() => setShowInfoPanel(false)}
              onUpdate={setSelectedConv}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatPage;