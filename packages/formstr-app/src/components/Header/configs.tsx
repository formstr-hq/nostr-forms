import { Link } from "react-router-dom";
import { Button } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { ROUTES } from "../../constants/routes";

export const HEADER_MENU_KEYS = {
  PUBLIC_FORMS: "PUBLIC_FORMS",
  USER: "USER",
  CREATE_FORMS: "CREATE_FORMS",
  HELP: "HELP",
  CONTACT_US: "CONTACT_US",
};

export const HEADER_MENU = [
  {
    key: HEADER_MENU_KEYS.HELP,
    label: "Help",
    icon: <InfoCircleOutlined />,
  },
  {
    key: HEADER_MENU_KEYS.CONTACT_US,
    label: (
      <a
        href="https://formstr.app/f/naddr1qvzqqqr4mqpzphj4jjc6qkaaswuz6wu3kzyvhhdu5e68rdfymj2dtmk5eajwvx2mqy88wumn8ghj7mn0wvhxcmmv9uqqvj64ddmxyjgexza45?viewKey=4425edf8b0c0ab84f47718452c6dd0fcfb6df2ec73ad868b31eefe0f18abc8f8"
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none" }}
      >
        Contact Us
      </a>
    ),
    icon: <MailOutlined />,
  },
  {
    key: HEADER_MENU_KEYS.CREATE_FORMS,
    label: (
      <Button
        type="primary"
        icon={<PlusOutlined style={{ paddingTop: "2px" }} />}
      >
        Create Form
      </Button>
    ),
  },
  {
    key: HEADER_MENU_KEYS.PUBLIC_FORMS,
    label: "Bulletin Board",
    icon: (
      <Link to={ROUTES.PUBLIC_FORMS}>
        <SearchOutlined />
      </Link>
    ),
  },
];
