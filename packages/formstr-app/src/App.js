import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import Routing from "./components/Routing";
import { formstrTheme } from "./theme";
import { ProfileProvider } from "./provider/ProfileProvider";
import { TemplateProvider } from "./provider/TemplateProvider";
import { MyFormsProvider } from "./provider/MyFormsProvider";
import { LocalFormsProvider } from "./provider/LocalFormsProvider";
import { NotificationsProvider } from "./provider/NotificationsProvider";

function App() {
  return (
    <ConfigProvider theme={formstrTheme}>
      <BrowserRouter>
        <div className="App">
          <ProfileProvider>
            <LocalFormsProvider>
              <MyFormsProvider>
                <NotificationsProvider>
                  <TemplateProvider>
                    <Routing />
                  </TemplateProvider>
                </NotificationsProvider>
              </MyFormsProvider>
            </LocalFormsProvider>
          </ProfileProvider>
        </div>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
