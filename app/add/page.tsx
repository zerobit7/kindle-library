'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Html5Qrcode } from 'html5-qrcode'

interface BookData {
  title: string
  author: string
  cover_url: string
  isbn: string
}

export default function AddBook() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [bookData, setBookData] = useState<BookData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookData[]>([])
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  async function startScanner() {
    setError('')
    setScanning(true)
  }

  useEffect(() => {
    if (!scanning) return
    const scanner = new Html5Qrcode('reader')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      async (decodedText) => {
        await stopScanner()
        await fetchBookByIsbn(decodedText)
      },
      undefined
    ).catch(() => {
      setError('Impossibile accedere alla fotocamera.')
      setScanning(false)
    })
  }, [scanning])

  async function stopScanner() {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop()
    }
    setScanning(false)
  }

  async function fetchBookByIsbn(isbn: string) {
    setLoading(true)
    setError('')
    setResults([])
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`)
      const data = await res.json()
      if (data.items && data.items.length > 0) {
        const info = data.items[0].volumeInfo
        setBookData({
          title: info.title || '',
          author: info.authors ? info.authors.join(', ') : '',
          cover_url: info.imageLinks?.thumbnail || '',
          isbn,
        })
      } else {
        setError('Libro non trovato. Prova a cercarlo per titolo o autore.')
      }
    } catch {
      setError('Errore durante la ricerca del libro.')
    }
    setLoading(false)
  }

  async function handleSearch() {
    if (!query) return
    const isIsbn = /^[0-9]{10,13}$/.test(query.replace(/-/g, ''))
    if (isIsbn) {
      await fetchBookByIsbn(query)
      return
    }
    setLoading(true)
    setError('')
    setResults([])
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&key=${apiKey}`)
      const data = await res.json()
      if (data.items && data.items.length > 0) {
        const books = data.items.map((item: any) => {
          const info = item.volumeInfo
          return {
            title: info.title || '',
            author: info.authors ? info.authors.join(', ') : '',
            cover_url: info.imageLinks?.thumbnail || '',
            isbn: info.industryIdentifiers?.[0]?.identifier || '',
          }
        })
        setResults(books)
      } else {
        setError('Nessun libro trovato.')
      }
    } catch {
      setError('Errore durante la ricerca.')
    }
    setLoading(false)
  }

  async function saveBook(book: BookData) {
    setLoading(true)
    const { error } = await supabase.from('books').insert([{
      title: book.title,
      author: book.author,
      cover_url: book.cover_url,
      isbn: book.isbn,
      status: 'da_leggere',
    }])
    if (error) {
      setError('Errore durante il salvataggio.')
    } else {
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push('/')} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 20
        }}>←</button>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Aggiungi libro</h1>
      </div>

      {!bookData && !loading && (
        <>
          {!scanning ? (
            <button onClick={startScanner} style={{
              width: '100%', padding: '16px', background: '#6366f1', color: 'white',
              border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer',
              marginBottom: 16
            }}>
              📷 Scansiona barcode
            </button>
          ) : (
            <button onClick={stopScanner} style={{
              width: '100%', padding: '16px', background: '#e5e7eb', color: '#374151',
              border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer',
              marginBottom: 16
            }}>
              Stop
            </button>
          )}

          <div
            id="reader"
            style={{
              width: '100%',
              borderRadius: 12,
              overflow: 'hidden',
              display: scanning ? 'block' : 'none',
              marginBottom: 16
            }}
          />

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              type="text"
              placeholder="Titolo, autore o ISBN"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #e5e7eb',
                fontSize: 15
              }}
            />
            <button onClick={handleSearch} style={{
              padding: '12px 16px', background: '#6366f1', color: 'white',
              border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600
            }}>
              Cerca
            </button>
          </div>
        </>
      )}

      {loading && <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: 40 }}>Ricerca in corso...</p>}

      {error && <p style={{ color: '#ef4444', textAlign: 'center', marginTop: 16 }}>{error}</p>}

      {results.length > 0 && !bookData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          {results.map((book, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, background: 'white', borderRadius: 12,
              padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', alignItems: 'center',
              cursor: 'pointer'
            }} onClick={() => setBookData(book)}>
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} style={{ width: 45, height: 65, objectFit: 'cover', borderRadius: 6 }} />
              ) : (
                <div style={{ width: 45, height: 65, background: '#e5e7eb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📖</div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{book.title}</div>
                <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>{book.author}</div>
              </div>
              <div style={{ color: '#6366f1', fontSize: 20 }}>+</div>
            </div>
          ))}
        </div>
      )}

      {bookData && (
        <div style={{ marginTop: 20 }}>
          <div style={{
            display: 'flex', gap: 16, background: 'white', borderRadius: 12,
            padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20
          }}>
            {bookData.cover_url ? (
              <img src={bookData.cover_url} alt={bookData.title} style={{ width: 70, height: 100, objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              <div style={{ width: 70, height: 100, background: '#e5e7eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📖</div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{bookData.title}</div>
              <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{bookData.author}</div>
              {bookData.isbn && <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>ISBN: {bookData.isbn}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setBookData(null); setResults([]) }} style={{
              flex: 1, padding: '14px', background: '#e5e7eb', color: '#374151',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer'
            }}>
              ✕ Annulla
            </button>
            <button onClick={() => saveBook(bookData)} disabled={loading} style={{
              flex: 2, padding: '14px', background: '#6366f1', color: 'white',
              border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer'
            }}>
              ✓ Aggiungi alla libreria
            </button>
          </div>
        </div>
      )}
    </main>
  )
}