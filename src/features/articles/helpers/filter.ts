export interface ArticleFilterModel {
    searchTitleTerm: string | null
    sortBy: string
    sortDirection: 'ASC' | 'DESC'
    pageNumber: number
    pageSize: number
}

export const queryArticlePagination = (query: any): ArticleFilterModel => {
    return {
        searchTitleTerm: query.searchTitleTerm ?? null, // Фильтр по названию статьи
        sortBy: query.sortBy ?? 'publicationDate', // Стандартное поле для сортировки - дата публикации
        sortDirection: query.sortDirection === 'asc' ? 'ASC' : 'DESC', // Направление сортировки
        pageNumber: +(query.pageNumber ?? 1), // Номер страницы с дефолтным значением
        pageSize: +(query.pageSize ?? 10), // Размер страницы с дефолтным значением
    }
}
