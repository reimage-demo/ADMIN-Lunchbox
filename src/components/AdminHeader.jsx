import Icon from "./Icons";

export default function AdminHeader({ view, onMenu }) {
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
  const titles = { "bottle-service": "Catering Trays", events: "Specials", location: "Truck Location" };
  return (
    <header className="admin-header">
      <button
        className="mobile-sidebar"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Icon name="navigation" />
      </button>
      <div>
        <p>{today}</p>
        <h1>{titles[view] || view[0].toUpperCase() + view.slice(1)}</h1>
      </div>
      <div className="admin-header-actions">
        <details className="quick-links">
          <summary>Quick links</summary>
          <div>
            <a href="https://squareup.com/dashboard/" target="_blank" rel="noreferrer">Square Dashboard <Icon name="external" size={15} /></a>
            <a href="/index.html" target="_blank" rel="noreferrer">Lunch Box website <Icon name="external" size={15} /></a>
          </div>
        </details>
        <div className="admin-user">
          <span>Lunch Box Admin</span>
          <i>LB</i>
        </div>
      </div>
    </header>
  );
}
