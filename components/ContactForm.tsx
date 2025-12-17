'use client'

import { useState } from 'react'

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    // Simulate submission
    setTimeout(() => setStatus('success'), 1500)
  }

  if (status === 'success') {
    return (
      <div className="text-center py-20 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
        <h3 className="text-2xl font-bold mb-2">Message Sent</h3>
        <p className="text-neutral-500">I will get back to you shortly.</p>
        <button 
          onClick={() => setStatus('idle')}
          className="mt-6 text-sm underline opacity-50 hover:opacity-100"
        >
          Send another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
      <div className="space-y-2">
        <label htmlFor="name" className="text-xs uppercase tracking-widest opacity-70">Name</label>
        <input 
          id="name" 
          type="text" 
          required
          className="w-full bg-transparent border-b border-neutral-300 dark:border-neutral-700 py-2 focus:outline-none focus:border-black dark:focus:border-white transition-colors text-lg"
          placeholder="Your name"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="email" className="text-xs uppercase tracking-widest opacity-70">Email</label>
        <input 
          id="email" 
          type="email" 
          required
          className="w-full bg-transparent border-b border-neutral-300 dark:border-neutral-700 py-2 focus:outline-none focus:border-black dark:focus:border-white transition-colors text-lg"
          placeholder="your@email.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-xs uppercase tracking-widest opacity-70">Message</label>
        <textarea 
          id="message" 
          required
          rows={4}
          className="w-full bg-transparent border-b border-neutral-300 dark:border-neutral-700 py-2 focus:outline-none focus:border-black dark:focus:border-white transition-colors text-lg resize-none"
          placeholder="Tell me about your project..."
        />
      </div>

      <button 
        type="submit"
        disabled={status === 'submitting'}
        className="w-full bg-black dark:bg-white text-white dark:text-black py-4 uppercase tracking-widest font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {status === 'submitting' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}
