'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

interface Book {
  id: string
  title: string
  author: string
  cover_url: string
  isbn: string
  status: string
  rating: number
  note: string
}

const STATUS_LABELS: Record<string, string> = {
  da_leggere: 'Da leggere',
  in_lettura: 'In lettura',
  letto: 'Letto',
}

const TELEGRAM_BOT = 'ZlibFPMybot'

export default function BookDetail() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [book, setBook] = useState<Book | null>(null)
  const [note, setNote] = useState('')
  const [rating, setRating] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchBook()
  }, [])

  async function fetchBook() {
    const { data } = await supabase.from('books').select('*').eq('id', id).single()
    if (data) {
      setBook(data)
      setNote(data.note || '')
      setRating(data.rating || 0)
    }
  }

  async function updateStatus(status: string) {
    await supabase.from('books').update({ status }).eq('id', id)
    setBook(prev => prev ? { ...prev, status } : prev)
  }

  async function saveNoteAndRating() {
    setSaving(true)
    await supabase.from('books').update({ note, rating }).eq('id', id)
    setSaving(false)
  }

  async function deleteBook() {
    if (!confirm('Sei sicuro di voler eliminare questo libro?')) return
    await supabase.from('books').delete().eq('id', id)
    router.push('/')
  }

  function openTelegram() {
    if (!book) return
    const message = encodeURIComponent(`${book.title} ${book.author}`)
    window.open(`https://t.me/${TELEGRAM_BOT}?text=${message}`, '_blank')
  }

  if (!book) return <p style={{ padding: 20, color: '#9ca3af' }}>Caricamento...</p>

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push('/')} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 20
        }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, flex: 1 }}>{book.title}</h1>
        <button onClick={deleteBook} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#ef4444'
        }}>🗑</button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} style={{ width: 80, height: 115, objectFit: 'cover', borderRadius: 8 }} />
        ) : (
          <div style={{ width: 80, height: 115, background: '#e5e7eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📖</div>
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#111827' }}>{book.title}</div>
          <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{book.author}</div>
          {book.isbn && <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>ISBN: {book.isbn}</div>}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>STATO</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => updateStatus(key)} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: '2px solid',
              borderColor: book.status === key ? '#6366f1' : '#e5e7eb',
              background: book.status === key ? '#6366f1' : 'white',
              color: book.status === key ? 'white' : '#374151',
              fontWeight: 600, fontSize: 13, cursor: 'pointer'
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={openTelegram} style={{
        width: '100%', padding: '14px', background: '#0088cc', color: 'white',
        border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
        cursor: 'pointer', marginBottom: 20
      }}>
        ✈️ Cerca su Telegram
      </button>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>VOTO</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button key={star} onClick={() => setRating(star)} style={{
              fontSize: 28, background: 'none', border: 'none', cursor: 'pointer',
              opacity: star <= rating ? 1 : 0.3
            }}>⭐</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>NOTE</div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Aggiungi una nota..."
          rows={4}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e5e7eb',
            fontSize: 15, resize: 'vertical', boxSizing: 'border-box'
          }}
        />
      </div>

      <button onClick={saveNoteAndRating} disabled={saving} style={{
        width: '100%', padding: '14px', background: '#10b981', color: 'white',
        border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer'
      }}>
        {saving ? 'Salvataggio...' : '✓ Salva note e voto'}
      </button>
    </main>
  )
}