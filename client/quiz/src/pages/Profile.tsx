import React from 'react';
import {
  IonContent, IonPage, IonAvatar, IonButton, IonIcon,
  IonGrid, IonRow, IonCol, IonProgressBar, IonLabel
} from '@ionic/react';
import {
  createOutline, personCircleOutline, ribbonOutline,
  flameOutline, timeOutline, statsChartOutline
} from 'ionicons/icons';
import './Profile.css';

const Profile: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen className="profile-bg">

        {/* 1. CARD DO USUÁRIO (VERDE) */}
        <div className="user-card section-margin">
          <div className="avatar-container">
            <IonAvatar className="big-avatar">
              <img src="https://ionicframework.com/docs/img/demos/avatar.svg" alt="Avatar" />
            </IonAvatar>
            <span className="level-badge">👑 Nível 5</span>
          </div>

          <div className="user-inputs">
            <div className="input-group">
              <IonLabel>Nome Completo</IonLabel>
              <div className="fake-input">
                <span>Jogador 1</span>
                <IonIcon icon={createOutline} />
              </div>
            </div>

            <div className="input-group">
              <IonLabel>Email</IonLabel>
              <div className="fake-input">
                <span>joao@email.com</span>
                <IonIcon icon={createOutline} />
              </div>
            </div>
          </div>
        </div>

        {/* 2. ESTATÍSTICAS (GRID 2x2) */}
        <div className="section-title">Suas Estatísticas</div>
        <IonGrid className="stats-grid section-margin">
          <IonRow>
            <IonCol size="6">
              <div className="stat-card">
                <div className="icon-box green"><IonIcon icon={ribbonOutline} /></div>
                <h3>Nível 5</h3>
                <p>Nível Atual</p>
              </div>
            </IonCol>
            <IonCol size="6">
              <div className="stat-card">
                <div className="icon-box orange"><IonIcon icon={statsChartOutline} /></div>
                <h3>1250</h3>
                <p>Moedas</p>
              </div>
            </IonCol>
            <IonCol size="6">
              <div className="stat-card">
                <div className="icon-box blue"><IonIcon icon={timeOutline} /></div>
                <h3>5.2s</h3>
                <p>Tempo Médio</p>
              </div>
            </IonCol>
            <IonCol size="6">
              <div className="stat-card">
                <div className="icon-box red"><IonIcon icon={flameOutline} /></div>
                <h3>#42</h3>
                <p>Posição Global</p>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* 3. PROGRESSO */}
        <div className="progress-card section-margin">
          <div className="progress-header">
            <strong>Progresso de Nível</strong>
            <span>75%</span>
          </div>
          <IonProgressBar value={0.75} color="success" className="custom-progress"></IonProgressBar>
          <p className="small-text">Mais 250 pontos para o próximo nível!</p>
        </div>

        {/* 4. CONQUISTAS */}
        <div className="section-title">
          Conquistas <span className="badge-yellow">🏆 3/6</span>
        </div>

        <div className="achievements-scroll">
          <div className="achievement-card unlocked">
            <IonIcon icon={ribbonOutline} className="ach-icon" />
            <h4>Primeira Vitória</h4>
            <p>Complete seu primeiro quiz</p>
            <div className="status">✔ Desbloqueada</div>
          </div>
          <div className="achievement-card unlocked">
            <IonIcon icon={flameOutline} className="ach-icon" />
            <h4>Sequência de 5</h4>
            <p>5 dias jogando seguidos</p>
            <div className="status">✔ Desbloqueada</div>
          </div>
          <div className="achievement-card locked">
            <IonIcon icon={personCircleOutline} className="ach-icon" />
            <h4>Lendário</h4>
            <p>Alcance o nível 50</p>
            <div className="status lock">Bloqueada</div>
          </div>
        </div>

        {/* Espaço extra para não ficar escondido pela TabBar */}
        <div style={{ height: '80px' }}></div>

      </IonContent>
    </IonPage>
  );
};

export default Profile;