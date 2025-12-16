import React, { useEffect, useState } from 'react';
import {
  IonContent, IonPage, IonAvatar, IonIcon,
  IonGrid, IonRow, IonCol, IonSearchbar, IonSpinner
} from '@ionic/react';
import {
  ribbonOutline, flameOutline, locateOutline,
  globeOutline, shieldCheckmarkOutline, trophyOutline, medalOutline,
  footballOutline
} from 'ionicons/icons';
import './Home.css';
import { useAuth } from '../hooks/useAuth';
import TopRightBar from '../components/TopRightBar';
import { useHistory } from 'react-router-dom';

// Definição do tipo de dado que vem do Strapi
interface StrapiTeam {
  id: number;
  documentId: string;
  Nome: string;
}

const Home: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const level = user?.level ?? 1;
  const seqCount = user?.sequence?.count ?? 0;
  const coins = user?.wallet?.credits ?? 0;
  const pos = (user?.score?.positive ?? 0);
  const neg = (user?.score?.negative ?? 0);
  const accuracy = neg === 0 ? (pos > 0 ? 100 : 0) : Math.round((pos / (pos + neg)) * 100);

  // --- NOVO CÓDIGO: ESTADOS PARA GUARDAR OS DADOS DO STRAPI ---
  const [categories, setCategories] = useState<StrapiTeam[]>([]);
  const [loading, setLoading] = useState(true);

  // --- NOVO CÓDIGO: BUSCAR DADOS NO STRAPI ---
  useEffect(() => {
    fetch('http://localhost:1337/api/equipes')
      .then(response => response.json())
      .then(result => {
        // O Strapi retorna { data: [...] }
        if (result.data) {
          setCategories(result.data);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("Erro ao buscar times no Strapi:", error);
        setLoading(false);
      });
  }, []);

  // Dados falsos para os cards de Times (Mais Jogados)
  const teams = [
    { name: 'Flamengo', players: '1.2K', color: 'red', icon: flameOutline },
    { name: 'Palmeiras', players: '980', color: 'green', icon: footballOutline },
    { name: 'Corinthians', players: '850', color: 'black', icon: shieldCheckmarkOutline },
    { name: 'São Paulo', players: '720', color: 'tricolor', icon: trophyOutline },
  ];

  // Helper para dar uma cor e icone aleatório já que o banco só tem o Nome
  const getCardStyle = (index: number) => {
    const styles = [
      { color: 'red-grad', icon: flameOutline },
      { color: 'green-flat', icon: footballOutline },
      { color: 'black-flat', icon: shieldCheckmarkOutline },
      { color: 'orange-flat', icon: trophyOutline },
      { color: 'purple-flat', icon: globeOutline },
    ];
    // Repete os estilos se tiver muitos times
    return styles[index % styles.length];
  };

  return (
    <IonPage>
      <IonContent fullscreen className="home-bg">

        {/* CABEÇALHO */}
        <div className="home-header">
          <div className="user-info">
            <IonAvatar className="small-avatar">
              <img src="https://ionicframework.com/docs/img/demos/avatar.svg" alt="Avatar" />
            </IonAvatar>
            <div className="user-text">
              <h3>{user?.email || 'Jogador'}</h3>
              <p>🏆 Nível {level} &nbsp; 🔥 {seqCount}</p>
            </div>
          </div>
          <TopRightBar coins={coins} onInvite={() => history.push('/app/invite')} />
        </div>

        {/* STATUS */}
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
                  <h4>{seqCount}</h4>
                  <p>Sequência</p>
                </div>
              </IonCol>
              <IonCol size="4">
                <div className="mini-stat-card">
                  <IonIcon icon={locateOutline} className="green-icon" />
                  <h4>{accuracy}%</h4>
                  <p>Acertos</p>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>

        <div className="content-padding">

          {/* BANNERS */}
          <div className="section-header">
            <h3>Comece a Jogar</h3>
            <p>Escolha seu modo de jogo favorito</p>
          </div>

          <div className="game-card green-card is-clickable hover-scale" onClick={() => history.push('/game/quiz')}>
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


          {/* --- AQUI ESTÁ A INTEGRAÇÃO COM O STRAPI --- */}
          <div className="section-header mt-4">
            <h3>Explorar Categorias</h3>
            <p>Jogue com seu time</p>
            {/* <p>Times vindos do Strapi (Database)</p> */}
          </div>
          <IonSearchbar placeholder="Buscar time, competição..." className="custom-search" />

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <IonSpinner name="crescent" />
              <p>Carregando times...</p>
            </div>
          ) : (
            <IonGrid className="categories-grid">
              <IonRow>
                {/* Loop nos dados que vieram do Strapi */}
                {categories.map((item, index) => {
                  const style = getCardStyle(index); // Pega uma cor aleatória
                  return (
                    <IonCol size="6" key={item.id}>
                      {/* Removi a classe 'is-disabled' para parecer ativo */}
                      <div className={`category-card ${style.color}`}>
                        {/* Se quiser mostrar o ID para testar: <div className="soon-tag">ID: {item.id}</div> */}
                        <IonIcon icon={style.icon} />
                        <h4>{item.Nome}</h4>
                        <span className="pill">10 perguntas</span>
                      </div>
                    </IonCol>
                  );
                })}
              </IonRow>
            </IonGrid>
          )}
          {/* ------------------------------------------- */}

          {/* MAIS JOGADOS */}
          <div className="section-header mt-4">
            <h3>Mais Jogados</h3>
            <p>Os times mais populares entre os jogadores</p>
          </div>

          <div className="horizontal-scroll">
            {teams.map((team, index) => (
              <div key={index} className={`team-card ${team.color} is-disabled`}>
                <div className="soon-tag">Em breve!</div>
                <div className="star-icon">★</div>
                <IonIcon icon={team.icon} className="team-icon" />
                <h4>{team.name}</h4>
                <div className="player-count">Jogadores <strong>{team.players}</strong></div>
              </div>
            ))}
          </div>

          <div style={{ height: '60px' }}></div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;