import { useRef, useState } from "react";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Loader2,
  Sprout,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  type JourneyEntry,
} from "@/hooks/usePlantJourney";
import { readGrowthPhoto, predictYield } from "@/lib/journeyAi";

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

  const [form, setForm] = useState({ crop: "", variety: "", sownOn: today(), location: "" });
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    if (!form.crop.trim()) {
      toast.error("Enter the crop name first");
      return;
    }
    createJourney(form);
    setForm({ crop: "", variety: "", sownOn: today(), location: "" });
    toast.success("Journey started 🌱");
  };

  const handlePhoto = async (file: File | undefined) => {
    if (!file || !active) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Photo must be under 10MB");
      return;
    }
    setUploading(true);
    try {
      const image = await downscaleImage(file);
      const date = new Date().toISOString();
      const entry: JourneyEntry = {
        id: crypto.randomUUID(),
        date,
        image,
        note: note.trim(),
        reading: null,
        analyzing: true,
      };
      addEntry(active.id, entry);
      setNote("");

      if (!navigator.onLine) {
        patchEntry(active.id, entry.id, {
          analyzing: false,
          reading: "Saved offline — reading will be added when you are back online.",
        });
        toast.success("Photo saved on device 📴");
        return;
      }

      const dayNumber = daysBetween(active.sownOn, date);
      const reading = await readGrowthPhoto({
        image,
        crop: active.crop,
        variety: active.variety,
        dayNumber,
        note: entry.note,
      });
      patchEntry(active.id, entry.id, { reading, analyzing: false });
      toast.success("Check-in recorded 🌿");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add the photo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  };

  const handlePredict = async () => {
    if (!active) return;
    if (active.entries.length === 0) {
      toast.error("Add at least one photo first");
      return;
    }
    setPredicting(true);
    try {
      const prediction = await predictYield({
        crop: active.crop,
        variety: active.variety,
        location: active.location,
        sownOn: active.sownOn,
        timeline: active.entries.map((e) => ({
          day: daysBetween(active.sownOn, e.date),
          date: e.date,
          note: e.note,
          reading: e.reading,
        })),
      });
      patchJourney(active.id, { prediction, predictedAt: new Date().toISOString() });
      toast.success("Forecast ready");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not build the forecast");
    } finally {
      setPredicting(false);
    }
  };

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
                    <p className="mb-3 text-xs text-muted-foreground">
                      Take the photo from the same distance and angle each time for a comparable timeline.
                    </p>
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
                    <h2 className="mb-3 font-display text-lg font-semibold">
                      Growth timeline ({active.entries.length} check-in
                      {active.entries.length === 1 ? "" : "s"})
                    </h2>
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
                      <Button onClick={handlePredict} disabled={predicting}>
                        {predicting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <TrendingUp className="mr-2 h-4 w-4" />
                        )}
                        {active.prediction ? "Refresh forecast" : "Predict growth & yield"}
                      </Button>
                    </div>
                    {active.prediction ? (
                      <>
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
