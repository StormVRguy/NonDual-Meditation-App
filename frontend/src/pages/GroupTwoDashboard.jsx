import Dashboard from './Dashboard'
import { dashboardFeatures } from '../config/dashboardFeatures'
import { qualtricsSurveyUrls } from '../config/qualtricsSurveyUrls'

function GroupTwoIntro() {
  return (
    <div className="daily-practices">
      <h3 style={{ color: 'red' }}>Se salti una sessione in presenza, completa il recupero video entro il giorno successivo.</h3>
      <h2>PRATICHE QUOTIDIANE</h2>
      <ul className="daily-practices-list">
        <li>
          <strong>PRATICA FORMALE</strong>: Praticare ogni giorno seguendo la traccia audio.
        </li>
        <li>
          <strong>TASK CONTEMPLATIVO</strong>
          <p>
            Qualche volta provare ad addormentarsi osservando la mente, proprio come facciamo in meditazione, ma senza contrastare il processo di addormentamento. Meglio se questa esplorazione è svolta in una delle seguenti circostanze: dopo un risveglio notturno; al mattino; oppure di pomeriggio. Ciò ha due scopi:
          </p>
          <ul>
            <li>
              È di per sé interessante osservare la mente durante lo stato in cui i sensi sono quasi sopiti e le forme consuete di attività mentale cedono il passo a processi interiori più vividi e bizzarri – benché non facili da contemplare senza perdere coscienza.
            </li>
            <li>
              Questa attività potrebbe condurre, senza ulteriori pratiche, a sperimentare sogni lucidi (o comunque sogni più vividi e consapevoli del consueto), associati a questo tipo di meditazioni in varie fonti contemplative.
            </li>
          </ul>
        </li>
        <li>
          <strong>PRATICA INFORMALE</strong>: Possiamo provare a mantenere una relativa continuità di presenza durante le attività quotidiane, rafforzando la particolare forma di consapevolezza che stiamo scoprendo e coltivando nella pratica formale - la quale potrebbe essere descritta come lo &quot;spazio&quot; entro il quale sorgono e svaniscono i vari fenomeni dell&apos;esperienza, e che in ultima analisi non è neppure distinguibile da questi ultimi.
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
      {...dashboardFeatures.coreOnly}
      useDefaultQualtricsUrl={false}
      questionnaireSurveyUrl={qualtricsSurveyUrls.secondary}
    />
  )
}

export default GroupTwoDashboard
