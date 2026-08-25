import { useState } from "react";
import CurrencyInput from "./CurrencyInput";

const money = (cents) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(cents || 0) / 100);

const newOption = (sortOrder = 1) => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  price: 0,
  isAvailable: true,
  sortOrder,
});

export default function OptionGroupEditor({ group, count, onClose, onSave }) {
  const isEditing = Boolean(group?._id);
  const [name, setName] = useState(group?.name || "");
  const [description, setDescription] = useState(group?.description || "");
  const [selectionMode, setSelectionMode] = useState(
    group?.selectionMode || "single",
  );
  const [required, setRequired] = useState(Boolean(group?.minSelections));
  const [maxSelections, setMaxSelections] = useState(
    group?.maxSelections || 1,
  );
  const [available, setAvailable] = useState(group?.isAvailable ?? true);
  const [options, setOptions] = useState(
    group?.options?.length
      ? group.options.map((option) => ({
          ...option,
        }))
      : [newOption()],
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const effectiveMax =
    selectionMode === "single"
      ? 1
      : Math.min(Math.max(1, Number(maxSelections)), options.length || 1);

  const updateOption = (index, field, value) =>
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [field]: value } : option,
      ),
    );

  function moveOption(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= options.length) return;
    setOptions((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await onSave({
        id: group?._id,
        name: name.trim(),
        description: description.trim(),
        selectionMode,
        minSelections: required ? 1 : 0,
        maxSelections: effectiveMax,
        isAvailable: available,
        sortOrder: Number(data.get("sortOrder")),
        options: options.map((option, index) => ({
          ...option,
          name: option.name.trim(),
          description: option.description.trim(),
          price: option.price,
          sortOrder: index + 1,
        })),
      });
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.message ||
          "Could not save this option group.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <dialog className="editor-dialog pricing-editor guided-editor" open>
        <button className="dialog-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <header className="editor-heading">
          <p className="eyebrow dark">Pricing & options</p>
          <h2>{isEditing ? "Edit" : "Create"} a customer choice</h2>
          <p>
            Build one reusable question, then attach it to any menu item from the
            Menu editor.
          </p>
        </header>

        <form onSubmit={submit}>
          <div className="guided-editor-layout">
            <div className="guided-editor-main">
              <section className="editor-section">
                <div className="editor-section-title">
                  <b>1</b><span><strong>Name the choice</strong><small>Write it exactly as customers should see it.</small></span>
                </div>
                <div className="form-two">
                  <label>
                    Customer-facing question
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Choose your spirit"
                      required
                    />
                  </label>
                  <label>
                    Display order
                    <input
                      name="sortOrder"
                      type="number"
                      min="0"
                      defaultValue={group?.sortOrder ?? count + 1}
                      required
                    />
                  </label>
                </div>
                <label>
                  Helpful instructions
                  <textarea
                    rows="2"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="One standard pour is included."
                  />
                </label>
              </section>

              <section className="editor-section">
                <div className="editor-section-title">
                  <b>2</b><span><strong>Set the rules</strong><small>Choose how customers are allowed to answer.</small></span>
                </div>
                <div className="choice-type-grid">
                  <button
                    type="button"
                    className={selectionMode === "single" ? "selected" : ""}
                    onClick={() => setSelectionMode("single")}
                  >
                    <strong>Choose one</strong>
                    <small>Best for spirit, size or mixer</small>
                  </button>
                  <button
                    type="button"
                    className={selectionMode === "multiple" ? "selected" : ""}
                    onClick={() => setSelectionMode("multiple")}
                  >
                    <strong>Choose multiple</strong>
                    <small>Best for extras and additional shots</small>
                  </button>
                </div>
                <div className="rule-controls">
                  <label className="switch-label">
                    Customer must answer
                    <input
                      type="checkbox"
                      checked={required}
                      onChange={(event) => setRequired(event.target.checked)}
                    />
                    <span className="switch" />
                  </label>
                  {selectionMode === "multiple" && (
                    <label>
                      Maximum choices
                      <input
                        type="number"
                        min="1"
                        max={Math.max(1, options.length)}
                        value={maxSelections}
                        onChange={(event) => setMaxSelections(event.target.value)}
                      />
                    </label>
                  )}
                  <label className="switch-label">
                    Available to customers
                    <input
                      type="checkbox"
                      checked={available}
                      onChange={(event) => setAvailable(event.target.checked)}
                    />
                    <span className="switch" />
                  </label>
                </div>
              </section>

              <section className="editor-section">
                <div className="editor-section-title option-title-row">
                  <b>3</b>
                  <span><strong>Add the choices</strong><small>The price is added to the item’s base price.</small></span>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setOptions((current) => [
                        ...current,
                        newOption(current.length + 1),
                      ])
                    }
                  >
                    + Add choice
                  </button>
                </div>
                <div className="option-editor-list">
                  {options.map((option, index) => (
                    <div className="option-editor-row" key={option.id}>
                      <span className="option-number">{index + 1}</span>
                      <input
                        aria-label={`Choice ${index + 1} name`}
                        value={option.name}
                        onChange={(event) =>
                          updateOption(index, "name", event.target.value)
                        }
                        placeholder="Vodka"
                        required
                      />
                      <input
                        aria-label={`Choice ${index + 1} description`}
                        value={option.description}
                        onChange={(event) =>
                          updateOption(index, "description", event.target.value)
                        }
                        placeholder="House vodka"
                      />
                      <label className="option-price-input">
                        <span>+$</span>
                        <CurrencyInput
                          aria-label={`Choice ${index + 1} additional price`}
                          value={option.price}
                          onChange={(price) =>
                            updateOption(index, "price", price)
                          }
                          required
                        />
                      </label>
                      <label className="option-available" title="Available">
                        <input
                          type="checkbox"
                          checked={option.isAvailable}
                          onChange={(event) =>
                            updateOption(
                              index,
                              "isAvailable",
                              event.target.checked,
                            )
                          }
                        />
                        On
                      </label>
                      <div className="option-row-actions">
                        <button type="button" onClick={() => moveOption(index, -1)} disabled={index === 0} aria-label="Move choice up">↑</button>
                        <button type="button" onClick={() => moveOption(index, 1)} disabled={index === options.length - 1} aria-label="Move choice down">↓</button>
                        <button
                          className="option-remove"
                          type="button"
                          aria-label={`Remove ${option.name || "choice"}`}
                          disabled={options.length === 1}
                          onClick={() =>
                            setOptions((current) =>
                              current.filter(
                                (_, optionIndex) => optionIndex !== index,
                              ),
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="editor-summary">
              <p className="summary-label">Customer preview</p>
              <h3>{name || "Choose your option"}</h3>
              <p>{description || "Your instructions will appear here."}</p>
              <span className="summary-rule">
                {required ? "Required" : "Optional"} · {selectionMode === "single" ? "Choose one" : `Choose up to ${effectiveMax}`}
              </span>
              <div className="summary-options">
                {options.filter((option) => option.name).map((option) => (
                  <div key={option.id}>
                    <span>{option.name}</span>
                    <strong>{option.price ? `+${money(option.price)}` : "Included"}</strong>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <p className="form-message">{error}</p>
          <div className="editor-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" disabled={busy}>
              {busy ? "Saving…" : "Save option group"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
