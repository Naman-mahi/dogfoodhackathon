from enum import Enum

class Role(str, Enum):
    ADMIN = "admin"
    ORGANIZER = "organizer"
    JUDGE = "judge"
    PARTICIPANT = "participant"
    ANONYMOUS = "anonymous"

def is_admin(role: str) -> bool:
    return role == Role.ADMIN

def is_organizer(role: str) -> bool:
    return role in (Role.ORGANIZER, Role.ADMIN)

def is_judge(role: str) -> bool:
    return role in (Role.JUDGE, Role.ORGANIZER, Role.ADMIN)

def is_participant(role: str) -> bool:
    return role in (Role.PARTICIPANT, Role.ORGANIZER, Role.ADMIN)
