import Dashboard from './Dashboard'

function GroupOneIntro() {
  return (
    <div className="daily-practices">
      <h3>Materiale quotidiano</h3>
      <h3 style={{ color: 'red' }}>Recupera sempre la lezione entro il giorno successivo se non hai partecipato in presenza.</h3>
      <h2>PRATICHE QUOTIDIANE</h2>
      <ul className="daily-practices-list">
        <li>
          <strong>PRATICA FORMALE</strong>: Ogni giorno, praticare la meditazione sulla sfera mentale con la traccia audio.
        </li>
        <li>
          <strong>PRATICA INFORMALE</strong>: Durante la giornata, notare se qualche volta capita di essere fortemente immedesimate/i in uno stato mentale (emozione, giudizio, convinzione, bisogno etc.) ma poi, dopo qualche minuto, senza particolari ragioni esterne, quello stato appare lontano o poco rilevante. Notare che cosa cambia quando ci si disidentifica da quello stato.
        </li>
        <li>
          <strong>TASK CONTEMPLATIVO</strong>: Esplora lo spazio della mente entro il quale sorgono e si dissolvono i vari contenuti mentali: ha delle qualita che lo caratterizzano? Se si, prova a descriverle.
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
        Chi desiderasse ascoltare la traccia audio riprodotta durante il terzo incontro, ecco il link:{' '}
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
