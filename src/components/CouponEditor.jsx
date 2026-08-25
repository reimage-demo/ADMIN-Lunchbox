import { useState } from "react";

export default function CouponEditor({ coupon, onClose, onSave }) {
  const [code, setCode] = useState(coupon?.code || "");
  const [discountType, setDiscountType] = useState(
    coupon?.discountType || "percentage",
  );
  const [amount, setAmount] = useState(
    coupon
      ? coupon.discountType === "fixed"
        ? (coupon.amount / 100).toFixed(2)
        : String(coupon.amount)
      : "",
  );
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function changeType(next) {
    setDiscountType(next);
    setAmount("");
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave({
        id: coupon?._id,
        code,
        discountType,
        amount:
          discountType === "fixed"
            ? Math.round(Number(amount) * 100)
            : Math.round(Number(amount)),
        isActive,
      });
    } catch (err) {
      setError(err?.data?.message || err?.message || "Could not save coupon.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <dialog className="editor-dialog coupon-editor" open>
        <button className="dialog-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <header className="editor-heading">
          <p className="eyebrow dark">Customer discount</p>
          <h2>{coupon ? "Edit coupon" : "Create a coupon"}</h2>
          <p>Choose the code and how much it takes off the order subtotal.</p>
        </header>
        <form onSubmit={submit}>
          <label>
            Discount code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="WELCOME10"
              minLength="2"
              maxLength="32"
              required
            />
          </label>
          <fieldset className="coupon-type-picker">
            <legend>Discount type</legend>
            <button
              type="button"
              className={discountType === "percentage" ? "selected" : ""}
              onClick={() => changeType("percentage")}
            >
              Percentage
            </button>
            <button
              type="button"
              className={discountType === "fixed" ? "selected" : ""}
              onClick={() => changeType("fixed")}
            >
              Dollar amount
            </button>
          </fieldset>
          <label>
            {discountType === "percentage" ? "Percentage off" : "Dollars off"}
            <div className="coupon-amount-input">
              <span>{discountType === "percentage" ? "%" : "$"}</span>
              <input
                type="number"
                min={discountType === "percentage" ? "1" : "0.01"}
                max={discountType === "percentage" ? "100" : "5000"}
                step={discountType === "percentage" ? "1" : "0.01"}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>
          </label>
          <label className="switch-label coupon-active-toggle">
            <span>
              <strong>Available to customers</strong>
              <small>Turn this off to pause the code without deleting it.</small>
            </span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            <span className="switch" />
          </label>
          <p className="form-message error">{error}</p>
          <div className="editor-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" disabled={busy}>
              {busy ? "Saving…" : "Save coupon"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
