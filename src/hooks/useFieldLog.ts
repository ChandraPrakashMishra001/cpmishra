import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Message } from "@/components/ChatInterface";

export interface FieldLog {
  id: string;
  title: string;
  crop_name: string | null;
  diagnosis_summary: string | null;
  messages: Message[];
  created_at: string;
  location: string | null;
  severity: string | null;
}

export const useFieldLog = () => {
  const [logs, setLogs] = useState<FieldLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("field_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch field logs:", error);
    } else {
      setLogs((data ?? []) as unknown as FieldLog[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const saveLog = useCallback(async (
    title: string,
    messages: Message[],
    cropName?: string,
    diagnosisSummary?: string,
    location?: string,
    severity?: string,
  ) => {
    const { error } = await supabase.from("field_logs").insert({
      title,
      messages: messages as unknown as Record<string, unknown>[],
      crop_name: cropName || null,
      diagnosis_summary: diagnosisSummary || null,
      location: location || null,
      severity: severity || null,
    });

    if (error) {
      toast.error("Failed to save field log");
      console.error(error);
      return false;
    }
    toast.success("Saved to Field History! 🌿");
    fetchLogs();
    return true;
  }, [fetchLogs]);

  const deleteLog = useCallback(async (id: string) => {
    const { error } = await supabase.from("field_logs").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete log");
      return;
    }
    toast.success("Log deleted");
    setLogs(prev => prev.filter(l => l.id !== id));
  }, []);

  return { logs, loading, saveLog, deleteLog, refetch: fetchLogs };
};
