import { DutySignUp } from './DutySignUp'
import './styles.css'
import { availableDuties } from './utils/duties'

export function App() {
  return (
    <>
      <h1>Duty sign-up</h1>
      <DutySignUp availableDuties={availableDuties} />
    </>
  )
}
