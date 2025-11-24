import React from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonInput,
  IonButton,
  IonText
} from '@ionic/react';
import { useAtom } from 'jotai';
import { setAuthTokenAtom } from '../state/auth';
import { apiPost, LoginResponse } from '../api/client';
import { useHistory } from 'react-router-dom';

const centerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  gap: '12px',
  padding: '16px',
  width: '100%',
  maxWidth: '420px',
  margin: '0 auto'
};

const Login: React.FC = () => {
  const [, setToken] = useAtom(setAuthTokenAtom);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const history = useHistory();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiPost<LoginResponse>('/auth/v1/login', { email, password });
      setToken(res.token);
      history.replace('/tab1');
    } catch (err) {
      setError('Falha no login. Verifique suas credenciais.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <form onSubmit={onSubmit} style={centerStyle}>
          <IonInput
            type="email"
            label="Email"
            labelPlacement="floating"
            value={email}
            onIonChange={(e) => setEmail(e.detail.value || '')}
            required
          />
          <IonInput
            type="password"
            label="Senha"
            labelPlacement="floating"
            value={password}
            onIonChange={(e) => setPassword(e.detail.value || '')}
            required
          />
          {error && <IonText color="danger">{error}</IonText>}
          <IonButton type="submit" expand="block">Entrar</IonButton>
          <IonButton fill="clear" onClick={() => history.push('/register')}>Cadastrar</IonButton>
          <IonButton disabled={true} fill="outline">Recuperar senha</IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default Login;
