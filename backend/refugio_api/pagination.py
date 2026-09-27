# Pagination used across the API.

from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """
    Page-number pagination that lets the client choose the page size.

    The catalogue asks for a small first page so the public listing loads fast
    and grows with a "Ver más" button; the cap keeps a client from requesting
    the whole table at once.
    """

    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 48
