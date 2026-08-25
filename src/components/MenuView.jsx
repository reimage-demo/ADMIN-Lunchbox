import { useEffect, useMemo, useState } from "react";
import { customerOrder, placementRank, reorderMenuItem } from "../menuOrder";
import { resolveMenuImageUrl } from "../imageUrl";

const money = (cents) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

export default function MenuView({
  items,
  categories = [],
  onAdd,
  onEdit,
  onDuplicate,
  onDelete,
  onVisibility,
  onReorder,
  onAddCategory,
  onEditCategory,
  onCategoryVisibility,
  onReorderCategories,
  bottleService = false,
}) {
  const [orderedItemIds, setOrderedItemIds] = useState(() =>
    customerOrder(items).map((item) => item._id),
  );
  const [orderedCategoryIds, setOrderedCategoryIds] = useState(() =>
    [...categories]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((category) => category._id),
  );
  const [draggedId, setDraggedId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);
  const [orderError, setOrderError] = useState("");
  const itemSignature = items
    .map(
      (item) =>
        `${item._id}:${item.category}:${item.sortOrder}:${Boolean(item.isFeatured)}:${Boolean(item.isDrinkOfNight)}`,
    )
    .join("|");
  const categorySignature = categories
    .map(
      (category) =>
        `${category._id}:${category.name}:${category.sortOrder}:${category.isAvailable}`,
    )
    .join("|");
  const itemsById = new Map(items.map((item) => [String(item._id), item]));
  const categoriesById = new Map(
    categories.map((category) => [String(category._id), category]),
  );
  const orderedItems = orderedItemIds
    .map((id) => itemsById.get(String(id)))
    .filter(Boolean);
  const orderedCategories = orderedCategoryIds
    .map((id) => categoriesById.get(String(id)))
    .filter(Boolean);
  const orphanCategories = useMemo(() => {
    const known = new Set(categories.map((category) => category.name));
    return [...new Set(items.map((item) => item.category))]
      .filter((name) => !known.has(name))
      .map((name) => ({ _id: `orphan:${name}`, name, isAvailable: true }));
  }, [items, categorySignature]);
  const sections = [...orderedCategories, ...orphanCategories];

  useEffect(() => {
    setOrderedItemIds(customerOrder(items).map((item) => item._id));
  }, [itemSignature]);

  useEffect(() => {
    setOrderedCategoryIds(
      [...categories]
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((category) => category._id),
    );
  }, [categorySignature]);

  const peersFor = (item) =>
    orderedItems.filter(
      (entry) =>
        entry.category === item.category &&
        placementRank(entry) === placementRank(item),
    );

  const canMove = (item, direction) => {
    const peers = peersFor(item);
    const index = peers.findIndex((entry) => entry._id === item._id);
    return Boolean(peers[index + direction]);
  };

  async function saveOrder(next, previous) {
    setOrderedItemIds(next.map((item) => item._id));
    setSavingOrder(true);
    setOrderError("");
    try {
      await onReorder(next.map((item) => item._id));
    } catch (error) {
      setOrderedItemIds(previous.map((item) => item._id));
      setOrderError(error?.message || "Could not update the menu order.");
    } finally {
      setSavingOrder(false);
    }
  }

  function moveItem(item, direction) {
    if (savingOrder || !canMove(item, direction)) return;
    const previous = [...orderedItems];
    const peers = peersFor(item);
    const peerIndex = peers.findIndex((entry) => entry._id === item._id);
    const target = peers[peerIndex + direction];
    const sourceIndex = previous.findIndex((entry) => entry._id === item._id);
    const targetIndex = previous.findIndex((entry) => entry._id === target._id);
    const next = [...previous];
    [next[sourceIndex], next[targetIndex]] = [
      next[targetIndex],
      next[sourceIndex],
    ];
    void saveOrder(next, previous);
  }

  async function moveCategory(index, direction) {
    const target = index + direction;
    if (savingCategories || target < 0 || target >= orderedCategories.length)
      return;
    const previous = [...orderedCategories];
    const next = [...orderedCategories];
    [next[index], next[target]] = [next[target], next[index]];
    setOrderedCategoryIds(next.map((category) => category._id));
    setSavingCategories(true);
    setOrderError("");
    try {
      await onReorderCategories(next.map((category) => category._id));
    } catch (error) {
      setOrderedCategoryIds(previous.map((category) => category._id));
      setOrderError(error?.message || "Could not update category order.");
    } finally {
      setSavingCategories(false);
    }
  }

  function startDrag(event, item) {
    if (savingOrder) {
      event.preventDefault();
      return;
    }
    setDraggedId(item._id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item._id);
  }

  function dragOver(event, item) {
    const dragged = orderedItems.find((entry) => entry._id === draggedId);
    if (
      !dragged ||
      dragged._id === item._id ||
      dragged.category !== item.category ||
      placementRank(dragged) !== placementRank(item)
    )
      return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const bounds = event.currentTarget.getBoundingClientRect();
    const position =
      event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
    setDropTarget({ id: item._id, position });
  }

  function dropItem(event, target) {
    event.preventDefault();
    if (!draggedId || savingOrder) return;
    const previous = [...orderedItems];
    const source = previous.find((item) => item._id === draggedId);
    if (
      !source ||
      source.category !== target.category ||
      placementRank(source) !== placementRank(target)
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const position =
      event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
    const next = reorderMenuItem(previous, draggedId, target._id, position);
    setDraggedId(null);
    setDropTarget(null);
    if (next.some((item, index) => item._id !== previous[index]._id))
      void saveOrder(next, previous);
  }

  function endDrag() {
    setDraggedId(null);
    setDropTarget(null);
  }

  const renderItem = (item) => (
    <article
      key={item._id}
      className={`admin-card menu-admin-card ${item.isAvailable ? "" : "unavailable"} ${item.isDrinkOfNight ? "admin-drink-night" : ""} ${draggedId === item._id ? "is-dragging" : ""} ${dropTarget?.id === item._id ? `drop-${dropTarget.position}` : ""}`}
      onDragOver={(event) => dragOver(event, item)}
      onDrop={(event) => dropItem(event, item)}
    >
      <div className="menu-reorder-bar">
        <span
          className="menu-drag-handle"
          draggable={!savingOrder}
          onDragStart={(event) => startDrag(event, item)}
          onDragEnd={endDrag}
          title="Drag to reorder within this category"
        >
          <span aria-hidden="true">⋮⋮</span>
          Drag
        </span>
        <span className="menu-move-buttons">
          <button
            type="button"
            onClick={() => moveItem(item, -1)}
            disabled={savingOrder || !canMove(item, -1)}
            aria-label={`Move ${item.name} earlier`}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => moveItem(item, 1)}
            disabled={savingOrder || !canMove(item, 1)}
            aria-label={`Move ${item.name} later`}
          >
            ↓
          </button>
        </span>
      </div>
      {item.imageUrl ? (
        <img
          src={resolveMenuImageUrl(item.imageUrl)}
          width="800"
          height="600"
          loading="lazy"
          decoding="async"
          alt=""
        />
      ) : (
        <div className="admin-image-placeholder">Photo needed</div>
      )}
      <div className="menu-admin-copy">
        <div className="admin-card-head">
          <h3>{item.name}</h3>
          <span className="admin-card-price">{money(item.price)}</span>
        </div>
        <p>{item.description}</p>
        <div className="admin-card-meta">
          <span>{item.category}</span>
          <span>
            {item.isAvailable ? "Visible on menu" : "Hidden from menu"}
          </span>
          {item.isFeatured && (
            <span className="admin-feature-tag">Featured</span>
          )}
          {item.isDrinkOfNight && (
            <span className="admin-night-tag">Featured Today</span>
          )}
          {item.isCustomDrink && (
            <span className="admin-feature-tag">Build Your Own</span>
          )}
          {(item.showsStartingPrice ??
            (item.isCustomDrink === true || item.isBottleService === true)) && (
            <span className="admin-feature-tag">Starting at</span>
          )}
        </div>
        <div className="card-actions">
          <button onClick={() => onEdit(item)}>Edit</button>
          <button onClick={() => onDuplicate(item)}>Duplicate</button>
          <button onClick={() => onVisibility(item, !item.isAvailable)}>
            {item.isAvailable ? "Hide from menu" : "Show on menu"}
          </button>
          <button className="delete" onClick={() => onDelete(item._id)}>
            Delete
          </button>
        </div>
      </div>
    </article>
  );

  return (
    <>
      <div className="view-tools">
        <p className="subtext">
          {bottleService
            ? "Manage fixed-price trays and customizable catering packages."
            : "Food and drinks are grouped by category. Edit an item to move it to another category."}
        </p>
        <div className="menu-view-actions">
          <button className="secondary-button compact" onClick={onAddCategory}>
            + Add category
          </button>
          <button className="primary-button compact" onClick={onAdd}>
            + Add {bottleService ? "catering item" : "menu item"}
          </button>
        </div>
      </div>
      {(items.length > 1 || categories.length > 1) && (
        <div className="menu-order-help">
          <span className="drag-grip" aria-hidden="true">
            ⋮⋮
          </span>
          <span>
            <strong>Organized and movable</strong>
            <small>
              Reorder categories with their arrows. Drag items within a
              category; edit an item to change its category.
            </small>
          </span>
          {(savingOrder || savingCategories) && <b>Saving order…</b>}
        </div>
      )}
      {orderError && (
        <p className="menu-order-error" role="alert">
          {orderError}
        </p>
      )}
      <div className="menu-category-admin-list">
        {sections.length ? (
          sections.map((category, categoryIndex) => {
            const categoryItems = orderedItems.filter(
              (item) => item.category === category.name,
            );
            const orphan = String(category._id).startsWith("orphan:");
            return (
              <section
                className={`menu-category-admin ${category.isAvailable ? "" : "category-hidden"}`}
                key={category._id}
              >
                <header className="menu-category-admin-head">
                  <div>
                    <span>
                      {bottleService ? "Catering category" : "Menu category"}
                    </span>
                    <h2>{category.name}</h2>
                    <small>
                      {categoryItems.length} item
                      {categoryItems.length === 1 ? "" : "s"}
                      {!category.isAvailable && " · Hidden from customers"}
                    </small>
                  </div>
                  {!orphan && (
                    <div className="category-admin-actions">
                      <button
                        type="button"
                        onClick={() => moveCategory(categoryIndex, -1)}
                        disabled={savingCategories || categoryIndex === 0}
                        aria-label={`Move ${category.name} earlier`}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCategory(categoryIndex, 1)}
                        disabled={
                          savingCategories ||
                          categoryIndex === orderedCategories.length - 1
                        }
                        aria-label={`Move ${category.name} later`}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditCategory(category)}
                      >
                        Edit category
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onCategoryVisibility(category, !category.isAvailable)
                        }
                      >
                        {category.isAvailable
                          ? "Hide category"
                          : "Show category"}
                      </button>
                    </div>
                  )}
                </header>
                <div className="admin-grid menu-admin-grid">
                  {categoryItems.length ? (
                    categoryItems.map(renderItem)
                  ) : (
                    <div className="empty">No items in this category yet.</div>
                  )}
                </div>
              </section>
            );
          })
        ) : (
          <div className="empty">
            No {bottleService ? "catering categories" : "menu categories"} yet.
          </div>
        )}
      </div>
    </>
  );
}
