import HelpOutlinedIcon from "@mui/icons-material/HelpOutlined";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { TFunction } from "i18next";

export const HEADER_MENU_KEYS = {
  PUBLIC_FORMS: "PUBLIC_FORMS",
  USER: "USER",
  NOTIFICATIONS: "NOTIFICATIONS",
  CREATE_FORMS: "CREATE_FORMS",
  HELP: "HELP",
  CONTACT_US: "CONTACT_US",
};

export const CONTACT_US_URL =
  "https://formstr.app/f/naddr1qvzqqqr4mqpzphj4jjc6qkaaswuz6wu3kzyvhhdu5e68rdfymj2dtmk5eajwvx2mqy88wumn8ghj7mn0wvhxcmmv9uqqvj64ddmxyjgexza45?viewKey=4425edf8b0c0ab84f47718452c6dd0fcfb6df2ec73ad868b31eefe0f18abc8f8";

export const getHeaderMenu = (t: TFunction) => [
  {
    key: HEADER_MENU_KEYS.HELP,
    label: t("header.help"),
    icon: <HelpOutlinedIcon fontSize="small" />,
  },
  {
    key: HEADER_MENU_KEYS.CONTACT_US,
    label: t("header.contactUs"),
    icon: <MailOutlinedIcon fontSize="small" />,
    href: CONTACT_US_URL,
  },
  {
    key: HEADER_MENU_KEYS.PUBLIC_FORMS,
    label: t("header.bulletinBoard"),
    icon: <SearchIcon fontSize="small" />,
  },
];
