import { BrowserRouter } from "react-router-dom";
import "./App.css";
import Routing from "./components/Routing";
import { ProfileProvider } from "./provider/ProfileProvider";
import { TemplateProvider } from "./provider/TemplateProvider";
import { MyFormsProvider } from "./provider/MyFormsProvider";
import { LocalFormsProvider } from "./provider/LocalFormsProvider";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <ProfileProvider>
            <LocalFormsProvider>
              <MyFormsProvider>
                <TemplateProvider>
                  <Routing />
                </TemplateProvider>
              </MyFormsProvider>
            </LocalFormsProvider>
          </ProfileProvider>
      </div>
    </BrowserRouter>
  );
}

export default App;
