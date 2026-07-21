import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import useDeviceType from "../../hooks/useDeviceType";

function ResponsiveLink({ link }: { link: string }) {
  const { MOBILE } = useDeviceType();
  return (
    <a href={link}>
      {MOBILE ? <OpenInNewIcon fontSize="small" sx={{ verticalAlign: "middle" }} /> : link}
    </a>
  );
}

export default ResponsiveLink;
