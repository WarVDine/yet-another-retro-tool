import { Routes, Route } from 'react-router-dom'

import { GuestUserProvider } from '@/contexts/GuestUserContext'
import { GuestUserModal } from '@/components/GuestUserModal'
import { CreateRetroPage } from '@/pages/CreateRetroPage'
import { HomePage } from '@/pages/HomePage'
import { RetroPage } from '@/pages/RetroPage'
import './App.css'

export function App() {
  return (
    <GuestUserProvider>
      <div className='App'>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/create' element={<CreateRetroPage />} />
          <Route path='/retro/:id' element={<RetroPage />} />
        </Routes>
        <GuestUserModal />
      </div>
    </GuestUserProvider>
  )
}
