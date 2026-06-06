'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Book {
    id: string
    title: string
    description: string | null
    isbn: string | null
    publishedYear: number | null
    genre: string | null
    pages: number | null
    authorId: string
    author: {
        id: string
        name: string
        email: string
    }
    createdAt: string
    updatedAt: string
}

interface Author {
    id: string
    name: string
    email: string
    books?: Array<{ genre?: string | null }>
}

interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

export default function BooksPage() {
    const [books, setBooks] = useState<Book[]>([])
    const [authors, setAuthors] = useState<Author[]>([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState<Pagination>({
        page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false
    })

    const [search, setSearch] = useState('')
    const [genre, setGenre] = useState('')
    const [authorFilter, setAuthorFilter] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [order, setOrder] = useState('desc')

    const [showForm, setShowForm] = useState(false)
    const [editingBook, setEditingBook] = useState<Book | null>(null)
    const [formData, setFormData] = useState({
        title: '', description: '', isbn: '', publishedYear: '', genre: '', pages: '', authorId: ''
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [genres, setGenres] = useState<string[]>([])

    const fetchBooks = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                sortBy,
                order,
            })
            if (search) params.set('search', search)
            if (genre) params.set('genre', genre)
            if (authorFilter) params.set('authorName', authorFilter)

            const res = await fetch(`/api/books/search?${params}`)
            if (res.ok) {
                const data = await res.json()
                setBooks(data.data)
                setPagination(data.pagination)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [pagination.page, pagination.limit, search, genre, authorFilter, sortBy, order])

    const fetchAuthors = useCallback(async () => {
        try {
            const res = await fetch('/api/authors')
            if (res.ok) {
                const data: Author[] = await res.json()
                setAuthors(data)
                const uniqueGenres = [...new Set(data.flatMap((a) => a.books?.map((b) => b.genre) || []))].filter(Boolean) as string[]
                setGenres(uniqueGenres)
            }
        } catch (err) {
            console.error(err)
        }
    }, [])

    useEffect(() => {
        fetchAuthors()
    }, [fetchAuthors])

    useEffect(() => {
        fetchBooks()
    }, [fetchBooks])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            const url = editingBook ? `/api/books/${editingBook.id}` : '/api/books'
            const method = editingBook ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Error al guardar')
                return
            }

            setFormData({ title: '', description: '', isbn: '', publishedYear: '', genre: '', pages: '', authorId: '' })
            setShowForm(false)
            setEditingBook(null)
            fetchBooks()
        } catch (err) {
            setError('Error de conexión')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = (book: Book) => {
        setEditingBook(book)
        setFormData({
            title: book.title,
            description: book.description || '',
            isbn: book.isbn || '',
            publishedYear: book.publishedYear?.toString() || '',
            genre: book.genre || '',
            pages: book.pages?.toString() || '',
            authorId: book.authorId,
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este libro?')) return
        try {
            const res = await fetch(`/api/books/${id}`, { method: 'DELETE' })
            if (res.ok) fetchBooks()
        } catch (err) {
            console.error(err)
        }
    }

    const handleCancel = () => {
        setShowForm(false)
        setEditingBook(null)
        setFormData({ title: '', description: '', isbn: '', publishedYear: '', genre: '', pages: '', authorId: '' })
        setError('')
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPagination(prev => ({ ...prev, page: 1 }))
        fetchBooks()
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
                            <h1 className="text-xl font-bold text-text-primary">Libros</h1>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSearch} className="bg-surface-elevated rounded-lg shadow p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Buscar</label>
                            <input
                                type="text"
                                placeholder="Título..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Género</label>
                            <select
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                            >
                                <option value="">Todos</option>
                                {genres.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Autor</label>
                            <input
                                type="text"
                                placeholder="Nombre del autor..."
                                value={authorFilter}
                                onChange={(e) => setAuthorFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Ordenar por</label>
                            <div className="flex gap-2">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                >
                                    <option value="title">Título</option>
                                    <option value="publishedYear">Año</option>
                                    <option value="createdAt">Fecha creación</option>
                                </select>
                                <select
                                    value={order}
                                    onChange={(e) => setOrder(e.target.value)}
                                    className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                >
                                    <option value="desc">↓</option>
                                    <option value="asc">↑</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                        <span className="text-sm text-text-muted">{pagination.total} resultados</span>
                        <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                            Buscar
                        </button>
                    </div>
                </form>

                <div className="bg-surface-elevated rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-text-primary">
                            {showForm ? (editingBook ? 'Editar Libro' : 'Nuevo Libro') : 'Lista de Libros'}
                        </h2>
                        {!showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                            >
                                + Nuevo Libro
                            </button>
                        )}
                    </div>

                    {showForm && (
                        <form onSubmit={handleSubmit} className="px-6 py-4 border-b border-border bg-surface">
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                                    {error}
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Título *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Autor *</label>
                                    <select
                                        required
                                        value={formData.authorId}
                                        onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {authors.map((a) => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Género</label>
                                    <input
                                        type="text"
                                        value={formData.genre}
                                        onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Año</label>
                                    <input
                                        type="number"
                                        value={formData.publishedYear}
                                        onChange={(e) => setFormData({ ...formData, publishedYear: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Páginas</label>
                                    <input
                                        type="number"
                                        value={formData.pages}
                                        onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">ISBN</label>
                                    <input
                                        type="text"
                                        value={formData.isbn}
                                        onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                    />
                                </div>
                                <div className="md:col-span-2 lg:col-span-3">
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Descripción</label>
                                    <textarea
                                        rows={2}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-text-primary bg-surface-elevated"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2 justify-end">
                                <button type="button" onClick={handleCancel} className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-surface">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                                    {submitting ? 'Guardando...' : editingBook ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    )}

                    {loading ? (
                        <div className="px-6 py-12 text-center text-text-muted">Cargando...</div>
                    ) : books.length === 0 ? (
                        <div className="px-6 py-12 text-center text-text-muted">No se encontraron libros</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-surface">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Título</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Autor</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Género</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Año</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Páginas</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {books.map((book) => (
                                            <tr key={book.id} className="hover:bg-surface">
                                                <td className="px-6 py-4 font-medium text-text-primary">{book.title}</td>
                                                <td className="px-6 py-4 text-text-secondary">{book.author.name}</td>
                                                <td className="px-6 py-4 text-text-secondary">{book.genre || '-'}</td>
                                                <td className="px-6 py-4 text-text-secondary">{book.publishedYear || '-'}</td>
                                                <td className="px-6 py-4 text-text-secondary">{book.pages || '-'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleEdit(book)} className="text-text-secondary hover:text-gray-800 text-sm">Editar</button>
                                                        <button onClick={() => handleDelete(book.id)} className="text-red-600 hover:text-red-800 text-sm">Eliminar</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {pagination.totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-border flex justify-between items-center">
                                    <span className="text-sm text-text-muted">
                                        Página {pagination.page} de {pagination.totalPages}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                            disabled={!pagination.hasPrev}
                                            className="px-3 py-1 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface"
                                        >
                                            Anterior
                                        </button>
                                        <button
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                            disabled={!pagination.hasNext}
                                            className="px-3 py-1 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}
