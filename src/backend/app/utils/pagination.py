from sqlalchemy.sql import Select

def paginate_query(query: Select, page: int = 1, size: int = 50) -> Select:
    offset = max(0, (page - 1) * size)
    return query.limit(size).offset(offset)
