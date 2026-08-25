import OrderRow from "./OrderRow";
const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const money = (cents) => moneyFormatter.format((cents || 0) / 100);
export default function Overview({ summary, go }) {
  const stats = [
    [
      "Revenue today",
      money(summary?.todayRevenue),
      "Paid pickup orders",
    ],
    [
      "Total revenue",
      money(summary?.totalRevenue),
      `${summary?.paidOrderCount ?? 0} paid orders`,
    ],
    ["Active orders", summary?.activeCount ?? 0, "Received or in progress"],
    ["Ready for pickup", summary?.readyCount ?? 0, "Waiting for guests"],
    [
      "Menu items",
      summary?.menuCount ?? 0,
      `${summary?.unavailableMenuCount ?? 0} unavailable`,
    ],
    [
      "Published specials",
      summary?.publishedEventCount ?? 0,
      "Visible on the website",
    ],
  ];
  const orders = summary?.newestOrders || [];
  return (
    <>
      <div className="welcome-card">
        <div>
          <p className="eyebrow">At a glance</p>
          <h2>
            Keep the good
            <br />
            times moving.
          </h2>
          <p>See what needs attention and jump into today’s work.</p>
        </div>
        <span className="welcome-orb">P</span>
      </div>
      <div className="stats-grid">
        {stats.map(([label, value, note]) => (
          <article key={label}>
            <p>{label}</p>
            <strong>{value}</strong>
            <span>{note}</span>
          </article>
        ))}
      </div>
      <div className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow dark">Right now</p>
            <h2>Newest orders</h2>
          </div>
          <button className="text-button" onClick={() => go("orders")}>
            View all
          </button>
        </div>
        {orders.length ? (
          orders.map((o) => <OrderRow key={o._id} order={o} compact />)
        ) : (
          <div className="empty">No orders have come in yet.</div>
        )}
      </div>
    </>
  );
}
