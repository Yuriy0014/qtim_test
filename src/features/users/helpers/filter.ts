export interface UserFilterModel {
    sortBy: string
    sortDirection: 'ASC' | 'DESC'
    pageNumber: number
    pageSize: number
    searchLoginTerm: string
    searchEmailTerm: string
}

export const queryUserPagination = (query: any): UserFilterModel => {
    return {
        sortBy: query.sortBy ?? 'createdAt',
        sortDirection: query.sortDirection === 'asc' ? 'ASC' : 'DESC',
        pageNumber: +(query.pageNumber ?? 1),
        pageSize: +(query.pageSize ?? 10),
        searchLoginTerm: query.searchLoginTerm ?? null,
        searchEmailTerm: query.searchEmailTerm ?? null,
    }
}
