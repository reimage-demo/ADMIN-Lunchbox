import logo from "../logo.webp";
import Icon from "./Icons";

const tabs = [
  ["overview", "Overview"],
  ["orders", "Orders"],
  ["location", "Truck Location"],
  ["menu", "Menu"],
  ["bottle-service", "Catering Trays"],
  ["pricing", "Pricing & Options"],
  ["coupons", "Coupons"],
  ["events", "Specials"],
];
export default function Sidebar({
  active,
  setActive,
  orderCount,
  open,
  onLogout,
  collapsed,
  onCollapse,
}) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-brand-block">
        <a
          className="admin-brand"
          href="/index.html"
          aria-label="Lunch Box website"
        >
          <img src={logo} alt="Lunch Box" />
        </a>
      </div>
      <div className="sidebar-collapse-row">
        <button
          className="sidebar-collapse"
          type="button"
          onClick={onCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon name={collapsed ? "expand" : "collapse"} />
          <span>{collapsed ? "Expand" : "Collapse"}</span>
        </button>
      </div>
      <nav>
        {tabs.map(([id, label]) => (
          <button
            key={id}
            className={`tab ${active === id ? "active" : ""}`}
            onClick={() => setActive(id)}
            aria-current={active === id ? "page" : undefined}
            title={collapsed ? label : undefined}
          >
            <Icon name={id} />
            <span className="nav-label">{label}</span>
            {id === "orders" && <b>{orderCount}</b>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <a
          href="/index.html"
          target="_blank"
          rel="noreferrer"
          title={collapsed ? "View website" : undefined}
        >
          <Icon name="external" />
          <span className="sidebar-bottom-label">View website</span>
        </a>
        <button onClick={onLogout} title={collapsed ? "Sign out" : undefined}>
          <Icon name="logout" />
          <span className="sidebar-bottom-label">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
