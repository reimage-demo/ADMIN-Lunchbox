import { useEffect, useState } from "react";
import OrderRow from "./OrderRow";
export default function OrdersView({
  orders,
  status,
  loadMore,
  onStatus,
  onPaid,
  onDelete,
  onDeleteMany,
  onClearFinished,
}) {
  const [filter, setFilter] = useState("active");
  const [selected, setSelected] = useState(() => new Set());
  const loadedOrderIds = orders.map((order) => order._id).join("|");
  let rows = orders;
  if (filter === "active")
    rows = orders.filter((o) =>
      ["received", "in-progress", "ready"].includes(o.status),
    );
  if (filter === "completed")
    rows = orders.filter((o) =>
      ["completed", "cancelled", "refunded"].includes(o.status),
    );
  useEffect(() => {
    const loadedIds = new Set(orders.map((order) => order._id));
    setSelected(
      (current) => new Set([...current].filter((id) => loadedIds.has(id))),
    );
  }, [loadedOrderIds]);
  const allVisibleSelected =
    rows.length > 0 && rows.every((order) => selected.has(order._id));
  function toggleAllVisible() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected)
        rows.forEach((order) => next.delete(order._id));
      else rows.forEach((order) => next.add(order._id));
      return next;
    });
  }
  function toggleOrder(id, checked) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }
  async function deleteSelected() {
    if (await onDeleteMany([...selected])) setSelected(new Set());
  }
  return (
    <>
      <div className="view-tools">
        <div className="filters">
          {["active", "all", "completed"].map((value) => (
            <button
              key={value}
              className={`filter ${filter === value ? "active" : ""}`}
              onClick={() => {
                setFilter(value);
                setSelected(new Set());
              }}
            >
              {value === "all"
                ? "All orders"
                : value === "completed"
                  ? "Finished"
                : value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
        <button className="danger-button compact" onClick={onClearFinished}>
          Clear finished orders
        </button>
      </div>
      <div className="bulk-order-tools">
        <label className="bulk-select">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleAllVisible}
            disabled={!rows.length}
          />
          Select all
        </label>
        <span>{selected.size} selected</span>
        <button
          className="danger-button compact"
          disabled={!selected.size}
          onClick={deleteSelected}
        >
          Delete selected
        </button>
      </div>
      <div className="orders-list">
        {rows.length ? (
          rows.map((o) => (
            <OrderRow
              key={o._id}
              order={o}
              onStatus={onStatus}
              onPaid={onPaid}
              onDelete={onDelete}
              selected={selected.has(o._id)}
              onSelect={toggleOrder}
            />
          ))
        ) : (
          <div className="empty">
            {status === "LoadingFirstPage"
              ? "Loading orders…"
              : "No orders in this view."}
          </div>
        )}
      </div>
      {status !== "Exhausted" && (
        <button
          className="refresh-button load-more"
          disabled={status !== "CanLoadMore"}
          onClick={loadMore}
        >
          {status === "LoadingMore" ? "Loading…" : "Load more orders"}
        </button>
      )}
    </>
  );
}
