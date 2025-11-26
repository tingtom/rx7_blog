'use client'

export default function Loading() {
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#101112'
    }}>
      <div style={{
        fontSize: '1.5em',
        fontWeight: 'bold',
        color: 'white'
      }}>
        Loading Studio...
      </div>
    </div>
  )
}
