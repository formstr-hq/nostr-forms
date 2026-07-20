import { BrowserRouter } from "react-router-dom";
import Routing from "./components/Routing";
import { ProfileProvider } from "./provider/ProfileProvider";
import { TemplateProvider } from "./provider/TemplateProvider";
import { MyFormsProvider } from "./provider/MyFormsProvider";
import { LocalFormsProvider } from "./provider/LocalFormsProvider";
import { NotificationsProvider } from "./provider/NotificationsProvider";

function App() {
  return (
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
  );
}

export default App;
