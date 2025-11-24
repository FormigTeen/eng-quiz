import React from 'react';
import {
  IonContent, IonPage, IonAvatar, IonIcon,
  IonGrid, IonRow, IonCol, IonSearchbar
} from '@ionic/react';
import {
  ribbonOutline, flameOutline, locateOutline,
  globeOutline, giftOutline, searchOutline,
  shieldCheckmarkOutline, trophyOutline, medalOutline,
  footballOutline
} from 'ionicons/icons';
import './Home.css';

const Home: React.FC = () => {

  // Dados falsos para os cards de Times (Mais Jogados)
  const teams = [
    { name: 'Flamengo', players: '1.2K', color: 'red', icon: flameOutline },
    { name: 'Palmeiras', players: '980', color: 'green', icon: footballOutline },
    { name: 'Corinthians', players: '850', color: 'black', icon: shieldCheckmarkOutline },
    { name: 'São Paulo', players: '720', color: 'tricolor', icon: trophyOutline },
  ];

  // Dados falsos para as Categorias
  const categories = [
    { name: 'Geral', qs: '10 perguntas', color: 'green-grad', icon: globeOutline },
    { name: 'Flamengo', qs: '10 perguntas', color: 'red-grad', icon: flameOutline },
    { name: 'Palmeiras', qs: '10 perguntas', color: 'green-flat', icon: footballOutline },
    { name: 'Corinthians', qs: '10 perguntas', color: 'black-flat', icon: shieldCheckmarkOutline },
    { name: 'São Paulo', qs: '10 perguntas', color: 'red-flat', icon: trophyOutline },
    { name: 'Santos', qs: '10 perguntas', color: 'gray-flat', icon: medalOutline },
    { name: 'Libertadores', qs: '10 perguntas', color: 'orange-flat', icon: trophyOutline },
    { name: 'Copa Mundo', qs: '10 perguntas', color: 'purple-flat', icon: globeOutline },
  ];

  return (
    <IonPage>
      <IonContent fullscreen className="home-bg">

        {/* 1. CABEÇALHO VERDE */}
        <div className="home-header">
          <div className="user-info">
            <IonAvatar className="small-avatar">
              <img src="https://ionicframework.com/docs/img/demos/avatar.svg" alt="Avatar" />
            </IonAvatar>
            <div className="user-text">
              <h3>Jogador</h3>
              <p>🏆 Nível 5 &nbsp; 🔥 0</p>
            </div>
          </div>
          <div className="coin-badge">
            🟡 1250
          </div>
        </div>

        {/* 2. STATUS DO JOGADOR (3 CARDS) */}
        <div className="stats-container">
          <IonGrid>
            <IonRow>
              <IonCol size="4">
                <div className="mini-stat-card">
                  <IonIcon icon={ribbonOutline} className="blue-icon" />
                  <h4>#42</h4>
                  <p>Posição</p>
                </div>
              </IonCol>
              <IonCol size="4">
                <div className="mini-stat-card">
                  <IonIcon icon={flameOutline} className="orange-icon" />
                  <h4>14 dias</h4>
                  <p>Sequência</p>
                </div>
              </IonCol>
              <IonCol size="4">
                <div className="mini-stat-card">
                  <IonIcon icon={locateOutline} className="green-icon" />
                  <h4>87%</h4>
                  <p>Acertos</p>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>

        <div className="content-padding">

          {/* 3. BANNERS GRANDES (Jogo Rápido & Quiz Premiado) */}
          <div className="section-header">
            <h3>Comece a Jogar</h3>
            <p>Escolha seu modo de jogo favorito</p>
          </div>

          <div className="game-card green-card">
            <div className="card-badge">🚀 Recomendado</div>
            <div className="card-content">
              <IonIcon icon={globeOutline} />
              <div>
                <h2>Jogo Rápido</h2>
                <p>Perguntas gerais de futebol • 10 questões</p>
              </div>
            </div>
            <div className="players-online">Jogadores ativos <strong>2.8K</strong></div>
          </div>

          <div className="game-card pink-card">
            <div className="card-badge premium">💎 Premium</div>
            <div className="card-content">
              <IonIcon icon={giftOutline} />
              <div>
                <h2>Quiz Premiado</h2>
                <p>Ganhe prêmios em moedas • Desafie amigos</p>
              </div>
            </div>
            <div className="prize-info">Prêmio mínimo <strong>💰 100</strong></div>
          </div>

          {/* 4. MAIS JOGADOS (Rolagem Horizontal) */}
          <div className="section-header mt-4">
            <h3>Mais Jogados</h3>
            <p>Os times mais populares entre os jogadores</p>
          </div>

          <div className="horizontal-scroll">
            {teams.map((team, index) => (
              <div key={index} className={`team-card ${team.color}`}>
                <div className="star-icon">★</div>
                <IonIcon icon={team.icon} className="team-icon" />
                <h4>{team.name}</h4>
                <div className="player-count">Jogadores <strong>{team.players}</strong></div>
              </div>
            ))}
          </div>

          {/* 5. EXPLORAR CATEGORIAS */}
          <div className="section-header mt-4">
            <h3>Explorar Categorias</h3>
            <p>Encontre seu time ou competição favorita</p>
          </div>

          <IonSearchbar placeholder="Buscar time, competição..." className="custom-search" />

          <IonGrid className="categories-grid">
            <IonRow>
              {categories.map((cat, index) => (
                <IonCol size="6" key={index}>
                  <div className={`category-card ${cat.color}`}>
                    <IonIcon icon={cat.icon} />
                    <h4>{cat.name}</h4>
                    <span className="pill">{cat.qs}</span>
                  </div>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>

          {/* Espaço extra para o menu inferior não cobrir o conteúdo */}
          <div style={{ height: '60px' }}></div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;