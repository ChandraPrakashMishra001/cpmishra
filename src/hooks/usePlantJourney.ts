import { useCallback, useEffect, useState } from "react";

export interface JourneyEntry {
  id: string;
  date: string; // ISO
  image: string; // downscaled data URL
  note: string;
  reading: string | null; // Amanai's observation for this photo
  analyzing?: boolean;
}

export interface PlantJourney {
  id: string;
  crop: string;
  variety: string;
  sownOn: string; // ISO date
  location: string;
  entries: JourneyEntry[];
  prediction: string | null;
  predictedAt: string | null;
  createdAt: string;
}

const STORAGE_KEY = "amanai_plant_journeys";
const MAX_JOURNEYS = 12;

const load = (): PlantJourney[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PlantJourney[]) : [];
  } catch {
    return [];
  }
};

const persist = (journeys: PlantJourney[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(journeys));
  } catch (err) {
    console.warn("Could not save plant journeys locally:", err);
  }
};

/** Downscale a photo so a full timeline still fits in local storage. */
export const downscaleImage = (file: File, maxSize = 640, quality = 0.7): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the photo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not open the photo"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Could not process the photo"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

export const daysBetween = (fromISO: string, toISO: string) =>
  Math.max(
    0,
    Math.round(
      (new Date(toISO).setHours(0, 0, 0, 0) - new Date(fromISO).setHours(0, 0, 0, 0)) / 86400000,
    ),
  );

export const usePlantJourney = () => {
  const [journeys, setJourneys] = useState<PlantJourney[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = load();
    setJourneys(loaded);
    setActiveId(loaded[0]?.id ?? null);
  }, []);

  const update = useCallback((next: PlantJourney[]) => {
    setJourneys(next);
    persist(next);
  }, []);

  const createJourney = useCallback(
    (data: { crop: string; variety: string; sownOn: string; location: string }) => {
      const journey: PlantJourney = {
        id: crypto.randomUUID(),
        crop: data.crop.trim(),
        variety: data.variety.trim(),
        sownOn: data.sownOn,
        location: data.location.trim(),
        entries: [],
        prediction: null,
        predictedAt: null,
        createdAt: new Date().toISOString(),
      };
      setJourneys((prev) => {
        const next = [journey, ...prev].slice(0, MAX_JOURNEYS);
        persist(next);
        return next;
      });
      setActiveId(journey.id);
      return journey.id;
    },
    [],
  );

  const deleteJourney = useCallback((id: string) => {
    setJourneys((prev) => {
      const next = prev.filter((j) => j.id !== id);
      persist(next);
      setActiveId((cur) => (cur === id ? next[0]?.id ?? null : cur));
      return next;
    });
  }, []);

  const patchJourney = useCallback((id: string, patch: Partial<PlantJourney>) => {
    setJourneys((prev) => {
      const next = prev.map((j) => (j.id === id ? { ...j, ...patch } : j));
      persist(next);
      return next;
    });
  }, []);

  const addEntry = useCallback((journeyId: string, entry: JourneyEntry) => {
    setJourneys((prev) => {
      const next = prev.map((j) =>
        j.id === journeyId
          ? { ...j, entries: [...j.entries, entry].sort((a, b) => (a.date < b.date ? -1 : 1)) }
          : j,
      );
      persist(next);
      return next;
    });
  }, []);

  const patchEntry = useCallback(
    (journeyId: string, entryId: string, patch: Partial<JourneyEntry>) => {
      setJourneys((prev) => {
        const next = prev.map((j) =>
          j.id === journeyId
            ? {
                ...j,
                entries: j.entries.map((e) => (e.id === entryId ? { ...e, ...patch } : e)),
              }
            : j,
        );
        persist(next);
        return next;
      });
    },
    [],
  );

  const deleteEntry = useCallback((journeyId: string, entryId: string) => {
    setJourneys((prev) => {
      const next = prev.map((j) =>
        j.id === journeyId ? { ...j, entries: j.entries.filter((e) => e.id !== entryId) } : j,
      );
      persist(next);
      return next;
    });
  }, []);

  const active = journeys.find((j) => j.id === activeId) ?? null;

  return {
    journeys,
    active,
    activeId,
    setActiveId,
    createJourney,
    deleteJourney,
    patchJourney,
    addEntry,
    patchEntry,
    deleteEntry,
    update,
  };
};
