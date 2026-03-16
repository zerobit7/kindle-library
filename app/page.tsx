'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Book {
  id: string
  title: string
  author: string
  cover_url: string
  isbn: string
  status: string
  rating: number
  note: string
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  da_leggere: 'Da leggere',
  in_lettura: 'In lettura',
  letto: 'Letto',
}

const STATUS_COLORS: Record<string, string> = {
  da_leggere: '#6366f1',
  in_lettura: '#f59e0b',
  letto: '#10b981',
}

function BookCard({ book, onDelete, onMarkRead }: {
  book: Book
  onDelete: (id: string) => void
  onMarkRead: (id: string) => void
}) {
  const router = useRouter()
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const [offsetX, setOffsetX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const [action, setAction] = useState<'delete' | 'read' | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    setSwiping(true)
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current
    if (Math.abs(dy) > Math.abs(dx)) return
    setOffsetX(dx)
    if (dx < -60) setAction('delete')
    else if (dx > 60) setAction('read')
    else setAction(null)
  }

  function handleTouchEnd() {
    setSwiping(false)
    if (action === 'delete') {
      if (confirm('Eliminare questo libro?')) {
        onDelete(book.id)
      }
    } else if (action === 'read') {
      onMarkRead(book.id)
    }
    setOffsetX(0)
    setAction(null)
  }

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
      {action === 'delete' && (
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: '100%',
          background: '#ef4444', display: 'flex', alignItems: 'center',
          justifyContent: 'flex-end', paddingRight: 20, borderRadius: 12
        }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>🗑 Elimina</span>
        </div>
      )}
      {action === 'read' && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%',
          background: '#10b981', display: 'flex', alignItems: 'center',
          justifyContent: 'flex-start', paddingLeft: 20, borderRadius: 12
        }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>✓ Letto</span>
        </div>
      )}
      <div
        onClick={() => { if (offsetX === 0) router.push(`/book/${book.id}`) }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          display: 'flex', gap: 12, background: 'white', borderRadius: 12,
          padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', alignItems: 'center',
          cursor: 'pointer', transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.3s ease',
          position: 'relative', zIndex: 1
        }}
      >
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} style={{ width: 50, height: 70, objectFit: 'cover', borderRadius: 6 }} />
        ) : (
          <div style={{ width: 50, height: 70, background: '#e5e7eb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📖</div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>{book.title}</div>
          <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>{book.author}</div>
          <div style={{
            display: 'inline-block', marginTop: 6, padding: '2px 10px',
            borderRadius: 20, fontSize: 12, fontWeight: 500,
            background: STATUS_COLORS[book.status] + '22',
            color: STATUS_COLORS[book.status]
          }}>
            {STATUS_LABELS[book.status]}
          </div>
        </div>
        {book.rating > 0 && <div style={{ fontSize: 18 }}>{'⭐'.repeat(book.rating)}</div>}
      </div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [filter, setFilter] = useState<string>('tutti')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchBooks()
  }, [])

  async function fetchBooks() {
    const { data } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
    setBooks(data || [])
    setLoading(false)
  }

  async function deleteBook(id: string) {
    await supabase.from('books').delete().eq('id', id)
    setBooks(prev => prev.filter(b => b.id !== id))
  }

  async function markAsRead(id: string) {
    await supabase.from('books').update({ status: 'letto' }).eq('id', id)
    setBooks(prev => prev.map(b => b.id === id ? { ...b, status: 'letto' } : b))
  }

  const filtered = filter === 'tutti' ? books : books.filter(b => b.status === filter)

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>📚 La mia libreria</h1>
        <button onClick={() => router.push('/add')} style={{
          background: '#6366f1', color: 'white', padding: '10px 16px',
          borderRadius: 10, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer'
        }}>
          + Aggiungi
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['tutti', 'da_leggere', 'in_lettura', 'letto'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: filter === s ? '#6366f1' : '#e5e7eb',
            color: filter === s ? 'white' : '#374151',
            fontWeight: 500, fontSize: 14
          }}>
            {s === 'tutti' ? 'Tutti' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: 60 }}>
          Nessun libro qui.
        </p>
      )}

      {loading && <p style={{ color: '#9ca3af' }}>Caricamento...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(book => (
          <BookCard
            key={book.id}
            book={book}
            onDelete={deleteBook}
            onMarkRead={markAsRead}
          />
        ))}
      </div>

      {!loading && filtered.length > 0 && (
        <p style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
          Swipe → per segnare come letto · Swipe ← per eliminare
        </p>
      )}
    </main>
  )
}