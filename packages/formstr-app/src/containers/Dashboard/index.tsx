import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { FormDetails } from "../CreateFormNew/components/FormDetails";
import { Event } from "nostr-tools";
import { useProfileContext } from "../../hooks/useProfileContext";
import { FormEventCard } from "./FormCards/FormEventCard";
import DashboardStyleWrapper from "./index.style";
import EmptyScreen from "../../components/EmptyScreen";
import { useApplicationContext } from "../../hooks/useApplicationContext";
import { ILocalForm } from "../CreateFormNew/providers/FormBuilder/typeDefs";
import { Dropdown, Menu, Typography, Button, Spin, Alert } from "antd";
import { DownOutlined, ImportOutlined, LockOutlined } from "@ant-design/icons";
import { nip19 } from "nostr-tools";
import ImportFormModal from "../../components/ImportFormModal";
import { useLocalForms } from "../../provider/LocalFormsProvider";
import { MyForms } from "./FormCards/MyForms";
import { Drafts } from "./FormCards/Drafts";
import { LocalForms } from "./FormCards/LocalForms";
import { useNavigate } from "react-router-dom";
import { availableTemplates, FormTemplate } from "../../templates";
import { ROUTES } from "../../constants/routes";
import { FormInitData } from "../CreateFormNew/providers/FormBuilder/typeDefs";
import { createFormSpecFromTemplate } from "../../utils/formUtils";
import { Purchases } from "./FormCards/Purchases";
import { SubCloser } from "nostr-tools/abstract-pool";
import { getDefaultRelays } from "../../nostr/common";

const MENU_OPTIONS = {
  local: "On this device",
  shared: "Shared with me",
  myForms: "My forms",
  drafts: "Drafts",
  purchases: "Purchases",
};

type FilterType = "local" | "shared" | "myForms" | "drafts" | "purchases";

type RouteMapType = {
  [key: string]: FilterType;
};

const ROUTE_TO_FILTER_MAP: RouteMapType = {
  [ROUTES.DASHBOARD_LOCAL]: "local",
  [ROUTES.DASHBOARD_SHARED]: "shared",
  [ROUTES.DASHBOARD_MY_FORMS]: "myForms",
  [ROUTES.DASHBOARD_DRAFTS]: "drafts",
  [ROUTES.DASHBOARD_PURCHASES]: "purchases",
  [ROUTES.DASHBOARD]: "local",
};

const defaultRelays = getDefaultRelays();

export const Dashboard = () => {
  const { state } = useLocation();
  const location = useLocation();
  const { pubkey } = useProfileContext();
  const [showFormDetails, setShowFormDetails] = useState<boolean>(!!state);
  const {
    localForms,
    isLoading: isLoadingLocalForms,
    isEncrypted,
    encryptionMeta,
    refreshForms,
    deleteLocalForm,
  } = useLocalForms();
  const [nostrForms, setNostrForms] = useState<Map<string, Event>>(new Map());
  const [showImportModal, setShowImportModal] = useState(false);

  const getCurrentFilterFromPath = (): FilterType => {
    const path = location.pathname;
    return ROUTE_TO_FILTER_MAP[path] || "local";
  };

  const [filter, setFilter] = useState<FilterType>(getCurrentFilterFromPath());

  const { poolRef } = useApplicationContext();

  const subCloserRef = useRef<SubCloser | null>(null);

  useEffect(() => {
    const currentFilter = getCurrentFilterFromPath();
    setFilter(currentFilter);
  }, [location.pathname]);

  const handleEvent = (event: Event) => {
    setNostrForms((prevMap) => {
      const newMap = new Map(prevMap);
      newMap.set(event.id, event);
      return newMap;
    });
  };

  const fetchNostrForms = () => {
    if (!pubkey) return;
    const queryFilter = {
      kinds: [30168],
      "#p": [pubkey],
    };

    subCloserRef.current = poolRef.current.subscribeMany(
      defaultRelays,
      [queryFilter],
      {
        onevent: handleEvent,
        onclose() {
          subCloserRef.current?.close();
        },
      },
    );
  };

  useEffect(() => {
    if (pubkey && nostrForms.size === 0) {
      fetchNostrForms();
    }
    return () => {
      if (subCloserRef.current) {
        subCloserRef.current.close();
      }
    };
  }, [pubkey]);

  const navigate = useNavigate();

  const handleTemplateClick = (template: FormTemplate) => {
    const { spec, id } = createFormSpecFromTemplate(template);
    const navigationState: FormInitData = { spec, id };
    navigate(ROUTES.CREATE_FORMS_NEW, { state: navigationState });
  };

  const renderForms = () => {
    if (filter === "local") {
      if (isLoadingLocalForms) {
        return (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        );
      }
      if (localForms.length == 0) {
        return (
          <EmptyScreen
            templates={availableTemplates}
            onTemplateClick={handleTemplateClick}
            message="No forms found on this device. Start by choosing a template:"
            action={() => navigate(ROUTES.CREATE_FORMS_NEW)}
            actionLabel="Create New Form"
          />
        );
      }
      return (
        <LocalForms
          localForms={localForms}
          onDeleted={(localForm: ILocalForm) => {
            deleteLocalForm(localForm.key);
          }}
        />
      );
    } else if (filter === "shared") {
      if (nostrForms.size == 0) {
        return <EmptyScreen message="No forms shared with you." />;
      }
      return Array.from(nostrForms.values()).map((formEvent: Event) => {
        let d_tag = formEvent.tags.find((t) => t[0] === "d")?.[1];
        if (!d_tag) return null;
        let key = `${formEvent.kind}:${formEvent.pubkey}:${d_tag}`;
        return <FormEventCard key={key} event={formEvent} />;
      });
    } else if (filter === "myForms") {
      return <MyForms />;
    } else if (filter === "drafts") {
      return <Drafts />;
    } else if (filter === "purchases") {
      return <Purchases />;
    }

    return null;
  };

  const handleFilterChange = (selectedFilter: FilterType) => {
    const routeMap = {
      local: ROUTES.DASHBOARD_LOCAL,
      shared: ROUTES.DASHBOARD_SHARED,
      myForms: ROUTES.DASHBOARD_MY_FORMS,
      drafts: ROUTES.DASHBOARD_DRAFTS,
      purchases: ROUTES.DASHBOARD_PURCHASES,
    };

    navigate(routeMap[selectedFilter]);
  };

  const menu = (
    <Menu style={{ textAlign: "center" }}>
      <Menu.Item key="local" onClick={() => handleFilterChange("local")}>
        {MENU_OPTIONS.local}
      </Menu.Item>
      <Menu.Item
        key="shared"
        onClick={() => handleFilterChange("shared")}
        disabled={!pubkey}
      >
        {MENU_OPTIONS.shared}
      </Menu.Item>
      <Menu.Item
        key="myForms"
        onClick={() => handleFilterChange("myForms")}
        disabled={!pubkey}
      >
        {MENU_OPTIONS.myForms}
      </Menu.Item>
      <Menu.Item key="drafts" onClick={() => handleFilterChange("drafts")}>
        {MENU_OPTIONS.drafts}
      </Menu.Item>
      <Menu.Item
        key="purchases"
        onClick={() => handleFilterChange("purchases")}
      >
        {MENU_OPTIONS.purchases}
      </Menu.Item>
    </Menu>
  );

  return (
    <DashboardStyleWrapper>
      <div className="dashboard-container">
        <div className="filter-dropdown-container">
          <Dropdown
            overlay={menu}
            trigger={["click"]}
            placement="bottomLeft"
            overlayClassName="dashboard-filter-menu"
          >
            <Button>
              {MENU_OPTIONS[filter]}
              <DownOutlined style={{ marginLeft: "8px", fontSize: "12px" }} />
            </Button>
          </Dropdown>
          <Button
            icon={<ImportOutlined style={{ marginTop: -5 }} />}
            onClick={() => setShowImportModal(true)}
            style={{ marginLeft: 8 }}
          >
            Import
          </Button>
        </div>
        {filter === "local" && isEncrypted && !pubkey && (
          <Alert
            message="Encrypted forms on this device"
            description={
              encryptionMeta?.encryptedBy
                ? `You have forms encrypted for ${(() => {
                    try {
                      const npub = nip19.npubEncode(encryptionMeta.encryptedBy);
                      return npub.slice(0, 12) + "..." + npub.slice(-8);
                    } catch {
                      return (
                        encryptionMeta.encryptedBy.slice(0, 8) +
                        "..." +
                        encryptionMeta.encryptedBy.slice(-8)
                      );
                    }
                  })()}. Login with that key to access them.`
                : "You have encrypted forms stored on this device. Login to access them."
            }
            type="info"
            showIcon
            icon={<LockOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}
        <div className="form-cards-container">{renderForms()}</div>
        <>
          {state && (
            <FormDetails
              isOpen={showFormDetails}
              {...state}
              onClose={() => {
                setShowFormDetails(false);
                refreshForms();
              }}
            />
          )}
        </>
        <ImportFormModal
          open={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImported={() => {
            refreshForms();
          }}
        />
      </div>
    </DashboardStyleWrapper>
  );
};
