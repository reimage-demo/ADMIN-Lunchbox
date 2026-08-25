import { useState } from "react";

const formatPreviewDate = (value) => {
  if (!value) return "Special date";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
};

export default function EventEditor({ event, onClose, onSave }) {
  const isEditing = Boolean(event?._id);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(event?.imageUrl || "");
  const [title, setTitle] = useState(event?.title || "");
  const [date, setDate] = useState(event?.date || "");
  const [startTime, setStartTime] = useState(event?.startTime || "");
  const [endTime, setEndTime] = useState(event?.endTime || "");
  const [description, setDescription] = useState(event?.description || "");
  const [published, setPublished] = useState(event?.isPublished ?? true);

  async function submit(submitEvent) {
    submitEvent.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(submitEvent.currentTarget);
    const file = data.get("image");
    try {
      if (
        file?.size &&
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      )
        throw new Error("Please upload a JPG, PNG or WebP image.");
      if (file?.size > 10 * 1024 * 1024)
        throw new Error("Special images must be 10 MB or smaller.");
      await onSave({
        id: event?._id,
        title: title.trim(),
        date,
        startTime: startTime.trim(),
        endTime: endTime.trim() || undefined,
        description: description.trim(),
        isPublished: published,
        file,
        imageUrl: event?.imageUrl,
        imageStorageId: event?.imageStorageId,
        removeImage: data.get("removeImage") === "on",
      });
    } catch (err) {
      setError(
        err?.data?.message || err?.message || "Could not save this special.",
      );
    } finally {
      setBusy(false);
    }
  }

  function chooseImage(changeEvent) {
    const file = changeEvent.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="modal-backdrop">
      <dialog className="editor-dialog event-editor guided-editor" open>
        <button className="dialog-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <header className="editor-heading">
          <p className="eyebrow dark">Specials editor</p>
          <h2>{isEditing ? "Edit special" : "Create a special"}</h2>
          <p>Add the essentials once, preview them, and publish when ready.</p>
        </header>

        <form onSubmit={submit}>
          <div className="guided-editor-layout">
            <div className="guided-editor-main">
              <section className="editor-section">
                <div className="editor-section-title">
                  <b>1</b><span><strong>Special details</strong><small>Use the same wording customers will see on the website.</small></span>
                </div>
                <label>
                  Special name
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Friday Night Live" required />
                </label>
                <div className="form-three event-time-grid">
                  <label>
                    Date
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                  </label>
                  <label>
                    Start time
                    <input value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="8:00 PM" required />
                  </label>
                  <label>
                    <span className="field-label">
                      End time <small className="optional-label">Optional</small>
                    </span>
                    <input value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="11:00 PM" />
                  </label>
                </div>
                <label>
                  Description
                  <textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell guests what is happening and why they should come." required />
                  <span className="field-count">{description.length}/240 recommended characters</span>
                </label>
              </section>

              <section className="editor-section">
                <div className="editor-section-title">
                  <b>2</b><span><strong>Special photo or flyer</strong><small>Automatically resized and converted to a lightweight WebP.</small></span>
                </div>
                <div className="menu-image-field improved-image-field">
                  <div className={`menu-image-preview ${preview ? "has-image" : ""}`}>
                    {preview ? <img src={preview} alt="Special preview" /> : <span>Add a special photo or flyer</span>}
                  </div>
                  <div>
                    <label className="file-button-label">
                      Choose image
                      <input name="image" type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseImage} />
                    </label>
                    <span className="hint">JPG, PNG or WebP, up to 10 MB.</span>
                    {isEditing && event?.imageUrl && (
                      <label className="remove-image"><input name="removeImage" type="checkbox" /> Remove current photo</label>
                    )}
                  </div>
                </div>
              </section>

              <section className="editor-section publish-section">
                <div className="editor-section-title">
                  <b>3</b><span><strong>Publish</strong><small>Draft specials stay in the admin portal but remain hidden from customers.</small></span>
                </div>
                <label className="switch-label publish-switch">
                  <span><strong>{published ? "Published on website" : "Saved as a draft"}</strong><small>{published ? "Customers can see this special" : "Only admins can see this special"}</small></span>
                  <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                  <span className="switch" />
                </label>
              </section>
            </div>

            <aside className="editor-summary event-summary">
              <p className="summary-label">Website preview</p>
              <div className="summary-image event-summary-image">
                {preview ? <img src={preview} alt="" /> : <span>Special image</span>}
              </div>
              <span className="summary-category">{published ? "Published" : "Draft"}</span>
              <h3>{title || "Special name"}</h3>
              <strong>{formatPreviewDate(date)}</strong>
              <p className="summary-time">{startTime || "Start time"}{endTime ? ` – ${endTime}` : ""}</p>
              <p>{description || "The special description appears here."}</p>
            </aside>
          </div>

          <p className="form-message">{error}</p>
          <div className="editor-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button className="primary-button" disabled={busy}>{busy ? "Saving…" : published ? "Save and publish" : "Save draft"}</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
