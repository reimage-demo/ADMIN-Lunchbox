const money = (cents) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

export default function CouponsView({ coupons, onAdd, onEdit, onDelete }) {
  return (
    <>
      <div className="view-tools">
        <p className="subtext">
          Create discount codes customers can apply during online checkout.
        </p>
        <button className="primary-button compact" onClick={onAdd}>
          + Create coupon
        </button>
      </div>
      <div className="admin-grid coupon-grid">
        {coupons.length ? (
          coupons.map((coupon) => (
            <article
              className={`admin-card coupon-card ${coupon.isActive ? "" : "unavailable"}`}
              key={coupon._id}
            >
              <div className="admin-card-head">
                <div>
                  <p className="coupon-status">
                    {coupon.isActive ? "Active" : "Inactive"}
                  </p>
                  <h3>{coupon.code}</h3>
                </div>
                <strong className="coupon-value">
                  {coupon.discountType === "percentage"
                    ? `${coupon.amount}% off`
                    : `${money(coupon.amount)} off`}
                </strong>
              </div>
              <p>
                Customers enter this code at checkout. Discounts apply to the
                order subtotal before tip.
              </p>
              <div className="card-actions">
                <button onClick={() => onEdit(coupon)}>Edit</button>
                <button className="delete" onClick={() => onDelete(coupon._id)}>
                  Delete
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty">
            No coupons yet. Create a code to offer customers a discount.
          </div>
        )}
      </div>
    </>
  );
}
