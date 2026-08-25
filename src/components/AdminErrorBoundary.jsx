import React from "react";

export default class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, details) {
    console.error("Admin portal render failed", error, details);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="admin-fatal-error">
        <div>
          <p className="eyebrow dark">Admin portal</p>
          <h1>This page could not load</h1>
          <p>
            Refresh the portal. If this continues, the latest Convex functions
            may still need to be deployed.
          </p>
          <button className="primary-button" onClick={() => location.reload()}>
            Refresh portal
          </button>
        </div>
      </main>
    );
  }
}
