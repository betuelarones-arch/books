import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const author = await prisma.author.findUnique({
            where: { id },
        })

        if (!author) {
            return NextResponse.json(
                { error: 'Autor no encontrado' },
                { status: 404 }
            )
        }

        const books = await prisma.book.findMany({
            where: { authorId: id },
            select: {
                id: true,
                title: true,
                publishedYear: true,
                pages: true,
                genre: true,
            },
            orderBy: {
                publishedYear: 'asc',
            },
        })

        if (books.length === 0) {
            return NextResponse.json({
                authorId: author.id,
                authorName: author.name,
                totalBooks: 0,
                firstBook: null,
                latestBook: null,
                averagePages: 0,
                genres: [],
                longestBook: null,
                shortestBook: null,
            })
        }

        const booksWithPages = books.filter(b => b.pages !== null)
        const booksWithYear = books.filter(b => b.publishedYear !== null)

        const totalBooks = books.length
        const firstBook = booksWithYear.length > 0 ? {
            title: booksWithYear[0].title,
            year: booksWithYear[0].publishedYear,
        } : null
        const latestBook = booksWithYear.length > 0 ? {
            title: booksWithYear[booksWithYear.length - 1].title,
            year: booksWithYear[booksWithYear.length - 1].publishedYear,
        } : null

        const averagePages = booksWithPages.length > 0
            ? Math.round(booksWithPages.reduce((sum, b) => sum + (b.pages || 0), 0) / booksWithPages.length)
            : 0

        const genres = [...new Set(books.map(b => b.genre).filter(Boolean))] as string[]

        const sortedByPages = [...booksWithPages].sort((a, b) => (a.pages || 0) - (b.pages || 0))
        const longestBook = sortedByPages.length > 0 ? {
            title: sortedByPages[sortedByPages.length - 1].title,
            pages: sortedByPages[sortedByPages.length - 1].pages,
        } : null
        const shortestBook = sortedByPages.length > 0 ? {
            title: sortedByPages[0].title,
            pages: sortedByPages[0].pages,
        } : null

        return NextResponse.json({
            authorId: author.id,
            authorName: author.name,
            totalBooks,
            firstBook,
            latestBook,
            averagePages,
            genres,
            longestBook,
            shortestBook,
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: 'Error al obtener estadísticas del autor' },
            { status: 500 }
        )
    }
}
