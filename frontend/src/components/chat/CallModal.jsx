import { useEffect, useRef } from "react";

const CallModal = ({
  callState,
  localStream,
  remoteStream,
  onAnswer,
  onReject,
  onEnd,
}) => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Helper to determine title text
  const getTitle = () => {
    switch (callState.status) {
      case "ringing":
        return "📞 Incoming Call";
      case "calling":
        return "🔊 Calling...";
      case "connected":
        return "🎥 Call Connected";
      default:
        return "Call";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {getTitle()}
            </h3>
            {(callState.status === "connected" ||
              callState.status === "calling") && (
              <span className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                Live
              </span>
            )}
          </div>

          {/* Video area */}
          <div
            className={`grid gap-3 sm:gap-4 ${localStream && remoteStream ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
          >
            {localStream && (
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded-md backdrop-blur-sm">
                  You
                </span>
              </div>
            )}
            {remoteStream && (
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded-md backdrop-blur-sm">
                  Remote
                </span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-2">
            {callState.status === "ringing" && (
              <>
                <button
                  onClick={onAnswer}
                  className="flex items-center justify-center gap-2 min-w-[120px] px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full shadow-md transition-all duration-200 hover:shadow-lg active:scale-95"
                >
                  <span>📞</span> Answer
                </button>
                <button
                  onClick={onReject}
                  className="flex items-center justify-center gap-2 min-w-[120px] px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full shadow-md transition-all duration-200 hover:shadow-lg active:scale-95"
                >
                  <span>❌</span> Reject
                </button>
              </>
            )}
            {(callState.status === "calling" ||
              callState.status === "connected") && (
              <button
                onClick={onEnd}
                className="flex items-center justify-center gap-2 min-w-[120px] px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full shadow-md transition-all duration-200 hover:shadow-lg active:scale-95"
              >
                <span>🔴</span> End Call
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
