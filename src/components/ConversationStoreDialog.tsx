import { useState, ReactNode } from "react";
import { Archive, Save, Trash2, MessageSquare, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { Message } from "@/components/ChatInterface";
import {
  MAX_SAVED_CONVERSATIONS,
  type SavedConversation,
} from "@/hooks/useSavedConversations";

interface ConversationStoreDialogProps {
  conversations: SavedConversation[];
  currentMessages: Message[];
  onSave: (messages: Message[]) => SavedConversation | null;
  onLoad: (messages: Message[]) => void;
  onDelete: (id: string) => void;
  trigger?: ReactNode;
}

const ConversationStoreDialog = ({
  conversations,
  currentMessages,
  onSave,
  onLoad,
  onDelete,
  trigger,
}: ConversationStoreDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    if (conversations.length >= MAX_SAVED_CONVERSATIONS) {
      toast.error(
        `Storage full (${MAX_SAVED_CONVERSATIONS} max). Delete an old conversation first.`,
      );
      return;
    }
    const entry = onSave(currentMessages);
    if (!entry) {
      toast.error("Nothing to save yet — start a conversation first.");
      return;
    }
    toast.success("Conversation saved 📚");
  };

  const handleLoad = (convo: SavedConversation) => {
    onLoad(convo.messages);
    setOpen(false);
    toast.success(`Loaded: ${convo.title}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            className="bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-primary/20 shadow-sm"
          >
            <Archive className="w-4 h-4 text-primary" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50 max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-primary" />
            Conversation Store
          </DialogTitle>
          <DialogDescription>
            Save up to {MAX_SAVED_CONVERSATIONS} conversations and reload them anytime.
            {" "}
            <span className="font-medium text-foreground">
              {conversations.length}/{MAX_SAVED_CONVERSATIONS} used
            </span>
          </DialogDescription>
        </DialogHeader>

        <Button onClick={handleSave} className="gap-2 shrink-0" size="sm">
          <Save className="w-4 h-4" />
          Save current conversation
        </Button>

        <ScrollArea className="flex-1 -mx-2 px-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
              <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
              <p>No saved conversations yet.</p>
              <p className="text-xs mt-1">Save your current chat to keep it for later.</p>
            </div>
          ) : (
            <ul className="space-y-2 py-2">
              {conversations.map((c) => (
                <li
                  key={c.id}
                  className="group rounded-lg border border-border/50 bg-background/40 p-3 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" title={c.title}>
                        {c.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {c.messages.length} messages ·{" "}
                        {formatDistanceToNow(new Date(c.savedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7 hover:bg-primary/20"
                        onClick={() => handleLoad(c)}
                        title="Load conversation"
                      >
                        <Download className="w-3.5 h-3.5 text-primary" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7 hover:bg-destructive/20"
                        onClick={() => {
                          onDelete(c.id);
                          toast.success("Deleted");
                        }}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationStoreDialog;
