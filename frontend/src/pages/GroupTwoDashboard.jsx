import Dashboard from './Dashboard'

function GroupTwoIntro() {
  return (
    <div className="daily-practices">
      <h3 style={{ color: 'red' }}>Se salti una sessione in presenza, completa il recupero video entro il giorno successivo.</h3>
      <h2>PRATICHE QUOTIDIANE</h2>
      <ul className="daily-practices-list">
        <li>
          <strong>PRATICA FORMALE</strong>: Ogni giorno, praticare la meditazione seduta seguendo la traccia audio.
        </li>
        <li>
          <strong>PRATICA INFORMALE</strong>: Durante la giornata, concedersi qualche momento di consapevolezza – 2 o 3 minuti, anche più volte – per lasciare andare ogni attività, e prendere consapevolezza delle varie dimensioni (tattile, olfattiva, etc.) che costituiscono la propria esperienza in quel frangente.
        </li>
        <li>
          <strong>TASK CONTEMPLATIVO</strong>: Prova a interrogarti sulla dimensione mentale/interiore: quali forme può assumere (es. pensiero discorsivo, immagini mentali, etc.)? Può essere utile prendere qualche appunto per annotare quelle che noti grazie alle sessioni di meditazione e quelle che scorgi nel corso della giornata.
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
      showBodyScanMeditation={false}
      showAdditionalLecture={false}
      questionnaireSurveyUrl={import.meta.env.VITE_QUALTRICS_SURVEY_URL_2}
    />
  )
}

export default GroupTwoDashboard
