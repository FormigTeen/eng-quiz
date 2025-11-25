import React from 'react';
import { IonPage, IonContent, IonItem, IonInput, IonButton, IonIcon, IonLabel, IonText } from '@ionic/react';
import { mailOutline, paperPlaneOutline } from 'ionicons/icons';
import { useAuth } from '../hooks/useAuth';
import { apiPost } from '../api/client';
import { useHistory } from 'react-router-dom';
import './Login.css';

const Invite: React.FC = () => {
  const { token } = useAuth();
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const history = useHistory();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSent(false);
    try {
      if (!token) throw new Error('Não autenticado');
      await apiPost<boolean>('/auth/v1/invite', { email }, token);
      setSent(true);
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.includes('409')) {
        setError('O convite para esse Email já foi enviado');
      } else {
        setError('Falha ao enviar convite');
      }
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding custom-background">

        <div className="header-container">
          <h1 className="app-title">Convidar Amigos</h1>
          <p className="app-subtitle">Traga seus amigos para o Soccer Quiz!</p>
        </div>

        <div className="login-card">
          <div className="welcome-text">
            <h2>Ganhe jogando com amigos</h2>
            <p>Envie um convite por email para alguém jogar com você.</p>
          </div>

          <form className="form-inputs" onSubmit={onSubmit}>
            <label>Email do amigo</label>
            <IonItem lines="none" className="custom-input">
              <IonIcon slot="start" icon={mailOutline} />
              <IonInput
                placeholder="amigo@email.com"
                type="email"
                value={email}
                onIonChange={(e) => setEmail(e.detail.value || '')}
                required
              />
            </IonItem>

            {error && <IonText color="danger">{error}</IonText>}
            {sent && <IonText color="success">Convite enviado!</IonText>}

            <IonButton type="submit" expand="block" className="main-button">
              <IonIcon slot="start" icon={paperPlaneOutline} />
              Enviar convite
            </IonButton>

            <IonButton fill="clear" onClick={() => history.goBack()}>Voltar</IonButton>
          </form>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default Invite;
