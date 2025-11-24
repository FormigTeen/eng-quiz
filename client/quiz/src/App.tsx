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
import Register from './pages/Register';
import Home from './pages/Home';
import Ranking from './pages/Ranking';
import Shop from './pages/Shop';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Invite from './pages/Invite';
import { useAtomValue } from 'jotai';
import { authTokenAtom } from './state/auth';

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

const TabsLayout: React.FC = () => {
  const token = useAtomValue(authTokenAtom);
  if (!token) return <Redirect to="/login" />;
  return (
    <IonTabs>
      <IonRouterOutlet>
        <PrivateRoute exact path="/app/home" component={Home} />
        <PrivateRoute exact path="/app/ranking" component={Ranking} />
        <PrivateRoute exact path="/app/shop" component={Shop} />
        <PrivateRoute exact path="/app/notifications" component={Notifications} />
        <PrivateRoute exact path="/app/profile" component={Profile} />
        <PrivateRoute exact path="/app/invite" component={Invite} />

        <Route exact path="/app">
          <Redirect to="/app/home" />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="home" href="/app/home">
          <IonIcon icon={homeOutline} />
          <IonLabel>Início</IonLabel>
        </IonTabButton>

      <IonTabButton tab="ranking" href="#" disabled>
        <IonIcon icon={trophyOutline} />
        <IonLabel>Em breve</IonLabel>
      </IonTabButton>

        <IonTabButton tab="shop" href="/app/shop">
          <IonIcon icon={cartOutline} />
          <IonLabel>Loja</IonLabel>
        </IonTabButton>

      <IonTabButton tab="notifications" href="#" disabled>
        <IonIcon icon={notificationsOutline} />
        <IonLabel>Em breve</IonLabel>
      </IonTabButton>

        <IonTabButton tab="profile" href="/app/profile">
          <IonIcon icon={personOutline} />
          <IonLabel>Perfil</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

type PrivateRouteProps = React.ComponentProps<typeof Route>;
const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, ...rest }: any) => {
  const token = useAtomValue(authTokenAtom);
  return (
    <Route
      {...rest}
      render={(props) => (token ? <Component {...props} /> : <Redirect to={{ pathname: '/login' }} />)}
    />
  );
};

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        {/* Rota de Login */}
        <Route exact path="/login" component={Login} />
        <Route exact path="/register" component={Register} />

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
