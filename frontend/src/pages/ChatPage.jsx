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
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden font-sans relative text-gray-900 dark:text-gray-100 selection:bg-blue-100 dark:selection:bg-blue-900/30">
      
      {/* 1. Backdrop Overlay (Mobile Only) - Added Fade Animation */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] lg:hidden transition-all duration-300 opacity-100"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* 2. Sidebar - Added ease-in-out and Shadow Transitions */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-[50] w-72 lg:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          ${showSidebar ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0 lg:static lg:block"}
          ${!showSidebar && "lg:hidden opacity-0 lg:opacity-100"} 
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-5 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 group">
              <Link
                to="/"
                className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:rotate-12 transition-all duration-300"
                title="Home"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>
              <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                SyncChat
              </h2>
            </div>
            
            <button
              onClick={() => setShowSidebar(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all active:scale-90 text-gray-400 hover:text-red-500"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

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
        
        {/* Animated Toggle Button */}
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="fixed top-4 left-4 z-40 p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-blue-500/10 transition-all duration-300 active:scale-90 animate-in slide-in-from-left-4 fade-in"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-blue-500">
              <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        )}

        <div className="flex-1 flex flex-col h-full w-full max-w-[1600px] mx-auto overflow-hidden transition-all duration-500">
          {selectedId ? (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
              <ChatWindow
                conversationId={selectedId}
                conversation={selectedConv}
                onOpenInfo={() => setShowInfoPanel(true)}
                onOpenSidebar={() => setShowSidebar(true)}
              />
            </div>
          ) : (
            /* Empty State with Soft Animation */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-700">
              <div className="w-24 h-24 mb-8 rounded-[2rem] bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 animate-bounce-slow">
                <svg width="40" height="40" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25-9 3.694-9 8.25c0 1.618.504 3.12 1.365 4.365L3 20.25l4.365-1.365A8.947 8.947 0 0012 20.25z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight">Connect Instantly</h3>
              <p className="text-base text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed font-light">
                Pick a friend from the list or start a new group conversation to get started.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* 4. Info Panel - Enhanced Slide and Blur */}
      {showInfoPanel && selectedConv?.isGroup && (
        <>
          <div
            className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[55] lg:hidden transition-opacity duration-300"
            onClick={() => setShowInfoPanel(false)}
          />
          <div className="fixed inset-y-0 right-0 z-[60] w-full sm:w-80 lg:w-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-l border-gray-200 dark:border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.1)] animate-in slide-in-from-right duration-500 ease-out">
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