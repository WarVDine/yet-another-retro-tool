import { useParams, Link } from 'react-router-dom'

export function RetroPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div>
      <h1>Retrospective: {id}</h1>
      <p>This is where the retrospective session will take place.</p>
      <div className="card">
        <h2>Retro Sections</h2>
        <div>
          <h3>What went well?</h3>
          <p>Add your positive feedback here...</p>
        </div>
        <div>
          <h3>What could be improved?</h3>
          <p>Add areas for improvement here...</p>
        </div>
        <div>
          <h3>Action items</h3>
          <p>Add action items for next sprint here...</p>
        </div>
      </div>
      <Link to="/">← Back to Home</Link>
    </div>
  )
}