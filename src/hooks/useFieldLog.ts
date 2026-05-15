import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, FIELD_LOGS_COLLECTION } from "@/integrations/firebase/client";
import { useFirebaseAuth } from "./useFirebaseAuth";
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
  const { user } = useFirebaseAuth();
  const [logs, setLogs] = useState<FieldLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Realtime subscription scoped to current user
  useEffect(() => {
    if (!user) {
      setLogs([]);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, FIELD_LOGS_COLLECTION),
      where("uid", "==", user.uid),
      orderBy("created_at", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: FieldLog[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = data.created_at as Timestamp | undefined;
          return {
            id: d.id,
            title: (data.title as string) ?? "Untitled Diagnosis",
            crop_name: (data.crop_name as string) ?? null,
            diagnosis_summary: (data.diagnosis_summary as string) ?? null,
            messages: (data.messages as Message[]) ?? [],
            created_at: ts?.toDate?.().toISOString() ?? new Date().toISOString(),
            location: (data.location as string) ?? null,
            severity: (data.severity as string) ?? null,
          };
        });
        setLogs(next);
        setLoading(false);
      },
      (err) => {
        console.error("Field logs subscription error:", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [user]);

  const saveLog = useCallback(
    async (
      title: string,
      messages: Message[],
      cropName?: string,
      diagnosisSummary?: string,
      location?: string,
      severity?: string,
    ) => {
      if (!user) {
        toast.error("Please sign in to save field logs");
        return false;
      }
      try {
        await addDoc(collection(db, FIELD_LOGS_COLLECTION), {
          uid: user.uid,
          title,
          messages: JSON.parse(JSON.stringify(messages)),
          crop_name: cropName || null,
          diagnosis_summary: diagnosisSummary || null,
          location: location || null,
          severity: severity || null,
          created_at: serverTimestamp(),
        });
        toast.success("Saved to Field History! 🌿");
        return true;
      } catch (err) {
        console.error("Failed to save field log:", err);
        toast.error("Failed to save field log");
        return false;
      }
    },
    [user],
  );

  const deleteLog = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, FIELD_LOGS_COLLECTION, id));
      toast.success("Log deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete log");
    }
  }, []);

  return { logs, loading, saveLog, deleteLog, refetch: () => {} };
};
