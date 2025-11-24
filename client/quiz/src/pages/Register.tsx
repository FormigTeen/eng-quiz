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
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
  const [ok, setOk] = React.useState<boolean>(false);
  const { sendRegister, isRegistering, registerError } = useAuth();
  const history = useHistory();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOk(false);
    try {
      await sendRegister({ email, password });
      setOk(true);
      setTimeout(() => history.replace('/login'), 800);
    } catch (err) {
      // handled below via helper text
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
          {registerError && (
            <IonText color="danger">{(registerError as Error).message || 'Falha no cadastro'}</IonText>
          )}
          {ok && <IonText color="success">Cadastro realizado!</IonText>}
          <IonButton type="submit" expand="block" disabled={isRegistering}>
            {isRegistering ? 'Cadastrando...' : 'Cadastrar'}
          </IonButton>
          <IonButton fill="clear" onClick={() => history.goBack()}>Voltar</IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default Register;
