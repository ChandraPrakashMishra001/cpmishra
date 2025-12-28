import { HelmetProvider, Helmet } from "react-helmet-async";
import LiaAvatar from "@/components/LiaAvatar";
import ChatInterface from "@/components/ChatInterface";
import { useLiaChat } from "@/hooks/useLiaChat";

const Index = () => {
  const { messages, sendMessage, isTyping, currentEmotion, isTalking } = useLiaChat();

  return (
    <HelmetProvider>
      <Helmet>
        <title>Lia - Your Anime AI Companion</title>
        <meta name="description" content="Chat with Lia, your friendly anime AI companion. Have meaningful conversations with an expressive virtual friend." />
      </Helmet>

      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Avatar Section */}
        <div className="lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-12 relative">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 bg-lia-pink/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-lia-purple/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-lia-blue/10 rounded-full blur-2xl" />
          </div>

          {/* Title */}
          <div className="text-center mb-8 z-10">
            <h1 className="text-5xl lg:text-6xl font-display font-bold text-gradient mb-2">
              Lia
            </h1>
            <p className="text-muted-foreground font-body">
              Your AI Companion ✨
            </p>
          </div>

          {/* Avatar */}
          <div className="relative z-10">
            <LiaAvatar emotion={currentEmotion} isTalking={isTalking} />
          </div>

          {/* Status indicator */}
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground z-10">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Online & Ready to chat</span>
          </div>
        </div>

        {/* Chat Section */}
        <div className="lg:w-1/2 flex flex-col bg-card/20 backdrop-blur-sm border-l border-border/30 min-h-[50vh] lg:min-h-screen">
          <ChatInterface
            messages={messages}
            onSendMessage={sendMessage}
            isTyping={isTyping}
          />
        </div>
      </div>
    </HelmetProvider>
  );
};

export default Index;
