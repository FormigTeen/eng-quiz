import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {
  homeOutline,
  trophyOutline,
  cartOutline,
  notificationsOutline,
  personOutline
} from 'ionicons/icons';

/* Imports das Páginas */
import Login from './pages/Login';
import Home from './pages/Home';
import Ranking from './pages/Ranking';
import Shop from './pages/Shop';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
// import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';

setupIonicReact();

const TabsLayout: React.FC = () => (
  <IonTabs>
    <IonRouterOutlet>
      <Route exact path="/app/home" component={Home} />
      <Route exact path="/app/ranking" component={Ranking} />
      <Route exact path="/app/shop" component={Shop} />
      <Route exact path="/app/notifications" component={Notifications} />
      <Route exact path="/app/profile" component={Profile} />

      <Route exact path="/app">
        <Redirect to="/app/feed" />
      </Route>
    </IonRouterOutlet>

    <IonTabBar slot="bottom">
      <IonTabButton tab="home" href="/app/home">
        <IonIcon icon={homeOutline} />
        <IonLabel>Início</IonLabel>
      </IonTabButton>

      <IonTabButton tab="ranking" href="/app/ranking">
        <IonIcon icon={trophyOutline} />
        <IonLabel>Ranking</IonLabel>
      </IonTabButton>

      <IonTabButton tab="shop" href="/app/shop">
        <IonIcon icon={cartOutline} />
        <IonLabel>Loja</IonLabel>
      </IonTabButton>

      <IonTabButton tab="notifications" href="/app/notifications">
        <IonIcon icon={notificationsOutline} />
        <IonLabel>Notificações</IonLabel>
      </IonTabButton>

      <IonTabButton tab="profile" href="/app/profile">
        <IonIcon icon={personOutline} />
        <IonLabel>Perfil</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        {/* Rota de Login */}
        <Route exact path="/login" component={Login} />

        {/* Redireciona raiz para o login */}
        <Route exact path="/">
          <Redirect to="/login" />
        </Route>

        {/* Rotas internas do App */}
        <Route path="/app" component={TabsLayout} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;