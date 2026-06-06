'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Author {
    id: string
    name: string
    email: string
    bio: string | null
    nationality: string | null
    birthYear: number | null
    createdAt: string
    updatedAt: string
    _count?: { books: number }
}

interface Book {
    id: string
    title: string
    description: string | null
    isbn: string | null
    publishedYear: number | null
    genre: string | null
    pages: number | null
    authorId: string
    createdAt: string
    updatedAt: string
}

interface AuthorStats {
    authorId: string
    authorName: string
    totalBooks: number
    firstBook: { title: string; year: number } | null
    latestBook: { title: string; year: number } | null
    averagePages: number
    genres: string[]
    longestBook: { title: string; pages: number } | null
    shortestBook: { title: string; pages: number } | null
}

export default function AuthorDetailPage() {
    const params = useParams()
    const authorId = params.id as string

    const [author, setAuthor] = useState<Author | null>(null)
    const [books, setBooks] = useState<Book[]>([])
    const [stats, setStats] = useState<AuthorStats | null>(null)
    const [loading, setLoading] = useState(true)

    const [editing, setEditing] = useState(false)
    const [formData, setFormData] = useState({
        name: '', email: '', bio: '', nationality: '', birthYear: ''
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [showBookForm, setShowBookForm] = useState(false)
    const [bookFormData, setBookFormData] = useState({
        title: '', description: '', isbn: '', publishedYear: '', genre: '', pages: ''
    })

    const fetchData = useCallback(async () => {
        try {
            const [authorRes, statsRes] = await Promise.all([
                fetch(`/api/authors/${authorId}`),
                fetch(`/api/authors/${authorId}/stats`),
            ])

            if (authorRes.ok) {
                const data = await authorRes.json()
                setAuthor(data)
                setBooks(data.books || [])
                setFormData({
                    name: data.name,
                    email: data.email,
                    bio: data.bio || '',
                    nationality: data.nationality || '',
                    birthYear: data.birthYear?.toString() || '',
                })
            }

            if (statsRes.ok) {
                const data = await statsRes.json()
                setStats(data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [authorId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleUpdateAuthor = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            const res = await fetch(`/api/authors/${authorId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Error al actualizar')
                return
            }

            setEditing(false)
            fetchData()
        } catch (err) {
            setError('Error de conexión')
        } finally {
            setSubmitting(false)
        }
    }

    const handleAddBook = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            const res = await fetch('/api/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...bookFormData, authorId }),
            })

            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Error al crear libro')
                return
            }

            setShowBookForm(false)
            setBookFormData({ title: '', description: '', isbn: '', publishedYear: '', genre: '', pages: '' })
            fetchData()
        } catch (err) {
            setError('Error de conexión')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteBook = async (bookId: string) => {
        if (!confirm('¿Eliminar este libro?')) return
        try {
            const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' })
            if (res.ok) fetchData()
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="text-text-muted">Cargando...</div>
            </div>
        )
    }

    if (!author) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-text-primary mb-2">Autor no encontrado</h1>
                    <Link href="/" className="text-primary-600 hover:underline">← Volver al inicio</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-surface">
            <nav className="bg-surface-elevated border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-text-secondary hover:text-text-primary">
                                ← Dashboard
                            </Link>
                            <h1 className="text-xl font-bold text-text-primary">{author.name}</h1>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-surface-elevated rounded-lg shadow p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-lg font-semibold text-text-primary">Información</h2>
                                <button
                                    onClick={() => setEditing(!editing)}
                                    className="text-sm text-primary-600 hover:text-primary-800"
                                >
                                    {editing ? 'Cancelar' : 'Editar'}
                                </button>
                            </div>

                            {editing ? (
                                <form onSubmit={handleUpdateAuthor} className="space-y-4">
                                    {error && (
                                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                            {error}
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Nombre</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Nacionalidad</label>
                                        <input
                                            type="text"
                                            value={formData.nationality}
                                            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Año nacimiento</label>
                                        <input
                                            type="number"
                                            value={formData.birthYear}
                                            onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Biografía</label>
                                        <textarea
                                            rows={4}
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                    >
                                        {submitting ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm text-text-muted">Email</span>
                                        <p className="text-text-primary">{author.email}</p>
                                    </div>
                                    {author.nationality && (
                                        <div>
                                            <span className="text-sm text-text-muted">Nacionalidad</span>
                                            <p className="text-text-primary">{author.nationality}</p>
                                        </div>
                                    )}
                                    {author.birthYear && (
                                        <div>
                                            <span className="text-sm text-text-muted">Año de nacimiento</span>
                                            <p className="text-text-primary">{author.birthYear}</p>
                                        </div>
                                    )}
                                    {author.bio && (
                                        <div>
                                            <span className="text-sm text-text-muted">Biografía</span>
                                            <p className="text-text-primary whitespace-pre-wrap">{author.bio}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {stats && (
                            <div className="bg-surface-elevated rounded-lg shadow p-6 mt-6">
                                <h2 className="text-lg font-semibold text-text-primary mb-4">Estadísticas</h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Total libros</span>
                                        <span className="font-semibold">{stats.totalBooks}</span>
                                    </div>
                                    {stats.firstBook && (
                                        <div>
                                            <span className="text-text-muted">Primer libro</span>
                                            <p className="text-text-primary">{stats.firstBook.title} ({stats.firstBook.year})</p>
                                        </div>
                                    )}
                                    {stats.latestBook && (
                                        <div>
                                            <span className="text-text-muted">Último libro</span>
                                            <p className="text-text-primary">{stats.latestBook.title} ({stats.latestBook.year})</p>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Promedio páginas</span>
                                        <span className="font-semibold">{stats.averagePages}</span>
                                    </div>
                                    {stats.longestBook && (
                                        <div>
                                            <span className="text-text-muted">Libro más largo</span>
                                            <p className="text-text-primary">{stats.longestBook.title} ({stats.longestBook.pages} pág.)</p>
                                        </div>
                                    )}
                                    {stats.shortestBook && (
                                        <div>
                                            <span className="text-text-muted">Libro más corto</span>
                                            <p className="text-text-primary">{stats.shortestBook.title} ({stats.shortestBook.pages} pág.)</p>
                                        </div>
                                    )}
                                    {stats.genres.length > 0 && (
                                        <div>
                                            <span className="text-text-muted">Géneros</span>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {stats.genres.map((genre) => (
                                                    <span key={genre} className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs">
                                                        {genre}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-surface-elevated rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-text-primary">
                                    Libros ({books.length})
                                </h2>
                                <button
                                    onClick={() => setShowBookForm(!showBookForm)}
                                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm"
                                >
                                    + Agregar Libro
                                </button>
                            </div>

                            {showBookForm && (
                                <form onSubmit={handleAddBook} className="px-6 py-4 border-b border-border bg-surface">
                                    {error && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                            {error}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-1">Título *</label>
                                            <input
                                                type="text"
                                                required
                                                value={bookFormData.title}
                                                onChange={(e) => setBookFormData({ ...bookFormData, title: e.target.value })}
                                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-1">Género</label>
                                            <input
                                                type="text"
                                                value={bookFormData.genre}
                                                onChange={(e) => setBookFormData({ ...bookFormData, genre: e.target.value })}
                                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-1">Año</label>
                                            <input
                                                type="number"
                                                value={bookFormData.publishedYear}
                                                onChange={(e) => setBookFormData({ ...bookFormData, publishedYear: e.target.value })}
                                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-1">Páginas</label>
                                            <input
                                                type="number"
                                                value={bookFormData.pages}
                                                onChange={(e) => setBookFormData({ ...bookFormData, pages: e.target.value })}
                                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-1">ISBN</label>
                                            <input
                                                type="text"
                                                value={bookFormData.isbn}
                                                onChange={(e) => setBookFormData({ ...bookFormData, isbn: e.target.value })}
                                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-text-secondary mb-1">Descripción</label>
                                            <textarea
                                                rows={2}
                                                value={bookFormData.description}
                                                onChange={(e) => setBookFormData({ ...bookFormData, description: e.target.value })}
                                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setShowBookForm(false)}
                                            className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-surface"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                        >
                                            {submitting ? 'Creando...' : 'Crear Libro'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {books.length === 0 ? (
                                <div className="px-6 py-12 text-center text-text-muted">
                                    No hay libros registrados
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {books.map((book) => (
                                        <div key={book.id} className="px-6 py-4 hover:bg-surface">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-medium text-text-primary">{book.title}</h3>
                                                    <div className="mt-1 flex gap-4 text-sm text-text-muted">
                                                        {book.genre && <span>{book.genre}</span>}
                                                        {book.publishedYear && <span>{book.publishedYear}</span>}
                                                        {book.pages && <span>{book.pages} páginas</span>}
                                                    </div>
                                                    {book.description && (
                                                        <p className="mt-2 text-sm text-text-secondary">{book.description}</p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteBook(book.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm ml-4"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
