'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Author {
    id: string
    name: string
    email: string
    bio: string | null
    nationality: string | null
    birthYear: number | null
    createdAt: string
    updatedAt: string
    _count?: {
        books: number
    }
}

interface Stats {
    totalAuthors: number
    totalBooks: number
}

export default function Home() {
    const [authors, setAuthors] = useState<Author[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingAuthor, setEditingAuthor] = useState<Author | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        bio: '',
        nationality: '',
        birthYear: '',
    })
    const [stats, setStats] = useState<Stats>({ totalAuthors: 0, totalBooks: 0 })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const fetchAuthors = useCallback(async () => {
        try {
            const res = await fetch('/api/authors')
            if (res.ok) {
                const data = await res.json()
                setAuthors(data)
                setStats({
                    totalAuthors: data.length,
                    totalBooks: data.reduce((sum: number, a: Author) => sum + (a._count?.books || 0), 0),
                })
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAuthors()
    }, [fetchAuthors])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            const url = editingAuthor ? `/api/authors/${editingAuthor.id}` : '/api/authors'
            const method = editingAuthor ? 'PUT' : 'POST'

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

            setFormData({ name: '', email: '', bio: '', nationality: '', birthYear: '' })
            setShowForm(false)
            setEditingAuthor(null)
            fetchAuthors()
        } catch (err) {
            setError('Error de conexión')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = (author: Author) => {
        setEditingAuthor(author)
        setFormData({
            name: author.name,
            email: author.email,
            bio: author.bio || '',
            nationality: author.nationality || '',
            birthYear: author.birthYear?.toString() || '',
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este autor?')) return

        try {
            const res = await fetch(`/api/authors/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchAuthors()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleCancel = () => {
        setShowForm(false)
        setEditingAuthor(null)
        setFormData({ name: '', email: '', bio: '', nationality: '', birthYear: '' })
        setError('')
    }

    return (
        <div className="min-h-screen bg-surface">
            <nav className="bg-surface-elevated border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-text-primary">Biblioteca</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/books" className="text-text-secondary hover:text-text-primary">
                                Libros
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-surface-elevated rounded-lg shadow p-6">
                        <div className="text-sm font-medium text-text-muted">Total Autores</div>
                        <div className="mt-2 text-3xl font-bold text-text-primary">{stats.totalAuthors}</div>
                    </div>
                    <div className="bg-surface-elevated rounded-lg shadow p-6">
                        <div className="text-sm font-medium text-text-muted">Total Libros</div>
                        <div className="mt-2 text-3xl font-bold text-text-primary">{stats.totalBooks}</div>
                    </div>
                </div>

                <div className="bg-surface-elevated rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-text-primary">Autores</h2>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                        >
                            + Nuevo Autor
                        </button>
                    </div>

                    {showForm && (
                        <form onSubmit={handleSubmit} className="px-6 py-4 border-b border-border bg-surface">
                            <h3 className="text-md font-medium text-text-primary mb-4">
                                {editingAuthor ? 'Editar Autor' : 'Nuevo Autor'}
                            </h3>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-text-primary bg-surface-elevated"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-text-primary bg-surface-elevated"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Nacionalidad</label>
                                    <input
                                        type="text"
                                        value={formData.nationality}
                                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-text-primary bg-surface-elevated"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Año de nacimiento</label>
                                    <input
                                        type="number"
                                        value={formData.birthYear}
                                        onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-text-primary bg-surface-elevated"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Biografía</label>
                                    <textarea
                                        rows={3}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-text-primary bg-surface-elevated"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-surface"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Guardando...' : editingAuthor ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    )}

                    {loading ? (
                        <div className="px-6 py-12 text-center text-text-muted">Cargando...</div>
                    ) : authors.length === 0 ? (
                        <div className="px-6 py-12 text-center text-text-muted">
                            No hay autores registrados
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Nombre</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Libros</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {authors.map((author) => (
                                        <tr key={author.id} className="hover:bg-surface">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-text-primary">{author.name}</div>
                                                {author.nationality && (
                                                    <div className="text-sm text-text-muted">{author.nationality}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary">{author.email}</td>
                                            <td className="px-6 py-4 text-text-secondary">{author._count?.books || 0}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={`/authors/${author.id}`}
                                                        className="text-primary-600 hover:text-primary-800 text-sm"
                                                    >
                                                        Ver
                                                    </Link>
                                                    <button
                                                        onClick={() => handleEdit(author)}
                                                        className="text-text-secondary hover:text-gray-800 text-sm"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(author.id)}
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
