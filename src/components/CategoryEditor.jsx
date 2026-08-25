import { useState } from "react";

export default function CategoryEditor({
  category,
  kind,
  count,
  onClose,
  onSave,
}) {
  const [name, setName] = useState(category?.name || "");
  const [available, setAvailable] = useState(category?.isAvailable ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave({
        id: category?._id,
        name: name.trim(),
        kind,
        isAvailable: available,
        sortOrder: category?.sortOrder ?? count + 1,
      });
    } catch (err) {
      setError(
        err?.data?.message || err?.message || "Could not save category.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <dialog className="editor-dialog category-editor" open>
        <button className="dialog-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <header className="editor-heading">
          <p className="eyebrow dark">
            {kind === "bottle" ? "Catering Trays" : "Menu"}
          </p>
          <h2>{category?._id ? "Edit" : "Add"} a category</h2>
          <p>Category names and order are shared with the customer menu.</p>
        </header>
        <form onSubmit={submit}>
          <label>
            Category name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={kind === "bottle" ? "Family Trays" : "Lunch Boxes"}
              required
              autoFocus
            />
          </label>
          <label className="switch-label category-visibility-switch">
            <span>
              <strong>Show on customer menu</strong>
              <small>Hiding a category hides all of its items together.</small>
            </span>
            <input
              type="checkbox"
              checked={available}
              onChange={(event) => setAvailable(event.target.checked)}
            />
            <span className="switch" />
          </label>
          <p className="form-message">{error}</p>
          <div className="editor-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="primary-button" disabled={busy}>
              {busy ? "Saving…" : "Save category"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
