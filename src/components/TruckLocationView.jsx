import { useEffect, useMemo, useRef, useState } from "react";
import { locationPayload, locationError } from "../locationPayload";

const DEFAULT_LOCATION_NAME = "Lunch Box";
const DEFAULT_ADDRESS = "104 Baltimore St, Hartford, CT 06112";

const today = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type) => parts.find((entry) => entry.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
};

const emptyLocation = {
  locationName: DEFAULT_LOCATION_NAME,
  address: DEFAULT_ADDRESS,
  locationNotes: "",
  latitude: "",
  longitude: "",
  serviceDate: today(),
  startTime: "13:00",
  endTime: "23:00",
  status: "opening-soon",
  orderingOpen: false,
  schedulingEnabled: true,
  prepTimeMinutes: 25,
  doorDashUrl: "",
  uberEatsUrl: "",
};

const statusOptions = [
  ["open", "Open here now", "Customers can see that the truck is serving."],
  ["opening-soon", "Opening soon", "Show today’s stop before service begins."],
  ["moving", "Moving locations", "Pause pickup while the truck is on the road."],
  ["closed", "Closed for today", "Keep the stop visible but mark service closed."],
];

const checkinRequested =
  new URLSearchParams(window.location.search).get("checkin") === "1";
let automaticCheckinStarted = false;

export default function TruckLocationView({ location, onReverseGeocode, onSave }) {
  const [form, setForm] = useState(emptyLocation);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [addressAttribution, setAddressAttribution] = useState("");
  const formTouched = useRef(false);

  useEffect(() => {
    if (!location || formTouched.current) return;
    setForm({
      ...emptyLocation,
      ...location,
      locationNotes: location.locationNotes || "",
      latitude: location.latitude ?? "",
      longitude: location.longitude ?? "",
      doorDashUrl: location.doorDashUrl || "",
      uberEatsUrl: location.uberEatsUrl || "",
    });
  }, [location]);

  const mapsUrl = useMemo(() => {
    const query =
      form.latitude !== "" && form.longitude !== ""
        ? `${form.latitude},${form.longitude}`
        : form.address;
    return query
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
      : "";
  }, [form.address, form.latitude, form.longitude]);

  const nfcUrl = `${window.location.origin}${window.location.pathname}?view=location&checkin=1`;
  const update = (field, value) => {
    formTouched.current = true;
    setForm((current) => ({ ...current, [field]: value }));
  };

  function captureLocation() {
    setError("");
    setMessage("");
    if (!navigator.geolocation) {
      setError("This device cannot provide its location. Enter the address manually.");
      return;
    }
    formTouched.current = true;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const latitude = Number(coords.latitude.toFixed(6));
        const longitude = Number(coords.longitude.toFixed(6));
        setForm((current) => ({
          ...current,
          latitude,
          longitude,
        }));
        setMessage("Phone location captured. Finding the street address…");
        try {
          const result = await onReverseGeocode({ latitude, longitude });
          setForm((current) => ({ ...current, address: result.address }));
          setAddressAttribution(result.attribution || "");
          const accuracy = Math.round(coords.accuracy);
          setMessage(
            `Address found${Number.isFinite(accuracy) ? ` (GPS accuracy about ${accuracy} m)` : ""}. Confirm the address and map pin, then publish.`,
          );
        } catch (err) {
          setError(
            locationError(err, "The coordinates were captured, but the address lookup failed. Enter the address manually."),
          );
        } finally {
          setLocating(false);
        }
      },
      (positionError) => {
        const detail =
          positionError.code === positionError.PERMISSION_DENIED
            ? "Location permission was denied. Allow location access in this browser and try again."
            : positionError.code === positionError.TIMEOUT
              ? "The phone took too long to find its location. Move near a window and try again."
              : "The phone could not determine its location. Try again or enter the address manually.";
        setError(detail);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }

  useEffect(() => {
    if (!checkinRequested || automaticCheckinStarted) return;
    automaticCheckinStarted = true;
    captureLocation();
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (saving || locating) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await onSave(locationPayload(form));
      setMessage("Today’s truck location is live on the website.");
    } catch (err) {
      setError(locationError(err, "Location was not published. Check your connection and try again. If it keeps failing, sign in again."));
    } finally {
      setSaving(false);
    }
  }

  async function copyNfcLink() {
    setError("");
    setMessage("");
    try {
      await navigator.clipboard.writeText(nfcUrl);
      setMessage("NFC check-in link copied.");
    } catch {
      setError("Could not copy the link. Select and copy the NFC link manually.");
    }
  }

  return (
    <div className="location-admin-layout">
      <form className="location-admin-form" onSubmit={submit}>
        <section className="location-panel location-lead-panel">
          <div>
            <p className="eyebrow dark">Today’s service</p>
            <h2>Check in the truck</h2>
            <p>Capture the parked truck’s location, confirm the details, and publish one reliable pickup point.</p>
          </div>
          <button type="button" className="capture-location-button" onClick={captureLocation} disabled={locating || saving}>
            {locating ? "Finding the truck…" : "Use this phone’s location"}
          </button>
        </section>

        <section className="location-panel">
          <div className="location-section-heading"><b>1</b><div><h3>Where are you parked?</h3><p>Use a recognizable place name and the exact customer pickup address.</p></div></div>
          <div className="location-form-grid">
            <label>Location name<input value={form.locationName} onChange={(event) => update("locationName", event.target.value)} placeholder={DEFAULT_LOCATION_NAME} required /></label>
            <label>Street address<input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder={DEFAULT_ADDRESS} required /></label>
            <label className="location-wide">Pickup notes <span>Optional</span><input value={form.locationNotes} onChange={(event) => update("locationNotes", event.target.value)} placeholder="Parked near the south entrance" /></label>
            <label>Latitude<input type="number" step="any" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} placeholder="Captured from phone" /></label>
            <label>Longitude<input type="number" step="any" value={form.longitude} onChange={(event) => update("longitude", event.target.value)} placeholder="Captured from phone" /></label>
          </div>
          {addressAttribution && <small className="address-attribution">{addressAttribution}</small>}
          {mapsUrl && <a className="map-preview-link" href={mapsUrl} target="_blank" rel="noreferrer">Check this pin in Google Maps ↗</a>}
          <div className="location-publish-actions">
            <p>Confirm this address and publish it with the service hours and settings below.</p>
            <button type="submit" className="primary-button location-publish" disabled={saving || locating}>{saving ? "Publishing…" : "Confirm and publish location"}</button>
          </div>
        </section>

        <section className="location-panel">
          <div className="location-section-heading"><b>2</b><div><h3>When are you serving?</h3><p>These hours control the pickup information customers see.</p></div></div>
          <div className="location-time-grid">
            <label>Service date<input type="date" value={form.serviceDate} onChange={(event) => update("serviceDate", event.target.value)} required /></label>
            <label>Starts<input type="time" value={form.startTime} onChange={(event) => update("startTime", event.target.value)} required /></label>
            <label>Ends<input type="time" value={form.endTime} onChange={(event) => update("endTime", event.target.value)} required /></label>
            <label>ASAP prep time<input type="number" min="5" max="180" value={form.prepTimeMinutes} onChange={(event) => update("prepTimeMinutes", event.target.value)} required /></label>
          </div>
          <div className="location-switches">
            <label><input type="checkbox" checked={form.orderingOpen} onChange={(event) => update("orderingOpen", event.target.checked)} /><span><strong>Pickup ordering is open</strong><small>Customers can start an online pickup order.</small></span></label>
            <label><input type="checkbox" checked={form.schedulingEnabled} onChange={(event) => update("schedulingEnabled", event.target.checked)} /><span><strong>Scheduled pickup is available</strong><small>Customers can choose a later pickup time.</small></span></label>
          </div>
        </section>

        <section className="location-panel">
          <div className="location-section-heading"><b>3</b><div><h3>What is the truck doing?</h3><p>Choose the clearest live status for customers.</p></div></div>
          <div className="location-status-grid">
            {statusOptions.map(([value, label, description]) => <label key={value} className={form.status === value ? "selected" : ""}><input type="radio" name="truck-status" value={value} checked={form.status === value} onChange={() => update("status", value)} /><strong>{label}</strong><small>{description}</small></label>)}
          </div>
        </section>

        <section className="location-panel">
          <div className="location-section-heading"><b>4</b><div><h3>Delivery partners</h3><p>Paste the storefront links when DoorDash or Uber Eats is ready. Empty partners appear as coming soon.</p></div></div>
          <div className="location-form-grid">
            <label>DoorDash storefront <span>Optional</span><input type="url" value={form.doorDashUrl} onChange={(event) => update("doorDashUrl", event.target.value)} placeholder="https://www.doordash.com/store/..." /></label>
            <label>Uber Eats storefront <span>Optional</span><input type="url" value={form.uberEatsUrl} onChange={(event) => update("uberEatsUrl", event.target.value)} placeholder="https://www.ubereats.com/store/..." /></label>
          </div>
        </section>


      </form>

      {(saving || locating || error || message) && (
        <div className={`location-notification ${error ? "error" : ""}`}>
          <div role={error ? "alert" : "status"} aria-live={error ? "assertive" : "polite"} aria-atomic="true">
            <strong>{saving ? "Publishing location…" : locating ? "Finding your location…" : error ? "Action needed" : "Success"}</strong>
            <p>{saving ? "Please wait for confirmation." : error || message || "Waiting for the device’s location."}</p>
          </div>
          {!saving && !locating && <button type="button" aria-label="Dismiss notification" onClick={() => { setError(""); setMessage(""); }}>×</button>}
        </div>
      )}
      <aside className="location-admin-aside">
        <section className="location-panel nfc-panel">
          <p className="eyebrow dark">NFC shortcut</p>
          <h3>Tap, check in, publish.</h3>
          <p>Program the tag inside the truck with this protected admin link. A tap opens this screen and starts the phone’s location prompt automatically.</p>
          <code>{nfcUrl}</code>
          <button type="button" className="secondary-button" onClick={copyNfcLink}>Copy NFC check-in link</button>
          <small>Copy this link from the live admin site, not localhost. The operator must sign in, allow location access, confirm the address, and publish before anything changes publicly.</small>
        </section>
        <section className="location-panel location-preview-panel">
          <p className="eyebrow dark">Website preview</p>
          <span className={`location-preview-status status-${form.status}`}>{statusOptions.find(([value]) => value === form.status)?.[1]}</span>
          <h3>{form.locationName || "Today’s truck location"}</h3>
          <p>{form.address || "The confirmed address will appear here."}</p>
          {form.locationNotes && <small>{form.locationNotes}</small>}
          <strong>{form.startTime || "Start"}–{form.endTime || "End"}</strong>
        </section>
      </aside>
    </div>
  );
}
