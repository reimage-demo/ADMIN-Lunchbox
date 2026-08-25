import { useState } from "react";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});
const money = (cents) => moneyFormatter.format(cents / 100);
const statuses = [
  "received",
  "in-progress",
  "ready",
  "completed",
  "cancelled",
  "refunded",
];
const statusLabel = (value) =>
  value === "completed"
    ? "picked up"
    : value === "refunded"
      ? "refunded (after Square)"
      : value.replace("-", " ");
const itemLabel = (item) =>
  `${item.quantity}× ${item.name}${item.selectedAddOns?.length ? `: ${item.selectedAddOns.map((option) => option.name).join(", ")}` : ""}`;
export default function OrderRow({
  order,
  compact,
  onStatus,
  onPaid,
  onDelete,
  selected,
  onSelect,
}) {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <article className="order-row">
      <div className="order-person">
        {!compact && (
          <label className="order-select">
            <input
              type="checkbox"
              checked={selected}
              onChange={(event) => onSelect(order._id, event.target.checked)}
            />
            Select order
          </label>
        )}
        <h3>
          {order.customerName} · {order.orderNumber}
        </h3>
        <p>
          {order.phone}
          {order.email && ` · ${order.email}`}
        </p>
      </div>
      <div className="order-items">
        <strong>{order.items.map(itemLabel).join(" | ")}</strong>
        <p>{order.notes || "No special notes"}</p>
      </div>
      <div className="order-meta">
        <strong>{money(order.total)}</strong>
        <span>
          {order.pickupTiming === "scheduled" && order.scheduledFor
            ? `Scheduled ${timeFormatter.format(new Date(order.scheduledFor))}`
            : "ASAP pickup"}
        </span>
        {order.pickupLocationName && <span>{order.pickupLocationName}</span>}
        {order.tip > 0 && (
          <span>
            {money(order.subtotal)} subtotal + {money(order.tip)} tip
          </span>
        )}
        <span>{timeFormatter.format(new Date(order.createdAt))}</span>
        <span>
          {order.squarePaymentId ? "Square verified" : "Payment recorded"}
        </span>
      </div>
      {compact ? (
        <div className="order-meta">
          <strong>{statusLabel(order.status)}</strong>
          <span>{order.paid ? "Paid" : "Not paid"}</span>
        </div>
      ) : (
        <div className="order-actions">
          <select
            className="status-select"
            value={order.status}
            onChange={(e) => onStatus(order._id, e.target.value)}
          >
            {statuses.map((value) => (
              <option
                key={value}
                value={value}
                disabled={value === "received"}
              >
                {statusLabel(value)}
              </option>
            ))}
          </select>
          <label className="paid-toggle">
            <input
              type="checkbox"
              checked={order.paid}
              onChange={(e) => onPaid(order._id, e.target.checked)}
            />{" "}
            Paid
          </label>
          <button
            className="order-details-button"
            onClick={() => setShowDetails((current) => !current)}
            aria-expanded={showDetails}
          >
            {showDetails ? "Hide details" : "Details"}
          </button>
          {["received", "in-progress"].includes(order.status) && (
            <button
              className="complete-order-button"
              onClick={() => onStatus(order._id, "ready")}
            >
              Ready for pickup
            </button>
          )}
          {order.status === "ready" && (
            <button
              className="complete-order-button"
              onClick={() => onStatus(order._id, "completed")}
            >
              Picked up
            </button>
          )}
          <button
            className="delete-order-button"
            onClick={() => onDelete(order._id)}
          >
            Delete
          </button>
        </div>
      )}
      {!compact && showDetails && (
        <section className="order-details-panel">
          <div>
            <small>Customer</small>
            <strong>{order.customerName}</strong>
            <span>{order.phone}</span>
            {order.email && <span>{order.email}</span>}
          </div>
          <div className="order-detail-items">
            <small>Order items</small>
            {order.items.map((item, index) => (
              <div key={`${item.menuItemId}-${index}`}>
                <strong>
                  {item.quantity}× {item.name}
                </strong>
                <span>{money(item.unitPrice)} each</span>
                {item.selectedAddOns?.map((addOn, optionIndex) => (
                  <span key={`${addOn.name}-${optionIndex}`}>
                    + {addOn.name}{addOn.price ? ` (${money(addOn.price)})` : ""}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <div>
            <small>Payment</small>
            <span>Subtotal: {money(order.subtotal)}</span>
            {order.discount > 0 && (
              <span>
                Discount{order.couponCode ? ` (${order.couponCode})` : ""}: −
                {money(order.discount)}
              </span>
            )}
            {order.tip > 0 && <span>Tip: {money(order.tip)}</span>}
            <strong>Total: {money(order.total)}</strong>
            <span>{order.paid ? "Paid" : "Not paid"}</span>
          </div>
          <div>
            <small>Notes</small>
            <span>{order.notes || "No special notes"}</span>
            {order.pickupLocationName && (
              <span>
                Pickup: {order.pickupLocationName}
                {order.pickupAddress ? ` · ${order.pickupAddress}` : ""}
              </span>
            )}
            {order.squarePaymentId && (
              <span>Square payment: {order.squarePaymentId}</span>
            )}
          </div>
        </section>
      )}
    </article>
  );
}
