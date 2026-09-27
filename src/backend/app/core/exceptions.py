from fastapi import HTTPException, status

class NotFoundException(HTTPException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

class ForbiddenException(HTTPException):
    def __init__(self, detail: str = "Access forbidden"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

class UnauthorizedException(HTTPException):
    def __init__(self, detail: str = "Authentication required"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

class DeadlineExpiredException(HTTPException):
    def __init__(self, detail: str = "Submissions are closed for this event"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

class PeerIsolationViolationException(HTTPException):
    def __init__(self, detail: str = "Zero-trust peer isolation prevents viewing peer scores"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
