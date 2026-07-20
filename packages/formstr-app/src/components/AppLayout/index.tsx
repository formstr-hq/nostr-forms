import { Box, Container } from "@mui/material";
import { Outlet } from "react-router-dom";
import { NostrHeader } from "../Header";

/**
 * Persistent app shell: mounts the header once and renders routed pages
 * inside a centered, responsive container (replaces per-route header
 * wrappers and ad-hoc percentage-margin layouts).
 */
export const AppLayout = () => {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NostrHeader />
      <Container component="main" maxWidth="lg" sx={{ py: 3, flex: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
};
