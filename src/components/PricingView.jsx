const money = (cents) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );

export default function PricingView({ groups, onAdd, onEdit, onDuplicate, onDelete }) {
  return (
    <>
      <div className="view-tools">
        <p className="subtext">
          Manage reusable spirits, mixers, extra shots and other paid options.
        </p>
        <button className="primary-button compact" onClick={onAdd}>
          + Add option group
        </button>
      </div>
      <div className="pricing-guide">
        <div><b>1</b><span><strong>Create a group</strong><small>Example: Choose your spirit</small></span></div>
        <div><b>2</b><span><strong>Add customer choices</strong><small>Each choice can add to the price</small></span></div>
        <div><b>3</b><span><strong>Attach it to menu items</strong><small>Use the Menu editor to choose where it appears</small></span></div>
      </div>
      <div className="admin-grid pricing-grid">
        {groups.length ? (
          groups.map((group) => (
            <article
              className={`admin-card pricing-card ${group.isAvailable ? "" : "unavailable"}`}
              key={group._id}
            >
              <div className="admin-card-head">
                <div>
                  <h3>{group.name}</h3>
                  <p>{group.description || "No description"}</p>
                </div>
                <span>{group.minSelections ? "Required" : "Optional"}</span>
              </div>
              <p>
                {group.selectionMode === "single"
                  ? "Choose one"
                  : `Choose up to ${group.maxSelections}`}
              </p>
              <div className="pricing-options">
                {group.options.map((option) => (
                  <div key={option.id}>
                    <span>
                      {option.name}
                      {option.description ? (
                        <small>{option.description}</small>
                      ) : null}
                    </span>
                    <strong>
                      {option.price ? `+${money(option.price)}` : "Included"}
                    </strong>
                  </div>
                ))}
              </div>
              <div className="card-actions">
                <button onClick={() => onEdit(group)}>Edit</button>
                <button onClick={() => onDuplicate(group)}>Duplicate</button>
                <button className="delete" onClick={() => onDelete(group._id)}>
                  Delete
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty">
            No pricing groups yet. Add spirits, mixers or extras to get started.
          </div>
        )}
      </div>
    </>
  );
}
