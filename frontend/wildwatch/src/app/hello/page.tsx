export default function HelloPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Hello World!</h1>
      <p>If you can see this, your Next.js app is working!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  )
}
