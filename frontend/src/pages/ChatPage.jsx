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
    setShowSidebar(false); // Mobile par select karte hi sidebar close
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
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden font-sans relative text-gray-900 dark:text-gray-100">
      
      {/* 1. Backdrop Overlay (Mobile Only) */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] lg:hidden transition-opacity duration-300"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* 2. Sidebar Area */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-[50] w-72 lg:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
          ${showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:static lg:block"}
          ${!showSidebar && "lg:hidden"} 
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-5 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:scale-105 transition-transform"
                title="Home"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>
              <h2 className="text-xl font-bold tracking-tight">🔀SyncChat</h2>
            </div>
            
            {/* Close Button (All screens) */}
            <button
              onClick={() => setShowSidebar(false)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400"
              aria-label="Close sidebar"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Conversation List Container */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ConversationList
              selectedId={selectedId}
              onSelectConversation={handleSelectConversation}
            />
          </div>
        </div>
      </aside>

      {/* 3. Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-950 relative h-full">
        
        {/* Sidebar Toggle Button (Only visible when sidebar is closed) */}
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="fixed top-4 left-4 z-40 p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        )}

        {/* Chat Window Container */}
        <div className="flex-1 flex flex-col h-full w-full max-w-[1600px] mx-auto overflow-hidden">
          {selectedId ? (
            <ChatWindow
              conversationId={selectedId}
              conversation={selectedConv}
              onOpenInfo={() => setShowInfoPanel(true)}
              onOpenSidebar={() => setShowSidebar(true)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 mb-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center shadow-sm">
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-blue-500">
                  <path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25-9 3.694-9 8.25c0 1.618.504 3.12 1.365 4.365L3 20.25l4.365-1.365A8.947 8.947 0 0012 20.25z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Welcome to SyncChat</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                Select a conversation from the sidebar to start messaging.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* 4. Info Panel (Right Side) */}
      {showInfoPanel && selectedConv?.isGroup && (
        <>
          {/* Info Panel Backdrop for Mobile */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] sm:hidden"
            onClick={() => setShowInfoPanel(false)}
          />
          <div className="fixed inset-y-0 right-0 z-[60] w-full sm:w-80 lg:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl animate-in slide-in-from-right duration-300">
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