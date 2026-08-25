import { useEffect, useRef, useState } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { anyApi } from "convex/server";
import LoginView from "./components/LoginView";
import Sidebar from "./components/Sidebar";
import AdminHeader from "./components/AdminHeader";
import Overview from "./components/Overview";
import OrdersView from "./components/OrdersView";
import MenuView from "./components/MenuView";
import EventsView from "./components/EventsView";
import TruckLocationView from "./components/TruckLocationView";
import MenuEditor from "./components/MenuEditor";
import EventEditor from "./components/EventEditor";
import PricingView from "./components/PricingView";
import OptionGroupEditor from "./components/OptionGroupEditor";
import CouponsView from "./components/CouponsView";
import CouponEditor from "./components/CouponEditor";
import CategoryEditor from "./components/CategoryEditor";
import { optimizeEventImage, optimizeMenuImage } from "./imageOptimizer";
import { applyMenuItemUpdate } from "./menuOptimistic";

const api = anyApi;
const key = "lunchbox_admin_session";
const sidebarKey = "lunchbox_admin_sidebar_collapsed";
const idleTimeoutMs = 30 * 60 * 1000;
const activityRefreshThrottleMs = 60 * 1000;

const allowedViews = new Set(["overview", "orders", "location", "menu", "bottle-service", "pricing", "coupons", "events"]);
const requestedView = new URLSearchParams(window.location.search).get("view");

export default function App() {
  const [token, setToken] = useState(sessionStorage.getItem(key) || "");
  const [sessionVerified, setSessionVerified] = useState(false);
  const [sessionNotice, setSessionNotice] = useState("");
  const sessionTimer = useRef(null);
  const [view, setView] = useState(allowedViews.has(requestedView) ? requestedView : "overview");
  const [sidebar, setSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(sidebarKey) === "true",
  );
  const [menuEditor, setMenuEditor] = useState(null);
  const [eventEditor, setEventEditor] = useState(null);
  const [pricingEditor, setPricingEditor] = useState(null);
  const [couponEditor, setCouponEditor] = useState(null);
  const [categoryEditor, setCategoryEditor] = useState(null);
  const [toast, setToast] = useState("");
  const authorizedToken = sessionVerified ? token : "";

  const overview = useQuery(
    api.dashboard.overview,
    authorizedToken ? { sessionToken: authorizedToken } : "skip",
  );
  const menu =
    useQuery(
      api.menuItems.adminList,
      authorizedToken && (view === "menu" || view === "bottle-service")
        ? { sessionToken: authorizedToken }
        : "skip",
    ) || [];
  const optionGroups =
    useQuery(
      api.optionGroups.adminList,
      authorizedToken &&
        (view === "menu" ||
          view === "bottle-service" ||
          view === "pricing" ||
          menuEditor)
        ? { sessionToken: authorizedToken }
        : "skip",
    ) || [];
  const menuCategories =
    useQuery(
      api.menuCategories.adminList,
      authorizedToken && (view === "menu" || view === "bottle-service" || menuEditor)
        ? { sessionToken: authorizedToken }
        : "skip",
    ) || [];
  const orderPages = usePaginatedQuery(
    api.orders.adminPage,
    authorizedToken && view === "orders"
      ? { sessionToken: authorizedToken }
      : "skip",
    { initialNumItems: 50 },
  );
  const eventPages = usePaginatedQuery(
    api.events.adminPage,
    authorizedToken && view === "events"
      ? { sessionToken: authorizedToken }
      : "skip",
    { initialNumItems: 24 },
  );
  const orders = orderPages.results || [];
  const events = eventPages.results || [];
  const coupons =
    useQuery(
      api.coupons.adminList,
      authorizedToken && view === "coupons"
        ? { sessionToken: authorizedToken }
        : "skip",
    ) || [];
  const truckLocation = useQuery(
    api.truckLocations.getAdmin,
    authorizedToken && view === "location"
      ? { sessionToken: authorizedToken }
      : "skip",
  );
  const loginAdmin = useMutation(api.adminAuth.login);
  const logoutAdmin = useMutation(api.adminAuth.logout);
  const checkAdminSession = useMutation(api.adminAuth.checkSession);
  const touchAdminSession = useMutation(api.adminAuth.touchSession);
  const createMenu = useMutation(api.menuItems.create);
  const updateMenu = useMutation(api.menuItems.update).withOptimisticUpdate(
    (localStore, args) => {
      const queryArgs = { sessionToken: args.sessionToken };
      const currentMenu = localStore.getQuery(
        api.menuItems.adminList,
        queryArgs,
      );
      if (currentMenu !== undefined) {
        localStore.setQuery(
          api.menuItems.adminList,
          queryArgs,
          applyMenuItemUpdate(currentMenu, args),
        );
      }
    },
  );
  const reorderMenu = useMutation(api.menuItems.reorder);
  const removeMenu = useMutation(api.menuItems.remove);
  const generateMenuUploadUrl = useMutation(api.menuItems.generateUploadUrl);
  const createEvent = useMutation(api.events.create);
  const updateEvent = useMutation(api.events.update);
  const removeEvent = useMutation(api.events.remove);
  const generateUploadUrl = useMutation(api.events.generateUploadUrl);
  const updateOrderStatus = useMutation(api.orders.updateStatus);
  const updateOrderPaid = useMutation(api.orders.updatePaid);
  const removeOrder = useMutation(api.orders.remove);
  const removeOrders = useMutation(api.orders.removeMany);
  const clearFinishedOrders = useMutation(api.orders.clearFinished);
  const createOptionGroup = useMutation(api.optionGroups.create);
  const updateOptionGroup = useMutation(api.optionGroups.update);
  const removeOptionGroup = useMutation(api.optionGroups.remove);
  const createMenuCategory = useMutation(api.menuCategories.create);
  const updateMenuCategory = useMutation(api.menuCategories.update);
  const reorderMenuCategories = useMutation(api.menuCategories.reorder);
  const createCoupon = useMutation(api.coupons.create);
  const updateCoupon = useMutation(api.coupons.update);
  const removeCoupon = useMutation(api.coupons.remove);
  const saveTruckLocation = useMutation(api.truckLocations.saveCurrent);

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2400);
  };

  useEffect(() => {
    if (!token) {
      setSessionVerified(false);
      window.clearTimeout(sessionTimer.current);
      return;
    }

    let disposed = false;
    let ending = false;
    let lastActivityAt = Date.now();
    let lastServerRefreshAt = 0;
    let serverIdleExpiresAt = Date.now() + idleTimeoutMs;
    let absoluteExpiresAt = Number.POSITIVE_INFINITY;
    let pendingTouchTimer = null;

    const clearLocalSession = (message) => {
      sessionStorage.removeItem(key);
      setSessionVerified(false);
      setSessionNotice(message);
      setToken("");
    };

    const endSession = async () => {
      if (disposed || ending) return;
      ending = true;
      window.clearTimeout(sessionTimer.current);
      window.clearTimeout(pendingTouchTimer);
      try {
        await logoutAdmin({ sessionToken: token });
      } catch {
        // The server may already have deleted an expired session.
      } finally {
        if (!disposed)
          clearLocalSession(
            "Your admin session expired. Sign in again to continue.",
          );
      }
    };

    const scheduleExpiration = () => {
      window.clearTimeout(sessionTimer.current);
      const deadline = Math.min(
        lastActivityAt + idleTimeoutMs,
        serverIdleExpiresAt,
        absoluteExpiresAt,
      );
      sessionTimer.current = window.setTimeout(
        endSession,
        Math.max(0, deadline - Date.now() - 250),
      );
    };

    const refreshServerActivity = () => {
      if (disposed || ending) return;
      const now = Date.now();
      lastServerRefreshAt = now;
      void touchAdminSession({ sessionToken: token })
        .then((result) => {
          if (disposed || ending) return;
          if (!result.valid) {
            void endSession();
            return;
          }
          absoluteExpiresAt = result.expiresAt;
          serverIdleExpiresAt = result.idleExpiresAt;
          scheduleExpiration();
        })
        .catch(() => {
          if (!disposed) void endSession();
        });
    };

    const recordActivity = () => {
      if (disposed || ending) return;
      const now = Date.now();
      if (
        now - lastActivityAt >= idleTimeoutMs ||
        now >= absoluteExpiresAt ||
        now >= serverIdleExpiresAt
      ) {
        void endSession();
        return;
      }
      lastActivityAt = now;
      scheduleExpiration();
      const wait = Math.max(
        0,
        activityRefreshThrottleMs - (now - lastServerRefreshAt),
      );
      window.clearTimeout(pendingTouchTimer);
      if (!wait) refreshServerActivity();
      else
        pendingTouchTimer = window.setTimeout(refreshServerActivity, wait);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") recordActivity();
    };
    const activityEvents = ["pointerdown", "keydown", "touchstart"];
    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, recordActivity, { passive: true }),
    );
    document.addEventListener("visibilitychange", onVisibilityChange);

    void checkAdminSession({ sessionToken: token })
      .then((result) => {
        if (disposed || ending) return;
        if (!result.valid) {
          void endSession();
          return;
        }
        lastActivityAt = result.lastActivityAt;
        lastServerRefreshAt = result.lastActivityAt;
        serverIdleExpiresAt = result.idleExpiresAt;
        absoluteExpiresAt = result.expiresAt;
        setSessionVerified(true);
        setSessionNotice("");
        scheduleExpiration();
      })
      .catch(() => {
        if (!disposed) void endSession();
      });

    return () => {
      disposed = true;
      window.clearTimeout(sessionTimer.current);
      window.clearTimeout(pendingTouchTimer);
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, recordActivity),
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [checkAdminSession, logoutAdmin, token, touchAdminSession]);

  async function login(username, password) {
    const result = await loginAdmin({ username, password });
    if (!result.ok) {
      const error = new Error(result.reason);
      error.attemptsRemaining = result.attemptsRemaining;
      throw error;
    }
    sessionStorage.setItem(key, result.token);
    setSessionNotice("");
    setSessionVerified(true);
    setToken(result.token);
  }
  async function logout() {
    try {
      await logoutAdmin({ sessionToken: token });
    } catch {}
    sessionStorage.removeItem(key);
    setSessionVerified(false);
    setSessionNotice("");
    setToken("");
  }
  async function updateOrder(id, field, value) {
    if (field === "status")
      await updateOrderStatus({ sessionToken: token, id, status: value });
    else await updateOrderPaid({ sessionToken: token, id, paid: value });
    notify("Order updated");
  }
  async function deleteOrder(id) {
    if (
      !confirm(
        "Permanently delete this order? Deleted orders are removed from revenue totals and cannot be restored.",
      )
    )
      return;
    await removeOrder({ sessionToken: token, id });
    notify("Order deleted");
  }
  async function clearOrders() {
    if (
      !confirm(
        "Clear every completed, cancelled, and refunded order from the admin list? Revenue history will be preserved.",
      )
    )
      return;
    const result = await clearFinishedOrders({ sessionToken: token });
    notify(
      result.cleared
        ? `${result.cleared} finished order${result.cleared === 1 ? "" : "s"} cleared`
        : "No finished orders to clear",
    );
  }
  async function deleteOrders(ids) {
    if (!ids.length) return false;
    if (
      !confirm(
        `Permanently delete ${ids.length} selected order${ids.length === 1 ? "" : "s"}? Deleted orders are removed from revenue totals and cannot be restored.`,
      )
    )
      return false;
    const result = await removeOrders({ sessionToken: token, ids });
    notify(`${result.deleted} order${result.deleted === 1 ? "" : "s"} deleted`);
    return true;
  }
  async function saveMenu(data) {
    let { id, file, imageStorageId, imageUrl, removeImage, ...values } = data;
    if (file?.size) {
      file = await optimizeMenuImage(file);
      const url = await generateMenuUploadUrl({ sessionToken: token });
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Menu image upload failed.");
      ({ storageId: imageStorageId } = await response.json());
      imageUrl = undefined;
      removeImage = false;
    }
    const payload = {
      sessionToken: token,
      ...values,
      ...(imageStorageId ? { imageStorageId } : {}),
      ...(!imageStorageId && imageUrl ? { imageUrl } : {}),
    };
    if (id) await updateMenu({ id, removeImage, ...payload });
    else await createMenu(payload);
    setMenuEditor(null);
    notify("Menu item saved");
  }
  async function deleteMenu(id) {
    if (!confirm("Delete this menu item?")) return;
    await removeMenu({ sessionToken: token, id });
    notify("Menu item deleted");
  }
  async function updateMenuVisibility(item, isAvailable) {
    await updateMenu({
      sessionToken: token,
      id: item._id,
      removeImage: false,
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      ...(item.accent ? { accent: item.accent } : {}),
      ...(item.imageStorageId
        ? { imageStorageId: item.imageStorageId }
        : item.imageUrl
          ? { imageUrl: item.imageUrl }
          : {}),
      isAvailable,
      isFeatured: item.isFeatured ?? false,
      isDrinkOfNight: item.isDrinkOfNight ?? false,
      isCustomDrink: item.isCustomDrink ?? false,
      isBottleService: item.isBottleService ?? false,
      showsStartingPrice:
        item.showsStartingPrice ??
        (item.isCustomDrink === true || item.isBottleService === true),
      optionGroupIds: item.optionGroupIds || [],
      sortOrder: item.sortOrder,
      addOns: item.addOns || [],
    });
    notify(
      isAvailable
        ? "Item shown on customer menu"
        : "Item hidden from customer menu",
    );
  }
  async function reorderMenuItems(ids) {
    await reorderMenu({ sessionToken: token, ids });
    notify("Menu order updated");
  }
  async function saveMenuCategory(data) {
    const { id, ...values } = data;
    const payload = { sessionToken: token, ...values };
    if (id) await updateMenuCategory({ id, ...payload });
    else await createMenuCategory(payload);
    setCategoryEditor(null);
    notify("Category saved");
  }
  async function updateMenuCategoryVisibility(category, isAvailable) {
    await updateMenuCategory({
      sessionToken: token,
      id: category._id,
      name: category.name,
      kind: category.kind,
      isAvailable,
      sortOrder: category.sortOrder,
    });
    notify(isAvailable ? "Category shown" : "Category hidden");
  }
  async function reorderCategories(kind, ids) {
    await reorderMenuCategories({ sessionToken: token, kind, ids });
    notify("Category order updated");
  }
  async function saveEvent(data) {
    let { id, file, imageStorageId, imageUrl, removeImage, ...values } = data;
    if (file?.size) {
      file = await optimizeEventImage(file);
      const url = await generateUploadUrl({ sessionToken: token });
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Upload failed");
      ({ storageId: imageStorageId } = await response.json());
      imageUrl = undefined;
      removeImage = false;
    }
    const payload = {
      sessionToken: token,
      ...values,
      ...(imageStorageId ? { imageStorageId } : {}),
      ...(!imageStorageId && imageUrl ? { imageUrl } : {}),
    };
    if (id) await updateEvent({ id, removeImage, ...payload });
    else await createEvent(payload);
    setEventEditor(null);
    notify("Event saved");
  }
  async function deleteEvent(id) {
    if (!confirm("Delete this event?")) return;
    await removeEvent({ sessionToken: token, id });
    notify("Event deleted");
  }
  async function saveOptionGroup(data) {
    const { id, ...values } = data;
    const payload = { sessionToken: token, ...values };
    if (id) await updateOptionGroup({ id, ...payload });
    else await createOptionGroup(payload);
    setPricingEditor(null);
    notify("Pricing group saved");
  }
  async function deleteOptionGroup(id) {
    if (
      !confirm("Delete this option group? It will be removed from every menu item.")
    )
      return;
    await removeOptionGroup({ sessionToken: token, id });
    notify("Pricing group deleted");
  }
  async function saveCoupon(data) {
    const { id, ...values } = data;
    const payload = { sessionToken: token, ...values };
    if (id) await updateCoupon({ id, ...payload });
    else await createCoupon(payload);
    setCouponEditor(null);
    notify("Coupon saved");
  }
  async function deleteCoupon(id) {
    if (
      !confirm(
        "Delete this coupon? Customers will no longer be able to use it.",
      )
    )
      return;
    await removeCoupon({ sessionToken: token, id });
    notify("Coupon deleted");
  }
  function toggleSidebarSize() {
    setSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem(sidebarKey, String(next));
      return next;
    });
  }

  if (!token)
    return (
      <LoginView
        connected
        notice={sessionNotice}
        onLogin={login}
      />
    );
  if (!sessionVerified)
    return (
      <main className="admin-fatal-error">
        <div>
          <p className="eyebrow dark">Admin portal</p>
          <h1>Checking your session…</h1>
        </div>
      </main>
    );
  const activeCount = overview?.activeCount || 0;
  return (
    <>
      <div
        className={`admin-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      >
        {sidebar && (
          <button
            className="sidebar-scrim"
            aria-label="Close navigation"
            onClick={() => setSidebar(false)}
          />
        )}
        <Sidebar
          active={view}
          setActive={(next) => {
            setView(next);
            setSidebar(false);
          }}
          orderCount={activeCount}
          open={sidebar}
          onLogout={logout}
          collapsed={sidebarCollapsed}
          onCollapse={toggleSidebarSize}
        />
        <main className="admin-main">
          <AdminHeader
            view={view}
            onMenu={() => setSidebar((value) => !value)}
          />
          <div className="admin-content">
            {view === "overview" && (
              <Overview summary={overview} go={setView} />
            )}
            {view === "orders" && (
              <OrdersView
                orders={orders}
                status={orderPages.status}
                loadMore={() => orderPages.loadMore(50)}
                onStatus={(id, value) => updateOrder(id, "status", value)}
                onPaid={(id, value) => updateOrder(id, "paid", value)}
                onDelete={deleteOrder}
                onDeleteMany={deleteOrders}
                onClearFinished={clearOrders}
              />
            )}
            {view === "location" && (
              <TruckLocationView
                location={truckLocation}
                onSave={async (values) => {
                  await saveTruckLocation({ sessionToken: token, ...values });
                  notify("Truck location published");
                }}
              />
            )}
            {view === "menu" && (
              <MenuView
                items={menu.filter((item) => !item.isBottleService)}
                categories={menuCategories.filter(
                  (category) => category.kind === "menu",
                )}
                onAdd={() => setMenuEditor({ mode: "new" })}
                onAddCategory={() =>
                  setCategoryEditor({ mode: "new", kind: "menu" })
                }
                onEditCategory={setCategoryEditor}
                onCategoryVisibility={updateMenuCategoryVisibility}
                onReorderCategories={(ids) => reorderCategories("menu", ids)}
                onEdit={setMenuEditor}
                onDuplicate={(item) =>
                  setMenuEditor({
                    ...item,
                    _id: undefined,
                    name: `${item.name} copy`,
                    imageUrl: undefined,
                    imageStorageId: undefined,
                    sortOrder:
                      menu.filter((row) => !row.isBottleService).length + 1,
                  })
                }
                onDelete={deleteMenu}
                onVisibility={updateMenuVisibility}
                onReorder={reorderMenuItems}
              />
            )}
            {view === "bottle-service" && (
              <MenuView
                bottleService
                items={menu.filter((item) => item.isBottleService)}
                categories={menuCategories.filter(
                  (category) => category.kind === "bottle",
                )}
                onAdd={() =>
                  setMenuEditor({ mode: "new", isBottleService: true })
                }
                onAddCategory={() =>
                  setCategoryEditor({ mode: "new", kind: "bottle" })
                }
                onEditCategory={setCategoryEditor}
                onCategoryVisibility={updateMenuCategoryVisibility}
                onReorderCategories={(ids) => reorderCategories("bottle", ids)}
                onEdit={setMenuEditor}
                onDuplicate={(item) =>
                  setMenuEditor({
                    ...item,
                    _id: undefined,
                    name: `${item.name} copy`,
                    imageUrl: undefined,
                    imageStorageId: undefined,
                    sortOrder:
                      menu.filter((row) => row.isBottleService).length + 1,
                  })
                }
                onDelete={deleteMenu}
                onVisibility={updateMenuVisibility}
                onReorder={reorderMenuItems}
              />
            )}
            {view === "pricing" && (
              <PricingView
                groups={optionGroups}
                onAdd={() => setPricingEditor({ mode: "new" })}
                onEdit={setPricingEditor}
                onDuplicate={(group) =>
                  setPricingEditor({
                    ...group,
                    _id: undefined,
                    name: `${group.name} copy`,
                    sortOrder: optionGroups.length + 1,
                    options: group.options.map((option) => ({
                      ...option,
                      id: crypto.randomUUID(),
                    })),
                  })
                }
                onDelete={deleteOptionGroup}
              />
            )}
            {view === "coupons" && (
              <CouponsView
                coupons={coupons}
                onAdd={() => setCouponEditor({ mode: "new" })}
                onEdit={setCouponEditor}
                onDelete={deleteCoupon}
              />
            )}
            {view === "events" && (
              <EventsView
                events={events}
                status={eventPages.status}
                loadMore={() => eventPages.loadMore(24)}
                onAdd={() => setEventEditor({ mode: "new" })}
                onEdit={setEventEditor}
                onDuplicate={(event) =>
                  setEventEditor({
                    ...event,
                    _id: undefined,
                    title: `${event.title} copy`,
                    imageUrl: undefined,
                    imageStorageId: undefined,
                    isPublished: false,
                  })
                }
                onDelete={deleteEvent}
              />
            )}
          </div>
        </main>
      </div>
      {menuEditor && (
        <MenuEditor
          item={menuEditor.mode === "new" ? null : menuEditor}
          bottleService={Boolean(menuEditor.isBottleService)}
          count={menu.length}
          optionGroups={optionGroups}
          categories={menuCategories.filter(
            (category) =>
              category.kind ===
              (menuEditor.isBottleService ? "bottle" : "menu"),
          )}
          onClose={() => setMenuEditor(null)}
          onSave={saveMenu}
        />
      )}
      {categoryEditor && (
        <CategoryEditor
          category={categoryEditor.mode === "new" ? null : categoryEditor}
          kind={
            categoryEditor.kind ||
            (view === "bottle-service" ? "bottle" : "menu")
          }
          count={
            menuCategories.filter(
              (category) =>
                category.kind ===
                (categoryEditor.kind ||
                  (view === "bottle-service" ? "bottle" : "menu")),
            ).length
          }
          onClose={() => setCategoryEditor(null)}
          onSave={saveMenuCategory}
        />
      )}
      {eventEditor && (
        <EventEditor
          event={eventEditor.mode === "new" ? null : eventEditor}
          onClose={() => setEventEditor(null)}
          onSave={saveEvent}
        />
      )}
      {pricingEditor && (
        <OptionGroupEditor
          group={pricingEditor.mode === "new" ? null : pricingEditor}
          count={optionGroups.length}
          onClose={() => setPricingEditor(null)}
          onSave={saveOptionGroup}
        />
      )}
      {couponEditor && (
        <CouponEditor
          coupon={couponEditor.mode === "new" ? null : couponEditor}
          onClose={() => setCouponEditor(null)}
          onSave={saveCoupon}
        />
      )}
      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
    </>
  );
}
