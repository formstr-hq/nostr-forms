import { forwardRef } from "react";
import { Divider } from "@mui/material";
import BasicMenu from "../BasicMenu";
import InputsMenu from "../InputsMenu";
import PreBuiltMenu from "../PreBuiltMenu";
import Sidebar from "../../../../components/Sidebar";

// TODO: remove usage of any here
function SidebarMenu(_props: any, ref: any) {
  return (
    <Sidebar width={252} ref={ref} className="left-sidebar">
      <BasicMenu />
      <Divider className="menu-divider" />
      <InputsMenu />
      <Divider className="menu-divider" />
      <PreBuiltMenu />
    </Sidebar>
  );
}

export default forwardRef(SidebarMenu);
