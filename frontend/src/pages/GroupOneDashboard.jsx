import Dashboard from './Dashboard'

function GroupOneIntro() {
  return (
    <div className="daily-practices">
      <h3>Materiale quotidiano</h3>
      <h3 style={{ color: 'red' }}>Recupera sempre la lezione entro il giorno successivo se non hai partecipato in presenza.</h3>
      <h2>PRATICHE QUOTIDIANE</h2>
      <ul className="daily-practices-list">
        <li>
          <strong>PRATICA FORMALE</strong>: Ogni giorno, praticare la meditazione seduta seguendo la traccia audio.
        </li>
        <li>
          <strong>PRATICA INFORMALE</strong>: Durante la giornata, concedersi qualche momento di consapevolezza - 2 o 3 minuti, anche piu volte - per lasciare andare ogni attivita, e prendere consapevolezza delle varie dimensioni (tattile, olfattiva, etc.) che costituiscono la propria esperienza in quel frangente.
        </li>
        <li>
          <strong>TASK CONTEMPLATIVO</strong>: Prova a interrogarti sulla dimensione mentale/interiore: quali forme puo assumere (es. pensiero discorsivo, immagini mentali, etc.)? Puo essere utile prendere qualche appunto per annotare quelle che noti grazie alle sessioni di meditazione e quelle che scorgi nel corso della giornata.
        </li>
      </ul>
    </div>
  )
}

function GroupOneExtras() {
  return (
    <div className="daily-practices">
      <h2>Approfondimento</h2>
      <p className="section-description">
        Chi desiderasse ascoltare la traccia audio riprodotta durante l'ultimo incontro, ecco il link:{' '}
        <a href="https://youtu.be/lvsrolNmfxY?is=-xODi5Q6PBpNlVWd" target="_blank" rel="noreferrer">
          https://youtu.be/lvsrolNmfxY?is=-xODi5Q6PBpNlVWd
        </a>
      </p>
    </div>
  )
}

function GroupOneDashboard({ onLogout }) {
  return (
    <Dashboard
      onLogout={onLogout}
      pageTitle="Dashboard del Corso di Meditazione Non Duale"
      introContent={<GroupOneIntro />}
      additionalContent={<GroupOneExtras />}
      showBodyScanMeditation={false}
    />
  )
}

export default GroupOneDashboard
