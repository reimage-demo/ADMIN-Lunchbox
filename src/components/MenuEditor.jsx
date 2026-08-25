import { useState } from "react";
import CurrencyInput from "./CurrencyInput";
import { resolveMenuImageUrl } from "../imageUrl";

const money = (cents) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(cents || 0) / 100);

export default function MenuEditor({
  item,
  count,
  optionGroups,
  categories = [],
  onClose,
  onSave,
  bottleService = false,
}) {
  const isEditing = Boolean(item?._id);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(
    resolveMenuImageUrl(item?.imageUrl || ""),
  );
  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState(
    item?.category ||
      categories[0]?.name ||
      (bottleService ? "Catering Trays" : ""),
  );
  const [description, setDescription] = useState(item?.description || "");
  const [price, setPrice] = useState(item?.price ?? 0);
  const [available, setAvailable] = useState(item?.isAvailable ?? true);
  const [featured, setFeatured] = useState(item?.isFeatured ?? false);
  const [drinkOfNight, setDrinkOfNight] = useState(
    item?.isDrinkOfNight ?? false,
  );
  const [customDrink, setCustomDrink] = useState(
    bottleService ? false : (item?.isCustomDrink ?? false),
  );
  const [startingPrice, setStartingPrice] = useState(
    item?.showsStartingPrice ?? item?.isCustomDrink === true,
  );
  const [selectedGroups, setSelectedGroups] = useState(
    item?.optionGroupIds || [],
  );

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      if (customDrink && !selectedGroups.length)
        throw new Error(
          "Attach at least one pricing group to a customizable item.",
        );
      await onSave({
        id: item?._id,
        file: data.get("image"),
        imageUrl: item?.imageUrl,
        imageStorageId: item?.imageStorageId,
        removeImage: data.get("removeImage") === "on",
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price,
        accent: data.get("accent").trim() || undefined,
        isAvailable: available,
        isFeatured: featured,
        isDrinkOfNight: drinkOfNight,
        isCustomDrink: bottleService ? false : customDrink,
        isBottleService: bottleService,
        showsStartingPrice: startingPrice,
        optionGroupIds: selectedGroups,
        sortOrder: item?.sortOrder ?? count + 1,
        addOns: item?.addOns || [],
      });
    } catch (err) {
      setError(
        err?.data?.message || err?.message || "Could not save this menu item.",
      );
    } finally {
      setBusy(false);
    }
  }

  function chooseImage(event) {
    const file = event.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  function toggleGroup(groupId) {
    setSelectedGroups((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    );
  }

  return (
    <div className="modal-backdrop">
      <dialog className="editor-dialog menu-editor guided-editor" open>
        <button className="dialog-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <header className="editor-heading">
          <p className="eyebrow dark">
            {bottleService ? "Catering editor" : "Menu editor"}
          </p>
          <h2>
            {isEditing ? "Edit" : "Add"}{" "}
            {bottleService ? "a tray or package" : "an item"}
          </h2>
          <p>
            {bottleService
              ? "Set a fixed tray price, or attach choices for a customizable catering package."
              : "Everything customers need to decide, customize and order."}
          </p>
        </header>

        <form onSubmit={submit}>
          <div className="guided-editor-layout">
            <div className="guided-editor-main">
              <section className="editor-section">
                <div className="editor-section-title">
                  <b>1</b>
                  <span>
                    <strong>Item details</strong>
                    <small>
                      Use a short name and a clear ingredient description.
                    </small>
                  </span>
                </div>
                <div className="form-two">
                  <label>
                    {bottleService ? "Tray or package name" : "Item name"}
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Jerk Chicken Lunch Box"
                      required
                    />
                  </label>
                  <label>
                    Category
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      required
                    >
                      <option value="" disabled>
                        Select a category
                      </option>
                      {categories.map((entry) => (
                        <option key={entry._id} value={entry.name}>
                          {entry.name}
                          {entry.isAvailable ? "" : " (hidden)"}
                        </option>
                      ))}
                      {category &&
                        !categories.some(
                          (entry) => entry.name === category,
                        ) && <option value={category}>{category}</option>}
                    </select>
                  </label>
                </div>
                <label>
                  Ingredients / what it contains
                  <textarea
                    rows="3"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Jerk chicken, rice, cabbage and plantain."
                    required
                  />
                  <span className="field-count">
                    {description.length}/180 recommended characters
                  </span>
                </label>
                <div className="form-two">
                  <label>
                    Base price ($)
                    <CurrencyInput
                      value={price}
                      onChange={setPrice}
                      aria-label="Base price in dollars"
                      required
                    />
                    <span className="hint">Type 1995 for $19.95.</span>
                  </label>
                  <label>
                    Short internal tag
                    <input
                      name="accent"
                      defaultValue={item?.accent}
                      placeholder="Tropical"
                    />
                  </label>
                </div>
                <label className="starting-price-checkbox">
                  <input
                    type="checkbox"
                    checked={startingPrice}
                    onChange={(event) => setStartingPrice(event.target.checked)}
                  />
                  <span>
                    <strong>Use “Starting at” before the price</strong>
                    <small>
                      Use this only when attached choices can increase the base
                      price. Fixed-price items display their exact price.
                    </small>
                  </span>
                </label>
              </section>

              <section className="editor-section">
                <div className="editor-section-title">
                  <b>2</b>
                  <span>
                    <strong>Add the photo</strong>
                    <small>
                      It is automatically resized and converted to WebP.
                    </small>
                  </span>
                </div>
                <div className="menu-image-field improved-image-field">
                  <div
                    className={`menu-image-preview ${preview ? "has-image" : ""}`}
                  >
                    {preview ? (
                      <img src={preview} alt="Menu item preview" />
                    ) : (
                      <span>Add a bright, clear food photo</span>
                    )}
                  </div>
                  <div>
                    <label className="file-button-label">
                      Choose photo
                      <input
                        name="image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                        onChange={chooseImage}
                      />
                    </label>
                    <span className="hint">
                      JPG, PNG, WebP or HEIC. Large files are optimized before
                      upload.
                    </span>
                    {isEditing && item?.imageUrl && (
                      <label className="remove-image">
                        <input name="removeImage" type="checkbox" /> Remove
                        current photo
                      </label>
                    )}
                  </div>
                </div>
              </section>

              <section className="editor-section">
                <div className="editor-section-title">
                  <b>3</b>
                  <span>
                    <strong>Choose where it appears</strong>
                    <small>
                      These settings update the customer menu immediately.
                    </small>
                  </span>
                </div>
                <div className="menu-visibility-options visibility-cards">
                  <label className="switch-label">
                    <span>
                      <strong>Show on customer menu</strong>
                      <small>
                        Turn this off to keep the item in admin but hide it from
                        customers
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      checked={available}
                      onChange={(event) => setAvailable(event.target.checked)}
                    />
                    <span className="switch" />
                  </label>
                  <label className="switch-label">
                    <span>
                      <strong>Featured</strong>
                      <small>Move it near the beginning</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(event) => setFeatured(event.target.checked)}
                    />
                    <span className="switch" />
                  </label>
                  <label className="switch-label">
                    <span>
                      <strong>Featured Today</strong>
                      <small>Highlights it above other featured items</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={drinkOfNight}
                      onChange={(event) =>
                        setDrinkOfNight(event.target.checked)
                      }
                    />
                    <span className="switch" />
                  </label>
                  {!bottleService && (
                    <label className="switch-label">
                      <span>
                        <strong>Build Your Own</strong>
                        <small>Shows “Starting at” and opens choices</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={customDrink}
                        onChange={(event) => {
                          setCustomDrink(event.target.checked);
                          if (event.target.checked) setStartingPrice(true);
                        }}
                      />
                      <span className="switch" />
                    </label>
                  )}
                </div>
              </section>

              <section className="editor-section">
                <div className="editor-section-title">
                  <b>4</b>
                  <span>
                    <strong>
                      {bottleService
                        ? "Choose what can be included"
                        : "Attach customization"}
                    </strong>
                    <small>
                      {bottleService
                        ? "Optional: attach choices only for a customizable package."
                        : "Customers see these questions after tapping the plus button."}
                    </small>
                  </span>
                </div>
                {optionGroups.length ? (
                  <div className="option-group-picker improved-group-picker">
                    {optionGroups.map((group) => {
                      const selected = selectedGroups.includes(group._id);
                      return (
                        <label
                          key={group._id}
                          className={selected ? "selected" : ""}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleGroup(group._id)}
                          />
                          <span>
                            <strong>{group.name}</strong>
                            <small>
                              {group.minSelections ? "Required" : "Optional"} ·{" "}
                              {group.selectionMode === "single"
                                ? "Choose one"
                                : `Up to ${group.maxSelections}`}{" "}
                              · {group.options.length} choices
                            </small>
                          </span>
                          <b>{selected ? "Attached" : "Attach"}</b>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="inline-empty">
                    No pricing groups are available. Fixed-price items can be
                    saved without one.
                  </div>
                )}
              </section>
            </div>

            <aside className="editor-summary menu-summary">
              <p className="summary-label">Customer preview</p>
              <div className="summary-image">
                {preview ? (
                  <img src={preview} alt="" />
                ) : (
                  <span>Photo preview</span>
                )}
              </div>
              <span className="summary-category">{category || "Category"}</span>
              <h3>{name || "Item name"}</h3>
              <strong className="summary-price">
                {startingPrice ? "Starting at " : ""}
                {money(price)}
              </strong>
              <p>{description || "The item description appears here."}</p>
              <div className="summary-badges">
                {drinkOfNight && <span>Featured Today</span>}
                {!drinkOfNight && featured && <span>Featured</span>}
                {!bottleService && customDrink && <span>Build Your Own</span>}
                {!available && <span>Hidden</span>}
              </div>
              <small>
                {selectedGroups.length} customization group
                {selectedGroups.length === 1 ? "" : "s"} attached
              </small>
            </aside>
          </div>

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
              {busy ? "Optimizing & saving…" : "Save menu item"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
