'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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

export default function Home() {
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

  const filtered = filter === 'tutti' ? books : books.filter(b => b.status === filter)

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>📚 La mia libreria</h1>
        <Link href="/add" style={{
          background: '#6366f1', color: 'white', padding: '10px 16px',
          borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14
        }}>
          + Aggiungi
        </Link>
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

      {loading && <p style={{ color: '#9ca3af' }}>Caricamento...</p>}

      {!loading && filtered.length === 0 && (
        <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: 60 }}>
          Nessun libro qui. <Link href="/add">Aggiungine uno!</Link>
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(book => (
          <Link key={book.id} href={`/book/${book.id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', gap: 12, background: 'white', borderRadius: 12,
              padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', alignItems: 'center'
            }}>
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
              {book.rating && <div style={{ fontSize: 18 }}>{'⭐'.repeat(book.rating)}</div>}
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}