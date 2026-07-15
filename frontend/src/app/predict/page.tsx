"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import VisualSelector, { Option } from "@/components/VisualSelector";
import { getProfile, saveProfile, SoilType, CropFocus, CROP_OPTIONS, SOIL_OPTIONS } from "@/lib/profile";
import { MapPin, Target, LocateFixed, ArrowRight, ArrowLeft, Loader2, Navigation } from "lucide-react";
import { getLocationWithLabel } from "@/lib/location";

const STEPS = ["Location", "Soil", "Crop", "Land Area"];

export default function PredictWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  
  // Data State
  const [locLabel, setLocLabel] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [soil, setSoil] = useState<SoilType | null>(null);
  const [crop, setCrop] = useState<CropFocus | null>(null);
  const [acres, setAcres] = useState<number | "">("");

  // Load from profile if available
  useEffect(() => {
    const p = getProfile();
    if (p.locationLabel) setLocLabel(p.locationLabel);
    if (p.soilType !== "Not Sure") setSoil(p.soilType);
    if (p.cropFocus !== "Mixed / General") setCrop(p.cropFocus);
    if (p.farmSizeAcres) setAcres(p.farmSizeAcres);
  }, []);

  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      const loc = await getLocationWithLabel();
      setLocLabel(loc.displayName);
      saveProfile({
        locationMode: "gps",
        savedLat: loc.lat,
        savedLon: loc.lon,
        locationLabel: loc.displayName,
        locationConfirmed: true,
      });
    } catch (err) {
      // ignore
    } finally {
      setIsLocating(false);
    }
  };

  const nextStep = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else submit();
  };
  const prevStep = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const submit = () => {
    // Save to profile and redirect to results
    if (soil) saveProfile({ soilType: soil });
    if (crop) saveProfile({ cropFocus: crop });
    if (typeof acres === "number") saveProfile({ farmSizeAcres: acres });

    // Redirect to results (we will pass as query param or just read profile)
    router.push("/predict/results");
  };

  const soilOptions: Option<SoilType>[] = SOIL_OPTIONS.map(s => ({
    value: s,
    label: s,
    icon: <Target size={24} />
  }));

  const cropOptions: Option<CropFocus>[] = CROP_OPTIONS.map(c => ({
    value: c,
    label: c,
    icon: <div style={{ fontSize: "1.5rem" }}>🌾</div>
  }));

  // Progress Bar
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <>
      <Navbar />
      <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh" }}>
        <div className="premium-mesh-glow-1" />
        <div className="premium-mesh-glow-2" />
        
        <main className="app-page-container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent-primary)" }}>
                Step {step + 1} of {STEPS.length}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{STEPS[step]}</div>
            </div>
            
            <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ 
                height: "100%", 
                width: `${progress}%`, 
                background: "var(--accent-primary)", 
                borderRadius: 99, 
                transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)" 
              }} />
            </div>
          </div>

          <div className="premium-glass-card app-card" style={{ padding: "32px 24px", minHeight: 400, display: "flex", flexDirection: "column" }}>
            
            {step === 0 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", animation: "fadeIn 0.3s ease-out" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: 8 }}>Where is your farm located?</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 32 }}>We use this to pull historical weather and hyper-local soil maps.</p>
                
                <div className="input-wrap" style={{ position: "relative" }}>
                  <span className="input-icon-left"><MapPin size={18} /></span>
                  <input 
                    type="text" 
                    className="input input-with-icon premium-input" 
                    placeholder="Enter city or village" 
                    value={locLabel} 
                    onChange={e => setLocLabel(e.target.value)} 
                    style={{ paddingRight: "48px", height: 56, fontSize: "1rem" }}
                  />
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    style={{
                      position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                      background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
                      borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--accent-primary)", cursor: isLocating ? "not-allowed" : "pointer",
                    }}
                  >
                    {isLocating ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Navigation size={18} />}
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", animation: "fadeIn 0.3s ease-out" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: 8 }}>What type of soil do you have?</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 24 }}>This helps calculate water retention and nutrient levels.</p>
                <div style={{ flex: 1, overflowY: "auto", paddingBottom: 16 }}>
                  <VisualSelector options={soilOptions} selected={soil} onSelect={setSoil} gridCols={2} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", animation: "fadeIn 0.3s ease-out" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: 8 }}>What crop are you planning?</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 24 }}>Select your primary crop focus for this season.</p>
                <div style={{ flex: 1, overflowY: "auto", paddingBottom: 16 }}>
                  <VisualSelector options={cropOptions} selected={crop} onSelect={setCrop} gridCols={2} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", animation: "fadeIn 0.3s ease-out" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)", marginBottom: 8 }}>How large is your farm?</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 32 }}>Enter the size of the area you are cultivating (in acres).</p>
                
                <div className="input-wrap" style={{ position: "relative" }}>
                  <span className="input-icon-left"><LocateFixed size={18} /></span>
                  <input 
                    type="number" 
                    className="input input-with-icon premium-input" 
                    placeholder="e.g. 5" 
                    value={acres} 
                    onChange={e => setAcres(e.target.value ? Number(e.target.value) : "")} 
                    style={{ height: 56, fontSize: "1.1rem" }}
                  />
                  <span style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", fontWeight: 600 }}>Acres</span>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{ display: "flex", gap: 12, marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--border-subtle)" }}>
              {step > 0 && (
                <button onClick={prevStep} className="btn btn-secondary" style={{ padding: "14px 20px" }}>
                  <ArrowLeft size={18} /> Back
                </button>
              )}
              <button 
                onClick={nextStep} 
                className="btn btn-primary" 
                style={{ flex: 1, padding: "14px 20px", display: "flex", justifyContent: "center", gap: 8, background: "var(--accent-primary)", color: "var(--bg-primary)", fontWeight: 700 }}
                disabled={
                  (step === 0 && !locLabel) ||
                  (step === 1 && !soil) ||
                  (step === 2 && !crop) ||
                  (step === 3 && !acres)
                }
              >
                {step === STEPS.length - 1 ? "Generate Forecast" : "Continue"} {step < STEPS.length - 1 && <ArrowRight size={18} />}
              </button>
            </div>
            
          </div>
        </main>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </>
  );
}
