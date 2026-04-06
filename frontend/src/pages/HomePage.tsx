import { useState } from 'react'
import { Link } from 'react-router-dom'

export function HomePage() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>Yet Another Retro Tool</h1>
      <div className="card">
        <p>Welcome to your retrospective tool!</p>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          <Link to="/retro/demo">Go to Demo Retro</Link>
        </p>
        <p>
          Edit <code>src/pages/HomePage.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}