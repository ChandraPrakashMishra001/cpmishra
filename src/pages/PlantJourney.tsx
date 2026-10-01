import { useCallback, useEffect, useRef, useState } from "react";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CloudOff,
  ImagePlus,
  Loader2,
  RefreshCw,
  Sprout,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePlantJourney,
  downscaleImage,
  daysBetween,
  measureBrightness,
  MIN_FORECAST_CHECKINS,
  MIN_FORECAST_SPAN_DAYS,
  type JourneyEntry,
  type PlantJourney as Journey,
} from "@/hooks/usePlantJourney";
import { readGrowthPhoto, predictYield } from "@/lib/journeyAi";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const today = () => new Date().toISOString().slice(0, 10);

const PlantJourney = () => {
  const {
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
  } = usePlantJourney();

  const isOnline = useOnlineStatus();
  const [form, setForm] = useState({ crop: "", variety: "", sownOn: today(), location: "" });
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [consistencyWarning, setConsistencyWarning] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const readingNow = useRef<Set<string>>(new Set());

  const handleCreate = () => {
    if (!form.crop.trim()) {
      toast.error("Enter the crop name first");
      return;
    }
    createJourney(form);
    setForm({ crop: "", variety: "", sownOn: today(), location: "" });
    toast.success("Journey started 🌱");
  };

  /** Read one entry's photo; on failure leave it marked as waiting. */
  const readEntry = useCallback(
    async (journey: Journey, entry: JourneyEntry) => {
      if (readingNow.current.has(entry.id)) return false;
      readingNow.current.add(entry.id);
      patchEntry(journey.id, entry.id, { analyzing: true });
      try {
        const reading = await readGrowthPhoto({
          image: entry.image,
          crop: journey.crop,
          variety: journey.variety,
          dayNumber: daysBetween(journey.sownOn, entry.date),
          note: entry.note,
        });
        patchEntry(journey.id, entry.id, { reading, analyzing: false, pendingReading: false });
        return true;
      } catch {
        patchEntry(journey.id, entry.id, { analyzing: false, pendingReading: true });
        return false;
      } finally {
        readingNow.current.delete(entry.id);
      }
    },
    [patchEntry],
  );

  // Auto-read queued check-ins when the connection returns (sequentially).
  useEffect(() => {
    if (!isOnline) return;
    const pending = journeys.flatMap((j) =>
      j.entries.filter((e) => e.pendingReading && !e.analyzing).map((e) => ({ j, e })),
    );
    if (pending.length === 0) return;
    let cancelled = false;
    (async () => {
      let done = 0;
      for (const { j, e } of pending) {
        if (cancelled) break;
        if (await readEntry(j, e)) done++;
        else break; // stop on first failure; retry next reconnect / manual
      }
      if (done > 0) toast.success(`${done} offline check-in${done > 1 ? "s" : ""} read 🌿`);
    })();
    return () => {
      cancelled = true;
    };
    // run only on connectivity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const lastEntry = active?.entries[active.entries.length - 1];

  const handlePhoto = async (file: File | undefined) => {
    if (!file || !active) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Photo must be under 10MB");
      return;
    }
    setUploading(true);
    try {
      const image = await downscaleImage(file);
      const brightness = await measureBrightness(image);
      const prev = active.entries[active.entries.length - 1];
      if (prev?.brightness != null && prev.brightness >= 0 && brightness >= 0) {
        const diff = Math.abs(brightness - prev.brightness) / Math.max(prev.brightness, 1);
        setConsistencyWarning(
          diff > 0.35
            ? `Lighting differs a lot from the last photo (${brightness > prev.brightness ? "brighter" : "darker"}). Readings may look different for that reason, not the plant. Try the same time of day.`
            : null,
        );
      } else setConsistencyWarning(null);

      const date = new Date().toISOString();
      const entry: JourneyEntry = {
        id: crypto.randomUUID(),
        date,
        image,
        note: note.trim(),
        reading: null,
        analyzing: false,
        pendingReading: true,
        brightness,
      };
      addEntry(active.id, entry);
      setNote("");

      if (!navigator.onLine) {
        toast.success("Photo saved on device 📴 — it will be read when you're online");
        return;
      }
      const ok = await readEntry(active, entry);
      if (ok) toast.success("Check-in recorded 🌿");
      else toast.warning("Photo saved — reading failed, will retry automatically");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add the photo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  };

  const basisOf = (j: Journey) => {
    const count = j.entries.length;
    const spanDays = count > 1 ? daysBetween(j.entries[0].date, j.entries[count - 1].date) : 0;
    const early = count < MIN_FORECAST_CHECKINS || spanDays < MIN_FORECAST_SPAN_DAYS;
    return { count, spanDays, early };
  };

  const handlePredict = async () => {
    if (!active) return;
    if (active.entries.length === 0) {
      toast.error("Add at least one photo first");
      return;
    }
    const basis = basisOf(active);
    setPredicting(true);
    try {
      const prediction = await predictYield({
        crop: active.crop,
        variety: active.variety,
        location: active.location,
        sownOn: active.sownOn,
        early: basis.early,
        spanDays: basis.spanDays,
        timeline: active.entries.map((e) => ({
          day: daysBetween(active.sownOn, e.date),
          date: e.date,
          note: e.note,
          reading: e.pendingReading ? null : e.reading,
        })),
      });
      patchJourney(active.id, {
        prediction,
        predictedAt: new Date().toISOString(),
        predictionBasis: basis,
      });
      toast.success(basis.early ? "Early observation ready" : "Forecast ready");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not build the forecast");
    } finally {
      setPredicting(false);
    }
  };

  const pendingCount = active?.entries.filter((e) => e.pendingReading).length ?? 0;
  const currentBasis = active ? basisOf(active) : null;

  return (
    <HelmetProvider>
      <Helmet>
        <title>Plant Journey — Growth Timeline &amp; Yield Forecast | BloomSense</title>
        <meta
          name="description"
          content="Photograph your seedling each day and let Amanai track its growth timeline, flag stress early, and forecast the likely yield and harvest window."
        />
      </Helmet>

      <main className="min-h-[100dvh] bg-background px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <header className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/" aria-label="Back to Amanai chat">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-gradient md:text-3xl">
                <Sprout className="h-6 w-6 text-primary" /> Plant Journey
              </h1>
              <p className="text-sm text-muted-foreground">
                Photograph the same plant each day. Amanai builds the growth timeline and forecasts the yield.
              </p>
            </div>
          </header>

          {/* Start a new journey */}
          <section className="mb-6 rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm">
            <h2 className="mb-3 font-display text-lg font-semibold">Start a new journey</h2>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="crop">Crop</Label>
                <Input
                  id="crop"
                  value={form.crop}
                  placeholder="Tomato"
                  onChange={(e) => setForm({ ...form, crop: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="variety">Variety</Label>
                <Input
                  id="variety"
                  value={form.variety}
                  placeholder="Arka Rakshak"
                  onChange={(e) => setForm({ ...form, variety: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sownOn">Sown on</Label>
                <Input
                  id="sownOn"
                  type="date"
                  value={form.sownOn}
                  max={today()}
                  onChange={(e) => setForm({ ...form, sownOn: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Field / village</Label>
                <Input
                  id="location"
                  value={form.location}
                  placeholder="Cuttack, Odisha"
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>
            <Button className="mt-3" onClick={handleCreate}>
              <Sprout className="mr-2 h-4 w-4" /> Start journey
            </Button>
          </section>

          {journeys.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              No journeys yet. Start one above, then add a photo every few days.
            </p>
          ) : (
            <>
              {/* Journey picker */}
              <section className="mb-6 flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] flex-1 space-y-1.5">
                  <Label htmlFor="journey">Active journey</Label>
                  <Select value={activeId ?? undefined} onValueChange={setActiveId}>
                    <SelectTrigger id="journey">
                      <SelectValue placeholder="Choose a journey" />
                    </SelectTrigger>
                    <SelectContent>
                      {journeys.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.crop}
                          {j.variety ? ` · ${j.variety}` : ""} · sown{" "}
                          {new Date(j.sownOn).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {active && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      deleteJourney(active.id);
                      toast.success("Journey removed");
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete journey
                  </Button>
                )}
              </section>

              {active && (
                <>
                  {/* Daily check-in */}
                  <section className="mb-6 rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm">
                    <h2 className="mb-1 font-display text-lg font-semibold">
                      Today&apos;s check-in — day {daysBetween(active.sownOn, new Date().toISOString())}
                    </h2>
                    <div className="mb-3 flex gap-3 rounded-lg border border-border/50 bg-muted/40 p-3">
                      {lastEntry && (
                        <figure className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border-2 border-dashed border-primary/60">
                          <img
                            src={lastEntry.image}
                            alt="Last check-in, use it to match framing"
                            className="h-full w-full object-cover opacity-60"
                          />
                          <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-primary/70" />
                          <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-primary/70" />
                        </figure>
                      )}
                      <div className="text-xs text-muted-foreground">
                        <p className="mb-1 font-semibold text-foreground">
                          {lastEntry ? "Match the last photo's framing" : "Set the framing you'll repeat"}
                        </p>
                        <ul className="list-disc space-y-0.5 pl-4">
                          <li>Same spot, same height (phone at plant mid-height), plant centred.</li>
                          <li>Same time of day, no direct sun behind the plant.</li>
                          <li>Keep a fixed reference (stake, bottle, hand) in frame for size.</li>
                        </ul>
                      </div>
                    </div>
                    {consistencyWarning && (
                      <p className="mb-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        {consistencyWarning}
                      </p>
                    )}
                    <Textarea
                      value={note}
                      maxLength={300}
                      placeholder="Anything you noticed today — watering, weather, spraying, damage…"
                      onChange={(e) => setNote(e.target.value)}
                      className="mb-3 text-base"
                    />
                    <input
                      ref={cameraRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handlePhoto(e.target.files?.[0])}
                    />
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhoto(e.target.files?.[0])}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => cameraRef.current?.click()} disabled={uploading}>
                        {uploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="mr-2 h-4 w-4" />
                        )}
                        Take photo
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                      >
                        <ImagePlus className="mr-2 h-4 w-4" /> Upload photo
                      </Button>
                    </div>
                  </section>

                  {/* Timeline */}
                  <section className="mb-6">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-display text-lg font-semibold">
                        Growth timeline ({active.entries.length} check-in
                        {active.entries.length === 1 ? "" : "s"})
                      </h2>
                      {pendingCount > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <CloudOff className="h-3 w-3" /> {pendingCount} waiting to read
                          {isOnline ? "" : " · offline"}
                        </Badge>
                      )}
                    </div>
                    {active.entries.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                        No photos yet for this plant.
                      </p>
                    ) : (
                      <ol className="space-y-3 border-l-2 border-primary/30 pl-4">
                        {active.entries.map((entry) => (
                          <li key={entry.id} className="relative">
                            <span className="absolute -left-[22px] top-4 h-3 w-3 rounded-full bg-primary" />
                            <article className="rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-sm">
                              <div className="flex gap-3">
                                <img
                                  src={entry.image}
                                  alt={`${active.crop} on day ${daysBetween(active.sownOn, entry.date)} after sowing`}
                                  loading="lazy"
                                  className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold">
                                      Day {daysBetween(active.sownOn, entry.date)} ·{" "}
                                      <span className="font-normal text-muted-foreground">
                                        {new Date(entry.date).toLocaleDateString()}
                                      </span>
                                    </p>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      aria-label="Delete this check-in"
                                      onClick={() => deleteEntry(active.id, entry.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                  {entry.note && (
                                    <p className="mb-1 text-xs italic text-muted-foreground">
                                      “{entry.note}”
                                    </p>
                                  )}
                                  {entry.analyzing ? (
                                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading the
                                      photo…
                                    </p>
                                  ) : entry.pendingReading ? (
                                    <div className="rounded-md border border-dashed border-primary/50 bg-primary/5 p-2">
                                      <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-primary">
                                        <CloudOff className="h-3.5 w-3.5" /> Photo saved · waiting to read
                                      </p>
                                      <p className="mb-2 text-xs text-muted-foreground">
                                        {isOnline
                                          ? "The reading didn't finish. It retries automatically, or read it now."
                                          : "Taken offline. Amanai reads it automatically when you're back online."}
                                      </p>
                                      {isOnline && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-xs"
                                          onClick={() => readEntry(active, entry)}
                                        >
                                          <RefreshCw className="mr-1 h-3 w-3" /> Read now
                                        </Button>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                      {entry.reading}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </article>
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>

                  {/* Forecast */}
                  <section className="mb-10 rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-display text-lg font-semibold">Yield forecast</h2>
                      <Button onClick={handlePredict} disabled={predicting || !isOnline}>
                        {predicting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <TrendingUp className="mr-2 h-4 w-4" />
                        )}
                        {currentBasis?.early
                          ? "Get early observation"
                          : active.prediction
                            ? "Refresh forecast"
                            : "Predict growth & yield"}
                      </Button>
                    </div>
                    {currentBasis?.early && (
                      <p className="mb-3 text-xs text-muted-foreground">
                        A yield forecast unlocks after {MIN_FORECAST_CHECKINS} check-ins spread over at least{" "}
                        {MIN_FORECAST_SPAN_DAYS} days. You have {currentBasis.count} over {currentBasis.spanDays}{" "}
                        day{currentBasis.spanDays === 1 ? "" : "s"}.
                      </p>
                    )}
                    {pendingCount > 0 && (
                      <p className="mb-3 text-xs text-muted-foreground">
                        {pendingCount} photo{pendingCount > 1 ? "s are" : " is"} not read yet and will be left out.
                      </p>
                    )}
                    {active.prediction ? (
                      <>
                        {active.predictionBasis && (
                          <Badge variant={active.predictionBasis.early ? "outline" : "secondary"} className="mb-2">
                            {active.predictionBasis.early ? "Early observation" : "Forecast"} · based on{" "}
                            {active.predictionBasis.count} check-in{active.predictionBasis.count === 1 ? "" : "s"} over{" "}
                            {active.predictionBasis.spanDays} day{active.predictionBasis.spanDays === 1 ? "" : "s"}
                          </Badge>
                        )}
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {active.prediction}
                        </p>
                        {active.predictedAt && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Generated {new Date(active.predictedAt).toLocaleString()}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Add a few check-ins across the season, then ask for a forecast. Accuracy grows
                        with the number of photos.
                      </p>
                    )}
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </HelmetProvider>
  );
};

export default PlantJourney;
