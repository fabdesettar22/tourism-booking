from rest_framework.pagination import PageNumberPagination


class OptInPageNumberPagination(PageNumberPagination):
    """Paginate only when the client explicitly requests it via ?page= or ?page_size=.

    Why: switching DRF to default pagination broke list consumers that expect a flat array.
    Existing endpoints keep returning a flat list; new clients can opt-in by sending ?page=1.
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200

    def paginate_queryset(self, queryset, request, view=None):
        if "page" not in request.query_params and self.page_size_query_param not in request.query_params:
            return None
        return super().paginate_queryset(queryset, request, view)
