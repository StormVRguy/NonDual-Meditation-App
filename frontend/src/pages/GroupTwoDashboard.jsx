import Dashboard from './Dashboard'

function GroupTwoIntro() {
  return (
    <div className="daily-practices">
      <h3>Percorso quotidiano</h3>
      <h3 style={{ color: 'red' }}>Se salti una sessione in presenza, completa il recupero video entro il giorno successivo.</h3>
      <h2>PRATICHE QUOTIDIANE</h2>
      <ul className="daily-practices-list">
        <li>
          <strong>MEDITAZIONE FORMALE</strong>: Praticare il body-scan ogni giorno, seguendo la traccia audio.
        </li>
        <li>
          <strong>MEDITAZIONE INFORMALE</strong>: Durante la giornata, concedersi qualche momento di consapevolezza - qualche minuto per lasciare andare ogni pensiero e attivita, e prendere consapevolezza di corpo, respiro, stato d’animo e ambiente circostante.
        </li>
      </ul>
    </div>
  )
}

function GroupTwoDashboard({ onLogout }) {
  return (
    <Dashboard
      onLogout={onLogout}
      pageTitle="Dashboard del Corso di Meditazione Non Duale"
      introContent={<GroupTwoIntro />}
    />
  )
}

export default GroupTwoDashboard
