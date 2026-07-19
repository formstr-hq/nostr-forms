import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import { NostrHeader } from "../Header";

/**
 * Persistent app shell: mounts the header once and renders routed pages
 * inside a centered, responsive container (replaces per-route header
 * wrappers and ad-hoc percentage-margin layouts).
 */
export const AppLayout = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <NostrHeader />
      <Layout.Content>
        <div className="app-container">
          <Outlet />
        </div>
      </Layout.Content>
    </Layout>
  );
};
