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
import { apiPost } from '../api/client';
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

const Register: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<boolean>(false);
  const history = useHistory();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);
    try {
      const res = await apiPost<boolean>('/auth/v1/register', { email, password });
      if (res === true) {
        setOk(true);
        setTimeout(() => history.replace('/login'), 800);
      } else {
        setError('Email já cadastrado.');
      }
    } catch (err) {
      setError('Falha no cadastro.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cadastrar</IonTitle>
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
          {ok && <IonText color="success">Cadastro realizado!</IonText>}
          <IonButton type="submit" expand="block">Cadastrar</IonButton>
          <IonButton fill="clear" onClick={() => history.goBack()}>Voltar</IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default Register;
