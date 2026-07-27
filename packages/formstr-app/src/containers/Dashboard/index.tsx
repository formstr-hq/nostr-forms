import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, CircularProgress, Tab, Tabs } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { FormDetails } from "../CreateFormNew/components/FormDetails";
import { Event } from "nostr-tools";
import { useProfileContext } from "../../hooks/useProfileContext";
import { FormEventCard } from "./FormCards/FormEventCard";
import { SharedFormEventCard } from "./FormCards/SharedFormEventCard";
import EmptyScreen from "../../components/EmptyScreen";
import { subscribe, type Subscription } from "../../dataLayer";
import { ILocalForm } from "../CreateFormNew/providers/FormBuilder/typeDefs";
import { nip19 } from "nostr-tools";
import ImportFormModal from "../../components/ImportFormModal";
import { useLocalForms } from "../../provider/LocalFormsProvider";
import { MyForms } from "./FormCards/MyForms";
import { Drafts } from "./FormCards/Drafts";
import { LocalForms } from "./FormCards/LocalForms";
import { useNavigate } from "react-router-dom";
import { getAvailableTemplates, FormTemplate } from "../../templates";
import { ROUTES } from "../../constants/routes";
import { FormInitData } from "../CreateFormNew/providers/FormBuilder/typeDefs";
import { createFormSpecFromTemplate } from "../../utils/formUtils";
import { Purchases } from "./FormCards/Purchases";
import { Submissions } from "./FormCards/Submissions";
import { getDefaultRelays } from "../../nostr/common";

type FilterType =
  | "local"
  | "shared"
  | "myForms"
  | "drafts"
  | "purchases"
  | "submissions";

type RouteMapType = {
  [key: string]: FilterType;
};

const ROUTE_TO_FILTER_MAP: RouteMapType = {
  [ROUTES.DASHBOARD_LOCAL]: "local",
  [ROUTES.DASHBOARD_SHARED]: "shared",
  [ROUTES.DASHBOARD_MY_FORMS]: "myForms",
  [ROUTES.DASHBOARD_DRAFTS]: "drafts",
  [ROUTES.DASHBOARD_PURCHASES]: "purchases",
  [ROUTES.DASHBOARD_SUBMISSIONS]: "submissions",
  [ROUTES.DASHBOARD]: "local",
};

const FILTER_TO_ROUTE_MAP: Record<FilterType, string> = {
  local: ROUTES.DASHBOARD_LOCAL,
  shared: ROUTES.DASHBOARD_SHARED,
  myForms: ROUTES.DASHBOARD_MY_FORMS,
  drafts: ROUTES.DASHBOARD_DRAFTS,
  purchases: ROUTES.DASHBOARD_PURCHASES,
  submissions: ROUTES.DASHBOARD_SUBMISSIONS,
};

const defaultRelays = getDefaultRelays();

/**
 * MUI dashboard (ui-rewrite-mui Phase 4). The filter dimensions approved in
 * docs/ui-rewrite/design-direction.md stay as filters above the card grid —
 * rendered as scrollable MUI Tabs instead of the old antd dropdown.
 */
export const Dashboard = () => {
  const { t } = useTranslation();
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
  const availableTemplates = getAvailableTemplates(t);
  const menuOptions: Record<FilterType, string> = {
    local: t("dashboard.filters.local"),
    shared: t("dashboard.filters.shared"),
    myForms: t("dashboard.filters.myForms"),
    drafts: t("dashboard.filters.drafts"),
    purchases: t("dashboard.filters.purchases"),
    submissions: t("dashboard.filters.submissions"),
  };

  const getCurrentFilterFromPath = (): FilterType => {
    const path = location.pathname;
    return ROUTE_TO_FILTER_MAP[path] || "local";
  };

  const [filter, setFilter] = useState<FilterType>(getCurrentFilterFromPath());

  const subCloserRef = useRef<Subscription | null>(null);

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

    subCloserRef.current = subscribe([queryFilter], handleEvent, defaultRelays);
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
      // Only show the full-screen spinner on the INITIAL load, when there's
      // nothing to display yet. A background refresh (e.g. the one FormDetails
      // fires when it saves-to-device on open) briefly flips isLoading; if we
      // swapped the whole list out for a spinner then, we'd unmount the card —
      // and any dialog it just opened — remounting a fresh card with its state
      // reset, so the modal never actually appears. Keep the list mounted.
      if (isLoadingLocalForms && localForms.length === 0) {
        return (
          <Box sx={{ textAlign: "center", py: 5, gridColumn: "1 / -1" }}>
            <CircularProgress />
          </Box>
        );
      }
      if (localForms.length == 0) {
        return (
          <Box sx={{ gridColumn: "1 / -1" }}>
            <EmptyScreen
              templates={availableTemplates}
              onTemplateClick={handleTemplateClick}
              message={t("dashboard.localEmpty")}
              action={() => navigate(ROUTES.CREATE_FORMS_NEW)}
              actionLabel={t("header.createForm")}
            />
          </Box>
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
        return (
          <Box sx={{ gridColumn: "1 / -1" }}>
            <EmptyScreen message={t("dashboard.sharedEmpty")} />
          </Box>
        );
      }
      return Array.from(nostrForms.values()).map((formEvent: Event) => {
        let d_tag = formEvent.tags.find((t) => t[0] === "d")?.[1];
        if (!d_tag) return null;
        let key = `${formEvent.kind}:${formEvent.pubkey}:${d_tag}`;
        return pubkey ? (
          <SharedFormEventCard
            key={key}
            event={formEvent}
            userPubkey={pubkey}
          />
        ) : (
          <FormEventCard key={key} event={formEvent} />
        );
      });
    } else if (filter === "myForms") {
      return <MyForms />;
    } else if (filter === "drafts") {
      return <Drafts />;
    } else if (filter === "purchases") {
      return <Purchases />;
    } else if (filter === "submissions") {
      return <Submissions />;
    }

    return null;
  };

  const handleFilterChange = (selectedFilter: FilterType) => {
    navigate(FILTER_TO_ROUTE_MAP[selectedFilter]);
  };

  const filterOrder: FilterType[] = [
    "local",
    "shared",
    "myForms",
    "drafts",
    "purchases",
    "submissions",
  ];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 2,
        }}
      >
        <Tabs
          value={filter}
          onChange={(_e, value: FilterType) => handleFilterChange(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40 } }}
        >
          {filterOrder.map((f) => (
            <Tab
              key={f}
              value={f}
              label={menuOptions[f]}
              disabled={(f === "shared" || f === "myForms") && !pubkey}
            />
          ))}
        </Tabs>
        <Button
          variant="outlined"
          startIcon={<UploadFileOutlinedIcon />}
          onClick={() => setShowImportModal(true)}
          sx={{ flexShrink: 0 }}
        >
          {t("dashboard.import")}
        </Button>
      </Box>
      {filter === "local" && isEncrypted && !pubkey && (
        <Alert severity="info" icon={<LockOutlinedIcon />} sx={{ mb: 2 }}>
          <strong>{t("dashboard.encryptedFormsTitle")}</strong>
          <br />
          {encryptionMeta?.encryptedBy
            ? t("dashboard.encryptedFormsFor", {
                npub: (() => {
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
                })(),
              })
            : t("dashboard.encryptedFormsDescription")}
        </Alert>
      )}
      <Box
        className="form-cards-container"
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        {renderForms()}
      </Box>
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
    </Box>
  );
};
